import { timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { User, daysSinceAuth, getUser, inactiveAfterDays, listMembers, testDay } from "./user";
import { Vault, ensureVault, tripVault, vaultByUser } from "./vault";

const port = Number(process.env.PORT) || 6346;
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be 1-65535");
}

const runToken = process.env.RUN_TOKEN;
if (!runToken) {
  throw new Error("RUN_TOKEN is missing");
}

const pingUrl = process.env.PING_URL?.trim();
if (pingUrl) {
  try {
    new URL(pingUrl);
  } catch {
    throw new Error("PING_URL must be a URL");
  }
}

const autoRunString = (process.env.AUTO_RUN ?? "false").trim();
if (autoRunString !== "true" && autoRunString !== "false") {
  throw new Error("AUTO_RUN must be true or false");
}
const autoRun = autoRunString === "true";

async function ping(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) console.error(`ping ${res.status}`);
  } catch (error) {
    console.error(`ping ${String(error)}`);
  }
}

function authorized(header: string | undefined) {
  const expected = Buffer.from(`Bearer ${runToken}`);
  const actual = Buffer.from(header ?? "");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

function check(user: User, vault: Vault) {
  const daysLeft = inactiveAfterDays - daysSinceAuth(user);
  const trip = daysLeft <= 0 && vault.items > 0;
  const warn = daysLeft > 0 && daysLeft <= 3 && vault.items > 0;
  return { warn, trip, daysLeft };
}

let running = false;

async function run() {
  if (running) {
    console.warn("already running...");
    return;
  }
  running = true;
  try {
    const events: (
      | { kind: "warn"; email: string; name: string; daysLeft: number }
      | { kind: "trip"; email: string; name: string }
    )[] = [];
    const map = await vaultByUser();
    const members = await listMembers();
    for (const member of members) {
      const vault = await ensureVault(member.id, map);
      const user = await getUser(member.id);
      const { warn, trip, daysLeft } = check(user, vault);
      if (warn) events.push({ kind: "warn", email: user.email, name: user.name, daysLeft });
      if (!trip) continue;
      await tripVault(vault, user, members);
      events.push({ kind: "trip", email: user.email, name: user.name });
    }
    if (pingUrl) await ping(pingUrl);
    return events;
  } catch (error) {
    console.error("run failed", error);
    throw error;
  } finally {
    running = false;
  }
}

createServer(async (req, res) => {
  const path = new URL(req.url ?? "/", "http://lantern").pathname;
  if (req.method === "GET" && path === "/") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("waiting for POST /run...");
    return;
  }
  if (req.method !== "POST" || path !== "/run") {
    console.error("path not found", path);
    res.writeHead(404);
    res.end();
    return;
  }
  if (!authorized(req.headers.authorization)) {
    console.error("unauthorized");
    console.error("authorization bearer token missing or invalid");
    res.writeHead(401);
    res.end();
    return;
  }
  try {
    const result = await run();
    if (result === undefined) {
      res.writeHead(409);
      res.end();
      return;
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(result));
  } catch {
    res.writeHead(500);
    res.end();
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`listening on port ${port}`);
  console.log("waiting for POST /run...");

  if (testDay !== undefined) {
    console.warn("WARNING: TEST_DAY is set, faking last auth for every member");
    console.warn(`TEST_DAY=${testDay}`);
  }
  if (autoRun) {
    console.log("AUTO_RUN=true, running automatically every 24 hours");
    void run().catch(() => {});
    setInterval(() => {
      void run().catch(() => {});
    }, 86_400_000);
  }
});

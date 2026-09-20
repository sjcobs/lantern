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

async function ping(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) console.log(`ping ${res.status}`);
  } catch (error) {
    console.log(`ping ${String(error)}`);
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

async function run() {
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
  return events;
}

let running = false;

createServer(async (req, res) => {
  const path = new URL(req.url ?? "/", "http://lantern").pathname;
  if (req.method === "GET" && path === "/") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("waiting for POST /run...");
    return;
  }
  if (req.method !== "POST" || path !== "/run") {
    console.log("path not found", path);
    res.writeHead(404);
    res.end();
    return;
  }
  if (!authorized(req.headers.authorization)) {
    console.log("unauthorized");
    console.log("make sure authorization bearer token matches RUN_TOKEN");
    res.writeHead(401);
    res.end();
    return;
  }
  if (running) {
    console.log("already running...");
    res.writeHead(409);
    res.end();
    return;
  }
  running = true;
  try {
    const result = await run();
    if (pingUrl) await ping(pingUrl);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(result));
  } catch (error) {
    console.log("run failed", error);
    res.writeHead(500);
    res.end();
  } finally {
    running = false;
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`listening on ${port}`);
  console.log(`POST /run`);

  if (testDay !== undefined) {
    console.log("WARNING: TEST_DAY is set, faking last auth for every member");
    console.log(`TEST_DAY=${testDay}`);
  }
});

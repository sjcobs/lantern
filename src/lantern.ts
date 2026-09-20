import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
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
  const warnings: { email: string; name: string; daysLeft: number }[] = [];
  const trips: { email: string; name: string; vaultId: string }[] = [];
  const map = await vaultByUser();
  const members = await listMembers();
  for (const member of members) {
    const vault = await ensureVault(member.id, map);
    const user = await getUser(member.id);
    const { warn, trip, daysLeft } = check(user, vault);
    if (warn) warnings.push({ email: user.email, name: user.name, daysLeft });
    if (!trip) continue;
    await tripVault(vault, user, members);
    trips.push({ email: user.email, name: user.name, vaultId: vault.id });
  }
  return { warnings, trips };
}

let running = false;

createServer(async (req, res) => {
  const path = new URL(req.url ?? "/", "http://lantern").pathname;
  if (req.method === "GET" && path === "/") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("running");
    return;
  }
  if (req.method !== "POST" || path !== "/run") {
    res.writeHead(404);
    res.end();
    return;
  }
  if (!authorized(req.headers.authorization)) {
    res.writeHead(401, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "unauthorized" }));
    return;
  }
  if (running) {
    res.writeHead(409, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "already running" }));
    return;
  }
  running = true;
  try {
    const result = await run();
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(result));
  } catch (error) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: String(error) }));
  } finally {
    running = false;
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`listening on ${port}, POST /run`);
  if (testDay !== undefined) {
    console.log(`TEST_DAY=${testDay} (fakes last auth for every member)`);
  }
});

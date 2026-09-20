import { createServer } from "node:http";
import { User, daysSinceAuth, getUser, inactiveAfterDays, listMembers } from "./user";
import { Vault, ensureVault, tripVault, vaultByUser } from "./vault";

const port = Number(process.env.PORT) || 6346;

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

createServer(async (req, res) => {
  const path = new URL(req.url ?? "/", "http://lantern").pathname;
  if (req.method !== "POST" || path !== "/run") {
    res.writeHead(404);
    res.end();
    return;
  }
  try {
    const result = await run();
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(result));
  } catch (error) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: String(error) }));
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`listening on ${port}, POST /run`);
});

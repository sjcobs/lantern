import { daysSinceAuth, getUser, inactiveAfterDays, listMembers } from "./user";
import { ensureVault, tripVault, vaultByUser } from "./vault";

async function main() {
  const map = await vaultByUser();
  const members = await listMembers();
  for (const member of members) {
    const vault = await ensureVault(member.id, map);
    const user = await getUser(member.id);
    const days = daysSinceAuth(user);
    const overdue = days >= inactiveAfterDays;
    const wouldTrip = overdue && vault.items > 0;

    console.log(user.id, vault.id, user.last_auth_at, days, inactiveAfterDays, vault.items, wouldTrip);

    if (!wouldTrip) continue;
    await tripVault(vault, user, members);
    console.log(user.id, vault.id, "tripped");
  }
}

main();

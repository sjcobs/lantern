import { listUsers } from "./user";
import { listVaults } from "./vault";

async function main() {
  const vaults = await listVaults();
  for (const vault of vaults) {
    console.log(vault.id, vault.title);
  }

  const users = await listUsers();
  for (const user of users) {
    console.log(user.id, user.email);
  }
}

main();

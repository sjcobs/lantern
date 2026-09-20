import { execa } from "execa";
import { op } from "./sdk";
import { User } from "./user";

export type Vault = {
  id: string;
  title: string;
  items: number;
};

export type VaultUser = {
  id: string;
  name: string;
  email: string;
  type: string;
  state: string;
  permissions: string[];
};

export type VaultByUser = Map<string, Vault>;

const title = (process.env.VAULT_TITLE || "Lantern").trim();
if (!title) {
  throw new Error("VAULT_TITLE is missing");
}

export async function listVaultMembers(vaultId: string) {
  const { stdout } = await execa("op", ["vault", "user", "list", vaultId, "--format=json"]);
  return JSON.parse(stdout) as VaultUser[];
}

export async function createVault() {
  const vault = await op.vaults.create({ title });
  return vault.id;
}

export async function grantVault(vaultId: string, userId: string, permissions: string) {
  await execa("op", [
    "vault",
    "user",
    "grant",
    "--vault",
    vaultId,
    "--user",
    userId,
    "--permissions",
    permissions,
    "--no-input",
  ]);
}

export async function vaultByUser() {
  const map: VaultByUser = new Map();
  const vaults = await op.vaults.list();
  for (const vault of vaults) {
    if (vault.title !== title) continue;
    const members = await listVaultMembers(vault.id);
    if (members.length === 0) {
      await op.vaults.delete(vault.id);
      continue;
    }
    if (members.length !== 1) continue;
    map.set(members[0].id, {
      id: vault.id,
      title: vault.title,
      items: vault.activeItemCount,
    });
  }
  return map;
}

export async function ensureVault(userId: string, map: VaultByUser) {
  const existing = map.get(userId);
  if (existing) return existing;
  const id = await createVault();
  try {
    await grantVault(id, userId, "allow_viewing,allow_editing");
  } catch (error) {
    await op.vaults.delete(id);
    throw error;
  }
  const vault: Vault = { id, title, items: 0 };
  map.set(userId, vault);
  return vault;
}

export async function tripVault(vault: Vault, owner: User, members: User[]) {
  for (const member of members) {
    await grantVault(vault.id, member.id, "allow_viewing,allow_editing");
  }
  const firstName = owner.name.trim().split(/\s+/)[0];
  await op.vaults.update(vault.id, { title: `${title} - ${firstName}` });
  const id = await createVault();
  try {
    await grantVault(id, owner.id, "allow_viewing,allow_editing");
  } catch (error) {
    await op.vaults.delete(id);
    throw error;
  }
}

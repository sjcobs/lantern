import { op } from "./sdk";

// export type Vault = {
//   id: string;
//   name: string;
//   created_at: string;
//   updated_at: string;
//   items: number;
// };

export function listVaults() {
  return op.vaults.list();
}

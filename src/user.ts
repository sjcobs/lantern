import { execa } from "execa";

export type User = {
  id: string;
  name: string;
  email: string;
  type: string;
  state: string;
  created_at: string;
  updated_at: string;
  last_auth_at: string;
};

export async function listUsers() {
  const { stdout } = await execa("op", ["user", "list", "--format=json"]);
  const users: User[] = JSON.parse(stdout);
  return users;
}

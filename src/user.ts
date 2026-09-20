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

export async function listMembers() {
  const { stdout } = await execa("op", ["user", "list", "--format=json"]);
  const members: User[] = JSON.parse(stdout);
  return members;
}

export const inactiveAfterDays = Number(process.env.INACTIVE_AFTER_DAYS) || 30;

export function daysSinceAuth(user: User) {
  if (!user.last_auth_at) {
    throw new Error("last_auth_at is missing");
  }
  const now = Date.now();
  const lastAuth = new Date(user.last_auth_at).getTime();
  const msPerDay = 86_400_000;
  const days = Math.floor((now - lastAuth) / msPerDay);
  return days;
}

export async function getUser(userId: string) {
  const { stdout } = await execa("op", ["user", "get", userId, "--format=json"]);
  return JSON.parse(stdout) as User;
}

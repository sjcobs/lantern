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
if (!Number.isInteger(inactiveAfterDays) || inactiveAfterDays < 7 || inactiveAfterDays > 365) {
  throw new Error("INACTIVE_AFTER_DAYS must be 7-365");
}

export const testDays = process.env.TEST_DAYS === undefined || process.env.TEST_DAYS === ""
  ? undefined
  : Number(process.env.TEST_DAYS);
if (testDays !== undefined && (!Number.isInteger(testDays) || testDays < 0)) {
  throw new Error("TEST_DAYS must be an integer >= 0");
}

export function daysSinceAuth(user: User) {
  if (testDays !== undefined) return testDays;
  const now = Date.now();
  const lastAuth = user.last_auth_at ? new Date(user.last_auth_at).getTime() : now;
  const msPerDay = 86_400_000;
  const days = Math.floor((now - lastAuth) / msPerDay);
  return days;
}

export async function getUser(userId: string) {
  const { stdout } = await execa("op", ["user", "get", userId, "--format=json"]);
  return JSON.parse(stdout) as User;
}

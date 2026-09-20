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

export const inactiveAfterDays = Number(process.env.INACTIVE_AFTER_DAYS) || 90;
if (!Number.isInteger(inactiveAfterDays) || inactiveAfterDays < 7 || inactiveAfterDays > 365) {
  throw new Error("INACTIVE_AFTER_DAYS must be 7-365");
}

const testDayRaw = process.env.TEST_DAY?.trim();
export const testDay = !testDayRaw ? undefined : Number(testDayRaw);
if (testDay !== undefined && (!Number.isInteger(testDay) || testDay < 0)) {
  throw new Error("TEST_DAY must be an integer >= 0");
}

export function daysSinceAuth(user: User) {
  if (testDay !== undefined) return testDay;
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

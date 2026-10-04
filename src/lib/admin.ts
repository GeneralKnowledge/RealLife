import { cookies } from "next/headers";

export const ADMIN_COOKIE = "go_admin_token";

export function getExpectedAdminToken(): string {
  return process.env.ADMIN_TOKEN ?? "dev-admin-token";
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(ADMIN_COOKIE)?.value === getExpectedAdminToken();
}

export function assertAdminToken(token: string | null | undefined): boolean {
  return Boolean(token) && token === getExpectedAdminToken();
}

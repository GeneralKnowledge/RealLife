import { cookies } from "next/headers";

export const ADMIN_COOKIE = "go_admin_session";

export function getExpectedAdminToken(): string {
  const token = process.env.ADMIN_TOKEN;
  if (!token) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ADMIN_TOKEN must be set in production");
    }
    return "dev-admin-token";
  }
  return token;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  const value = jar.get(ADMIN_COOKIE)?.value;
  return Boolean(value) && value === getExpectedAdminToken();
}

/** Accept cookie session or (for scripts) x-admin-token header — never expose token to the browser. */
export async function requireAdmin(request?: Request): Promise<boolean> {
  if (await isAdminAuthenticated()) {
    return true;
  }
  if (request) {
    const headerToken = request.headers.get("x-admin-token");
    if (headerToken && headerToken === getExpectedAdminToken()) {
      return true;
    }
  }
  return false;
}

export function assertAdminToken(token: string | null | undefined): boolean {
  return Boolean(token) && token === getExpectedAdminToken();
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14,
  };
}

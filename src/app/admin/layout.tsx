import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const authed = await isAdminAuthenticated();

  if (!authed) {
    return (
      <div className="admin-shell min-h-screen px-6 py-10">
        <AdminLoginForm />
      </div>
    );
  }

  return (
    <div className="admin-shell min-h-screen">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Get Outside</p>
            <h1 className="text-lg font-semibold">Admin</h1>
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
            <Link href="/admin">Funnel</Link>
            <Link href="/admin/activities">Activities</Link>
            <Link href="/admin/creatives">Creatives</Link>
            <Link href="/admin/social">Social</Link>
            <Link href="/admin/news">News</Link>
            <Link href="/">Public site</Link>
            <AdminLogoutButton />
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}

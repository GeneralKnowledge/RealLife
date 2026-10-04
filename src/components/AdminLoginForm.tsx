"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    setLoading(false);

    if (!response.ok) {
      setError("Invalid admin token");
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-20 max-w-md space-y-4 rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight">Admin access</h1>
      <p className="text-sm text-neutral-600">
        Enter the shared <code>ADMIN_TOKEN</code> from your environment.
      </p>
      <input
        type="password"
        value={token}
        onChange={(event) => setToken(event.target.value)}
        placeholder="Admin token"
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-800"
        required
      />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Checking…" : "Enter admin"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
  status: string;
};

const OPTIONS = ["published", "draft", "hidden"] as const;

export function NewsStatusButtons({ id, status }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(next: (typeof OPTIONS)[number]) {
    if (next === status) return;
    setPending(next);
    setError(null);
    const response = await fetch("/api/news/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
    const data = (await response.json()) as { error?: string };
    setPending(null);
    if (!response.ok) {
      setError(data.error ?? "Update failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1">
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            disabled={pending !== null}
            onClick={() => void setStatus(option)}
            className={`rounded px-2 py-1 text-xs capitalize ${
              status === option
                ? "bg-neutral-900 text-white"
                : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
            } disabled:opacity-60`}
          >
            {pending === option ? "…" : option}
          </button>
        ))}
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const ACTIVITY_TYPES = [
  "",
  "hiking",
  "kayaking",
  "wildlife",
  "climbing",
  "sightseeing",
  "food-drink",
];

export function ActivityFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const [activityType, setActivityType] = useState(searchParams.get("activityType") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [minDuration, setMinDuration] = useState(searchParams.get("minDuration") ?? "");
  const [maxDuration, setMaxDuration] = useState(searchParams.get("maxDuration") ?? "");
  const [minRating, setMinRating] = useState(searchParams.get("minRating") ?? "");
  const [query, setQuery] = useState(searchParams.get("query") ?? "");

  function applyFilters(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (activityType) params.set("activityType", activityType);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (minDuration) params.set("minDuration", minDuration);
    if (maxDuration) params.set("maxDuration", maxDuration);
    if (minRating) params.set("minRating", minRating);
    if (query) params.set("query", query);
    router.push(`/admin/activities?${params.toString()}`);
  }

  return (
    <form onSubmit={applyFilters} className="grid gap-3 rounded-xl border border-neutral-200 bg-white p-4 md:grid-cols-4">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search"
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <input
        value={location}
        onChange={(event) => setLocation(event.target.value)}
        placeholder="Location"
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <select
        value={activityType}
        onChange={(event) => setActivityType(event.target.value)}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      >
        {ACTIVITY_TYPES.map((type) => (
          <option key={type || "any"} value={type}>
            {type ? type : "Any activity type"}
          </option>
        ))}
      </select>
      <input
        value={minRating}
        onChange={(event) => setMinRating(event.target.value)}
        placeholder="Min rating"
        type="number"
        step="0.1"
        min="0"
        max="5"
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <input
        value={minPrice}
        onChange={(event) => setMinPrice(event.target.value)}
        placeholder="Min price"
        type="number"
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <input
        value={maxPrice}
        onChange={(event) => setMaxPrice(event.target.value)}
        placeholder="Max price"
        type="number"
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <input
        value={minDuration}
        onChange={(event) => setMinDuration(event.target.value)}
        placeholder="Min duration (min)"
        type="number"
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <input
        value={maxDuration}
        onChange={(event) => setMaxDuration(event.target.value)}
        placeholder="Max duration (min)"
        type="number"
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white md:col-span-4 md:w-fit"
      >
        Apply filters
      </button>
    </form>
  );
}

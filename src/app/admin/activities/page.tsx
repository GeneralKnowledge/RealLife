import { Suspense } from "react";
import { ActivityFilters } from "@/components/ActivityFilters";
import { GenerateCreativeButton } from "@/components/GenerateCreativeButton";
import { GenerateSocialButton } from "@/components/GenerateSocialButton";
import { SyncButton } from "@/components/SyncButton";
import { listActivities } from "@/lib/activities";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function num(value: string | string[] | undefined) {
  if (typeof value !== "string" || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function str(value: string | string[] | undefined) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export default async function AdminActivitiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const activities = await listActivities({
    location: str(params.location),
    activityType: str(params.activityType),
    minPrice: num(params.minPrice),
    maxPrice: num(params.maxPrice),
    minDurationMinutes: num(params.minDuration),
    maxDurationMinutes: num(params.maxDuration),
    minRating: num(params.minRating),
    query: str(params.query),
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Activities</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Scotland outdoor inventory cached locally from the configured provider.
          </p>
        </div>
        <SyncButton />
      </div>

      <Suspense fallback={<div className="text-sm text-neutral-500">Loading filters…</div>}>
        <ActivityFilters />
      </Suspense>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-[0.12em] text-neutral-500">
            <tr>
              <th className="px-4 py-3">Activity</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {activities.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-neutral-500">
                  No activities match. Sync from the provider or loosen filters.
                </td>
              </tr>
            ) : (
              activities.map((activity) => (
                <tr key={activity.id} className="border-t border-neutral-100 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{activity.title}</p>
                    <p className="mt-1 max-w-sm text-xs text-neutral-500 line-clamp-2">
                      {activity.shortDescription ?? activity.description}
                    </p>
                  </td>
                  <td className="px-4 py-3">{activity.location}</td>
                  <td className="px-4 py-3 capitalize">{activity.activityType}</td>
                  <td className="px-4 py-3">
                    {activity.currency} {activity.priceFrom.toFixed(0)}
                  </td>
                  <td className="px-4 py-3">
                    {activity.durationMinutes
                      ? `${Math.round(activity.durationMinutes / 60)}h`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {activity.rating ? activity.rating.toFixed(1) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <GenerateCreativeButton activityId={activity.id} />
                      <GenerateSocialButton activityId={activity.id} label="Creative + social" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

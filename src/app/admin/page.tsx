import Link from "next/link";
import { getFunnelStats } from "@/lib/analytics";

export const dynamic = "force-dynamic";

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export default async function AdminFunnelPage() {
  const stats = await getFunnelStats();

  const cards = [
    { label: "Creative impressions", value: stats.creativeImpressions },
    { label: "Creative clicks", value: stats.creativeClicks },
    { label: "Landing views", value: stats.landingViews },
    { label: "Affiliate clicks", value: stats.affiliateClicks },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Conversion funnel</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Impression → click → landing → affiliate outbound. The number that answers the MVP question.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-neutral-200 bg-white p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">CTR</p>
          <p className="mt-2 text-2xl font-semibold">{pct(stats.clickThroughRate)}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">Click → landing</p>
          <p className="mt-2 text-2xl font-semibold">{pct(stats.landingConversionRate)}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">Landing → affiliate</p>
          <p className="mt-2 text-2xl font-semibold">{pct(stats.affiliateConversionRate)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-[0.12em] text-neutral-500">
            <tr>
              <th className="px-4 py-3">Creative</th>
              <th className="px-4 py-3">Impr.</th>
              <th className="px-4 py-3">Clicks</th>
              <th className="px-4 py-3">Landing</th>
              <th className="px-4 py-3">Affiliate</th>
            </tr>
          </thead>
          <tbody>
            {stats.byCreative.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-neutral-500">
                  No creatives yet.{" "}
                  <Link href="/admin/activities" className="underline">
                    Sync activities
                  </Link>{" "}
                  and generate one.
                </td>
              </tr>
            ) : (
              stats.byCreative.map((row) => (
                <tr key={row.creativeId} className="border-t border-neutral-100">
                  <td className="px-4 py-3">
                    <Link href={`/admin/creatives/${row.slug}`} className="font-medium underline-offset-2 hover:underline">
                      {row.headline}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.impressions}</td>
                  <td className="px-4 py-3">{row.clicks}</td>
                  <td className="px-4 py-3">{row.landingViews}</td>
                  <td className="px-4 py-3">{row.affiliateClicks}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

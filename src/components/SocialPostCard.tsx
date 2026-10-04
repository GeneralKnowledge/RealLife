import { CopyButton } from "@/components/CopyButton";
import { platformLabel } from "@/lib/social";

type SocialPostCardProps = {
  platform: string;
  format: string;
  caption: string;
  hashtags: string;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl: string;
};

export function SocialPostCard({
  platform,
  format,
  caption,
  hashtags,
  ctaLabel,
  ctaUrl,
  imageUrl,
}: SocialPostCardProps) {
  const fullCopy = `${caption}\n\n${ctaUrl}`;
  const aspect =
    format === "story" ? "aspect-[9/16] max-w-[220px]" : "aspect-square max-w-[280px]";

  return (
    <article className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">{platformLabel(platform)}</p>
          <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">{format}</p>
        </div>
        <div className="flex gap-2">
          <CopyButton text={caption} label="Copy caption" />
          <CopyButton text={fullCopy} label="Copy all" />
        </div>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-[auto_1fr]">
        <div
          className={`${aspect} w-full overflow-hidden bg-cover bg-center`}
          style={{ backgroundImage: `url(${imageUrl})` }}
        >
          <div className="flex h-full flex-col justify-between bg-gradient-to-t from-black/70 via-black/20 to-black/30 p-3 text-white">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-[#e0c07a]">
              GET OUTSIDE
            </p>
            <div>
              <p className="text-xs font-semibold uppercase leading-tight">
                {caption.split("\n")[0]}
              </p>
              <p className="mt-2 inline-flex rounded-full bg-[#c6a15b] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1a160c]">
                {ctaLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <pre className="whitespace-pre-wrap rounded-lg bg-neutral-50 p-3 font-sans text-neutral-800">
            {caption}
          </pre>
          {hashtags ? (
            <p className="text-xs text-neutral-500">
              <span className="font-medium text-neutral-700">Hashtags: </span>
              {hashtags}
            </p>
          ) : null}
          <p className="break-all text-xs text-neutral-500">
            <span className="font-medium text-neutral-700">CTA URL: </span>
            {ctaUrl}
          </p>
        </div>
      </div>
    </article>
  );
}

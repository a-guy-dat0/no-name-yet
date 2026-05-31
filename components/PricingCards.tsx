"use client";

// Pricing cards — glass panels with glow on current/featured tier.
import Link from "next/link";
import { useSession } from "next-auth/react";
import { TIERS, TierId } from "@/lib/tiers";

const ICONS: Record<TierId, React.ReactNode> = {
  0: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"/>
    </svg>
  ),
  1: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>
    </svg>
  ),
  2: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
    </svg>
  ),
  3: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
    </svg>
  ),
};

const ACCENT: Record<TierId, string> = {
  0: "text-gray-400",
  1: "text-indigo-400",
  2: "text-purple-400",
  3: "text-amber-400",
};

const ICON_BG: Record<TierId, string> = {
  0: "bg-gray-500/15 border-gray-500/20",
  1: "bg-indigo-500/15 border-indigo-500/20",
  2: "bg-purple-500/15 border-purple-500/20",
  3: "bg-amber-500/15 border-amber-500/20",
};

export default function PricingCards() {
  const { data: session } = useSession();
  const currentTier = (session?.user as any)?.tier as TierId | undefined;
  const ids: TierId[] = [0, 1, 2, 3];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {ids.map((id) => {
        const t = TIERS[id];
        const isCurrent = currentTier === id;
        const isFeatured = id === 2;

        return (
          <div
            key={id}
            className={`glass glass-hover flex flex-col rounded-3xl p-6 transition-all ${
              isCurrent
                ? "border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.15)]"
                : isFeatured
                ? "border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.08)]"
                : ""
            }`}
          >
            {/* Icon */}
            <div className={`icon-btn mb-4 h-10 w-10 rounded-2xl border ${ICON_BG[id]} ${ACCENT[id]}`}>
              {ICONS[id]}
            </div>

            {/* Name + badge */}
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">{t.name}</h3>
              {isCurrent && (
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                  Current
                </span>
              )}
              {isFeatured && !isCurrent && (
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-medium text-purple-300">
                  Popular
                </span>
              )}
            </div>

            {/* Price */}
            <div className="mt-3 flex items-end gap-1">
              <span className="text-3xl font-bold text-white">
                {t.priceUsd === 0 ? "Free" : `$${t.priceUsd}`}
              </span>
              {t.priceUsd > 0 && (
                <span className="mb-1 text-sm text-gray-500">/mo</span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {t.limit} questions / {t.period}
            </p>

            {/* Highlights */}
            <ul className="mt-5 flex-1 space-y-2.5">
              {t.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-xs text-gray-400">
                  <svg viewBox="0 0 16 16" fill="currentColor"
                       className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${ACCENT[id]}`} aria-hidden="true">
                    <path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/>
                  </svg>
                  {h}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="mt-6">
              {!session ? (
                <Link href="/signin"
                      className="block rounded-2xl btn-brand px-4 py-2.5 text-center text-sm font-semibold text-white">
                  Get started
                </Link>
              ) : isCurrent ? (
                <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] px-4 py-2.5 text-center text-sm text-indigo-300">
                  Current plan
                </div>
              ) : id === 0 ? (
                <Link href="/chat"
                      className="glass glass-hover block rounded-2xl px-4 py-2.5 text-center text-sm text-gray-300">
                  Use free tier
                </Link>
              ) : (
                <Link href={`/pricing?tier=${id}`}
                      className="block rounded-2xl btn-brand px-4 py-2.5 text-center text-sm font-semibold text-white">
                  Subscribe
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

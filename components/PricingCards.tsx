"use client";

import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { TIERS, TierId } from "@/lib/tiers";

export default function PricingCards() {
  const { data: session } = useSession();
  const currentTier = (session?.user as any)?.tier as TierId | undefined;

  const ids: TierId[] = [0, 1, 2, 3];
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {ids.map((id) => {
        const t = TIERS[id];
        const isCurrent = currentTier === id;
        return (
          <div
            key={id}
            className={`flex flex-col rounded-xl border p-6 ${
              isCurrent
                ? "border-brand-600 bg-[var(--panel)]"
                : "border-[var(--border)] bg-[var(--panel)]"
            }`}
          >
            <h3 className="text-lg font-semibold text-white">{t.name}</h3>
            <div className="mt-2 text-3xl font-bold text-white">
              {t.priceUsd === 0 ? "Free" : `$${t.priceUsd}`}
              {t.priceUsd > 0 && (
                <span className="text-sm font-normal text-gray-400">/mo</span>
              )}
            </div>
            <div className="mt-1 text-sm text-gray-300">
              {t.limit} questions per {t.period}
            </div>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-gray-300">
              {t.highlights.map((h) => (
                <li key={h}>• {h}</li>
              ))}
            </ul>
            <div className="mt-6">
              {!session ? (
                <button
                  onClick={() => signIn("google")}
                  className="w-full rounded-md bg-brand-600 px-3 py-2 font-medium text-white hover:bg-brand-700"
                >
                  Sign in to {t.priceUsd === 0 ? "start" : "subscribe"}
                </button>
              ) : isCurrent ? (
                <div className="rounded-md border border-brand-600 px-3 py-2 text-center text-sm text-brand-500">
                  Current plan
                </div>
              ) : id === 0 ? (
                <Link
                  href="/chat"
                  className="block rounded-md border border-[var(--border)] px-3 py-2 text-center text-gray-200 hover:bg-[var(--border)]"
                >
                  Use free tier
                </Link>
              ) : (
                <Link
                  href={`/pricing?tier=${id}`}
                  className="block rounded-md bg-brand-600 px-3 py-2 text-center font-medium text-white hover:bg-brand-700"
                >
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

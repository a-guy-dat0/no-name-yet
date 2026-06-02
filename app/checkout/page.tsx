"use client";

// Checkout page — redirects to the right Gumroad product with email pre-filled.
// When the user completes payment on Gumroad, the webhook at /api/gumroad/webhook
// fires and upgrades their tier automatically.

import { useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TIERS, TierId, WHOP_URLS } from "@/lib/tiers";

function CheckoutRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tierParam = Number(searchParams.get("tier") ?? "1");
  const tier = ([1, 2, 3].includes(tierParam) ? tierParam : 1) as TierId;
  const plan = TIERS[tier];
  const whopUrl = WHOP_URLS[tier];

  useEffect(() => {
    if (status === "loading") return;
    if (!session) { router.push("/signin"); return; }
    if (!whopUrl) return;

    // Pass the user's email as a URL param so Whop can pre-fill the checkout.
    const url = new URL(whopUrl);
    if (session.user.email) url.searchParams.set("email", session.user.email);

    window.location.href = url.toString();
  }, [status, session, whopUrl, router]);

  if (status === "loading" || (status === "authenticated" && whopUrl)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="glass rounded-3xl p-10 text-center max-w-sm w-full">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20">
            <svg className="animate-spin h-6 w-6 text-indigo-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="white" strokeWidth="2.5"/>
              <path className="opacity-80" fill="white" d="M4 12a8 8 0 018-8V2a10 10 0 00-10 10h2z"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white">Taking you to checkout…</h2>
          <p className="mt-2 text-sm text-gray-400">
            {plan.name} — ${plan.priceUsd}/mo · {plan.limit} questions/{plan.period}
          </p>
          <p className="mt-4 text-xs text-gray-600">
            You'll be redirected to our secure payment page.
          </p>
        </div>
        <Link href="/pricing" className="text-xs text-gray-600 hover:text-gray-400">
          ← Back to pricing
        </Link>
      </div>
    );
  }

  return null;
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutRedirect />
    </Suspense>
  );
}

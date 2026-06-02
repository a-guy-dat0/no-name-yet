"use client";

// Custom checkout page — glass card UI, PayPal Advanced Card Fields stub.
// When you have a PayPal Business account, replace the PAYPAL_NOT_CONFIGURED
// block with the real @paypal/react-paypal-js HostedFields integration.

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TIERS, TierId } from "@/lib/tiers";
import { Suspense } from "react";

const PAYPAL_CONFIGURED = false; // flip to true once PayPal Business is set up

function CheckoutForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tierParam = Number(searchParams.get("tier") ?? "1");
  const tier = ([1, 2, 3].includes(tierParam) ? tierParam : 1) as TierId;
  const plan = TIERS[tier];

  const [form, setForm] = useState({ name: "", email: "", card: "", expiry: "", cvv: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Pre-fill email from session
  useEffect(() => {
    if (session?.user?.email) setForm(f => ({ ...f, email: session.user.email ?? "" }));
  }, [session]);

  function formatCard(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExpiry(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + " / " + d.slice(2) : d;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!session) { router.push("/signin"); return; }

    if (!PAYPAL_CONFIGURED) {
      // ── PAYPAL_NOT_CONFIGURED ──────────────────────────────────────────
      // Replace this block with PayPal Advanced Card Fields tokenisation:
      //
      //   const { orderId } = await hostedFields.submit({ ... });
      //   await fetch("/api/paypal/capture-order", {
      //     method: "POST", body: JSON.stringify({ orderId, tier })
      //   });
      //   router.push("/account?subscribed=1");
      // ───────────────────────────────────────────────────────────────────
      setError("Payments are not enabled yet — check back soon!");
      return;
    }

    setBusy(true);
    // Real PayPal flow goes here
    setBusy(false);
    setDone(true);
  }

  if (status === "loading") return null;

  if (done) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="glass rounded-3xl p-10 text-center max-w-sm w-full">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/20 text-green-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">You're subscribed!</h2>
          <p className="mt-2 text-sm text-gray-400">{plan.name} — ${plan.priceUsd}/mo</p>
          <Link href="/chat" className="btn-brand mt-6 block rounded-2xl py-3 text-sm font-semibold text-white">
            Start chatting →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Link href="/pricing" className="mb-6 inline-block text-sm text-gray-500 hover:text-gray-300">
        ← Back to pricing
      </Link>

      <div className="glass rounded-3xl p-8 shadow-2xl shadow-black/40">

        {/* Plan summary */}
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-white">{plan.name}</p>
            <p className="text-xs text-gray-500">{plan.limit} questions / {plan.period}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-white">${plan.priceUsd}</p>
            <p className="text-xs text-gray-600">/month</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs text-gray-500">Full name</label>
            <input
              type="text"
              required
              placeholder="John Smith"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-xs text-gray-500">Email</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
            />
          </div>

          {/* Card number */}
          <div>
            <label className="mb-1.5 block text-xs text-gray-500">Card number</label>
            <div className="relative">
              <input
                type="text"
                required
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                value={form.card}
                onChange={e => setForm(f => ({ ...f, card: formatCard(e.target.value) }))}
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 pr-12 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
              />
              {/* Card type icon area */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 opacity-40">
                <svg viewBox="0 0 38 24" className="h-5 w-auto" aria-hidden="true">
                  <rect width="38" height="24" rx="4" fill="#1a1f2b"/>
                  <circle cx="15" cy="12" r="7" fill="#eb001b" opacity="0.9"/>
                  <circle cx="23" cy="12" r="7" fill="#f79e1b" opacity="0.9"/>
                  <path d="M19 6.8a7 7 0 010 10.4A7 7 0 0119 6.8z" fill="#ff5f00"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Expiry + CVV */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs text-gray-500">Expiry</label>
              <input
                type="text"
                required
                inputMode="numeric"
                placeholder="MM / YY"
                value={form.expiry}
                onChange={e => setForm(f => ({ ...f, expiry: formatExpiry(e.target.value) }))}
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-gray-500">CVV</label>
              <input
                type="text"
                required
                inputMode="numeric"
                placeholder="•••"
                maxLength={4}
                value={form.cvv}
                onChange={e => setForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-xs text-amber-300">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={busy}
            className="btn-brand w-full rounded-2xl py-3.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Processing…" : `Subscribe — $${plan.priceUsd}/mo`}
          </button>

          {/* Trust line */}
          <p className="flex items-center justify-center gap-1.5 text-xs text-gray-600">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-gray-600" aria-hidden="true">
              <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd"/>
            </svg>
            Secured by PayPal · Cancel anytime
          </p>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutForm />
    </Suspense>
  );
}

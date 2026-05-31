// Account page — glass panels for profile, plan, and usage.
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUsage } from "@/lib/usage";
import { TIERS } from "@/lib/tiers";
import CancelButton from "@/components/CancelButton";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const usage = await getUsage(session.user.id);
  const tier = TIERS[(user?.tier ?? 0) as 0 | 1 | 2 | 3];
  const pct = Math.round((usage.used / usage.limit) * 100);

  return (
    <div className="mx-auto max-w-2xl space-y-5 py-8">
      <h1 className="text-2xl font-bold text-white">Your account</h1>

      {/* Profile */}
      <div className="glass rounded-3xl p-6">
        <div className="flex items-center gap-4">
          <div className="icon-btn h-12 w-12 rounded-2xl border-white/[0.1] bg-white/[0.05] text-gray-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                 className="h-5 w-5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{session.user.name ?? "—"}</p>
            <p className="text-xs text-gray-500">{session.user.email}</p>
          </div>
        </div>
      </div>

      {/* Plan */}
      <div className="glass rounded-3xl p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Current plan</p>
            <p className="mt-1 text-lg font-semibold text-white">{tier.name}</p>
            <p className="text-sm text-gray-400">
              {tier.limit} questions / {tier.period}
              {tier.priceUsd > 0 && ` — $${tier.priceUsd}/mo`}
            </p>
            {user?.subscriptionStatus && (
              <p className="mt-1 text-xs text-gray-600">
                Status: {user.subscriptionStatus}
                {user.subscriptionRenewsAt &&
                  ` · renews ${user.subscriptionRenewsAt.toLocaleDateString()}`}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Link href="/pricing"
                  className="btn-brand rounded-xl px-4 py-2 text-sm font-semibold text-white">
              Change plan
            </Link>
            {user?.paypalSubscriptionId && user.subscriptionStatus === "ACTIVE" && (
              <CancelButton />
            )}
          </div>
        </div>

        {/* Usage bar */}
        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-gray-500">This {usage.period}</span>
            <span className="text-gray-400">
              <span className="text-white">{usage.used}</span> / {usage.limit} questions
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full transition-all ${
                pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-indigo-500"
              }`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-600">
            Resets {new Date(usage.resetsAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

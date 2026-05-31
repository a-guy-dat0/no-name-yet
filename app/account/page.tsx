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

  return (
    <div className="space-y-8 py-6">
      <h1 className="text-3xl font-bold text-white">Your account</h1>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-6">
        <h2 className="text-lg font-semibold text-white">Profile</h2>
        <p className="mt-2 text-sm text-gray-300">
          Signed in as <span className="text-white">{session.user.email}</span>
        </p>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-6">
        <h2 className="text-lg font-semibold text-white">Current plan</h2>
        <p className="mt-2 text-gray-300">
          <span className="font-medium text-white">{tier.name}</span> — {tier.limit} questions per {tier.period}
          {tier.priceUsd > 0 && ` — $${tier.priceUsd}/mo`}
        </p>
        {user?.subscriptionStatus && (
          <p className="mt-1 text-sm text-gray-400">
            Status: {user.subscriptionStatus}
            {user.subscriptionRenewsAt && ` — renews ${user.subscriptionRenewsAt.toLocaleDateString()}`}
          </p>
        )}
        <p className="mt-4 text-sm text-gray-300">
          This {usage.period}: {usage.used} of {usage.limit} questions used.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/pricing"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Change plan
          </Link>
          {user?.paypalSubscriptionId && user.subscriptionStatus === "ACTIVE" && (
            <CancelButton />
          )}
        </div>
      </section>
    </div>
  );
}

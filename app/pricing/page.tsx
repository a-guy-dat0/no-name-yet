import PaypalCheckout from "@/components/PaypalCheckout";
import PricingCards from "@/components/PricingCards";
import { TIERS, TierId } from "@/lib/tiers";

// Next.js App Router passes searchParams as string | string[] | undefined per key
export default function PricingPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const raw = Array.isArray(searchParams.tier) ? searchParams.tier[0] : searchParams.tier;
  const tierParam = raw ? Number(raw) : null;
  const selectedTier =
    tierParam === 1 || tierParam === 2 || tierParam === 3
      ? (tierParam as TierId)
      : null;

  return (
    <div className="space-y-10 py-6">
      <h1 className="text-3xl font-bold text-white">Plans & pricing</h1>
      <PricingCards />

      {selectedTier && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-6">
          <h2 className="text-xl font-semibold text-white">
            Subscribe to {TIERS[selectedTier].name} — ${TIERS[selectedTier].priceUsd}/mo
          </h2>
          <p className="mt-2 text-sm text-gray-300">
            Pay securely with PayPal. Cancel anytime from your Account page.
          </p>
          <div className="mt-6 max-w-md">
            <PaypalCheckout tier={selectedTier} />
          </div>
        </section>
      )}
    </div>
  );
}

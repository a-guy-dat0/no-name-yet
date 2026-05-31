import Link from "next/link";
import PricingCards from "@/components/PricingCards";

export default function LandingPage() {
  return (
    <div className="space-y-16 py-10">
      <section className="text-center">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          Uncensored AI, on your terms.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
          {"{no name yet}"} runs a powerful open-source model on dedicated
          hardware. No filters, no nagging — just answers. Sign in with Google
          and start chatting in seconds.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/chat"
            className="rounded-md bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700"
          >
            Start chatting
          </Link>
          <Link
            href="/pricing"
            className="rounded-md border border-[var(--border)] px-5 py-2 font-medium text-gray-200 hover:bg-[var(--border)]"
          >
            See pricing
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-center text-2xl font-semibold text-white">
          Pick a plan
        </h2>
        <PricingCards />
      </section>
    </div>
  );
}

// Landing page — glassmorphism hero + pricing preview
import Link from "next/link";
import PricingCards from "@/components/PricingCards";

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 space-y-24 py-16">

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl text-center">
        {/* Pill badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_6px_2px_rgba(99,102,241,0.6)]" />
          <span className="text-xs font-medium tracking-wide text-gray-300">
            Uncensored · Open-source · Private
          </span>
        </div>

        <h1 className="text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
          Ask anything.{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Get answers.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-gray-400">
          {"{ask-it}"} is a powerful AI assistant that gives you thoughtful,
          detailed answers on any topic. Sign in and start chatting in seconds.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/chat"
            className="btn-brand rounded-xl px-6 py-2.5 text-sm font-semibold text-white"
          >
            Start chatting →
          </Link>
          <Link
            href="/pricing"
            className="glass glass-hover rounded-xl px-6 py-2.5 text-sm font-semibold text-gray-200"
          >
            See pricing
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-12 flex flex-wrap justify-center gap-6">
          {[
            { label: "Questions / mo free", value: "5" },
            { label: "Paid questions / wk", value: "25–200" },
            { label: "Model params", value: "26B" },
          ].map(({ label, value }) => (
            <div key={label} className="glass rounded-2xl px-6 py-4 text-center min-w-[130px]">
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="mt-0.5 text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing preview ──────────────────────────── */}
      <section>
        <h2 className="mb-8 text-center text-xl font-semibold text-gray-300">
          Simple, transparent pricing
        </h2>
        <PricingCards />
      </section>

    </div>
  );
}

"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
// Sign-in routes to /signin page which supports both Google and email magic link.
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TierId } from "@/lib/tiers";

const PLAN_IDS: Record<TierId, string | undefined> = {
  0: undefined,
  1: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_TIER1,
  2: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_TIER2,
  3: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_TIER3
};

export default function PaypalCheckout({ tier }: { tier: TierId }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const planId = PLAN_IDS[tier];

  if (status === "loading") return <p className="text-gray-400">Loading…</p>;
  if (!session) {
    return (
      <a
        href="/signin"
        className="inline-block rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
      >
        Sign in to subscribe
      </a>
    );
  }
  if (!clientId || !planId) {
    return (
      <p className="text-sm text-yellow-400">
        PayPal isn’t configured yet. Set <code>NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> and the plan IDs in <code>.env</code>.
      </p>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        vault: true,
        intent: "subscription",
        components: "buttons"
      }}
    >
      <PayPalButtons
        style={{ shape: "rect", color: "blue", layout: "vertical", label: "subscribe" }}
        createSubscription={(_, actions) =>
          actions.subscription.create({ plan_id: planId })
        }
        onApprove={async (data) => {
          const res = await fetch("/api/paypal/create-subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscriptionId: data.subscriptionID })
          });
          if (res.ok) {
            router.push("/account?subscribed=1");
          } else {
            const j = await res.json().catch(() => ({}));
            alert("Subscription saved on PayPal but failed to record locally: " + (j.error ?? res.status));
          }
        }}
        onError={(err) => {
          console.error(err);
          alert("PayPal error. Please try again.");
        }}
      />
    </PayPalScriptProvider>
  );
}

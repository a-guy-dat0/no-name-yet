// PayPal webhook endpoint. Configure this URL in the PayPal dashboard:
//   {NEXTAUTH_URL}/api/paypal/webhook
// Subscribe to at least:
//   BILLING.SUBSCRIPTION.ACTIVATED
//   BILLING.SUBSCRIPTION.CANCELLED
//   BILLING.SUBSCRIPTION.SUSPENDED
//   BILLING.SUBSCRIPTION.EXPIRED
//   BILLING.SUBSCRIPTION.PAYMENT.FAILED
//   PAYMENT.SALE.COMPLETED

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/paypal";
import { tierFromPlanId } from "@/lib/tiers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const ok = await verifyWebhookSignature(req.headers, raw);
  if (!ok) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const event = JSON.parse(raw);
  const type: string = event.event_type;
  const resource = event.resource ?? {};
  const subscriptionId: string | undefined = resource.id ?? resource.billing_agreement_id;

  if (!subscriptionId) {
    return NextResponse.json({ ok: true, skipped: "no subscription id" });
  }

  // Find the user this subscription is attached to.
  const user = await prisma.user.findUnique({
    where: { paypalSubscriptionId: subscriptionId }
  });
  if (!user) {
    // No matching user yet — this can happen if the webhook arrives before the
    // browser callback. Acknowledge and move on.
    return NextResponse.json({ ok: true, note: "user not found yet" });
  }

  switch (type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED": {
      const planId: string | undefined = resource.plan_id;
      const tier = planId ? tierFromPlanId(planId) : null;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: "ACTIVE",
          tier: tier ?? user.tier,
          subscriptionRenewsAt: resource.billing_info?.next_billing_time
            ? new Date(resource.billing_info.next_billing_time)
            : null
        }
      });
      break;
    }
    case "BILLING.SUBSCRIPTION.CANCELLED":
    case "BILLING.SUBSCRIPTION.EXPIRED":
    case "BILLING.SUBSCRIPTION.SUSPENDED":
    case "BILLING.SUBSCRIPTION.PAYMENT.FAILED": {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: type.split(".").pop() ?? "CANCELLED",
          // Drop them back to the free tier on cancellation/expiration.
          tier: type === "BILLING.SUBSCRIPTION.PAYMENT.FAILED" ? user.tier : 0
        }
      });
      break;
    }
    default: {
      // Unhandled event — log and acknowledge.
      console.log("[paypal-webhook] Unhandled event", type);
    }
  }

  return NextResponse.json({ ok: true });
}

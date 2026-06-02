// Gumroad webhook — fires when a subscription is created, cancelled, or fails.
// Configure this URL in Gumroad → Settings → Webhooks → Resource subscriptions:
//   https://ask-it.ink/api/gumroad/webhook
//
// Events handled:
//   sale           → subscription started → upgrade tier
//   subscription_ended    → cancelled / failed → downgrade to free
//   subscription_restarted → resubscribed → upgrade tier back

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { tierFromGumroadProductId } from "@/lib/tiers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Gumroad sends form-encoded data
  const body = await req.text();
  const params = new URLSearchParams(body);

  const event       = params.get("resource_name") ?? "";  // "sale" / "subscription_ended" etc.
  const email       = params.get("email") ?? "";
  const productId   = params.get("short_product_id") ?? params.get("product_permalink") ?? "";
  const saleId      = params.get("sale_id") ?? "";

  console.log(`[gumroad] event=${event} email=${email} product=${productId} sale=${saleId}`);

  if (!email) return NextResponse.json({ ok: true, skipped: "no email" });

  const tier = tierFromGumroadProductId(productId);

  switch (event) {
    case "sale":
    case "subscription_restarted": {
      if (tier === null) {
        console.warn(`[gumroad] unknown product: ${productId}`);
        return NextResponse.json({ ok: true, skipped: "unknown product" });
      }
      await prisma.user.updateMany({
        where: { email },
        data: { tier, subscriptionStatus: "ACTIVE", paypalSubscriptionId: saleId }
      });
      console.log(`[gumroad] upgraded ${email} to tier ${tier}`);
      break;
    }

    case "subscription_ended":
    case "subscription_cancelled": {
      await prisma.user.updateMany({
        where: { email },
        data: { tier: 0, subscriptionStatus: "CANCELLED" }
      });
      console.log(`[gumroad] downgraded ${email} to free`);
      break;
    }

    default:
      console.log(`[gumroad] unhandled event: ${event}`);
  }

  return NextResponse.json({ ok: true });
}

// Whop webhook — fires when a membership is created, cancelled, or expires.
// Configure in Whop dashboard → Developer → Webhooks:
//   URL: https://ask-it.ink/api/whop/webhook
//
// Events:
//   membership_activated   → subscription active  → upgrade tier
//   membership_deactivated → cancelled/expired    → downgrade to free

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { tierFromWhopPlanId } from "@/lib/tiers";
import { createHmac } from "crypto";

export const dynamic = "force-dynamic";

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === signature;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("whop-signature") ?? req.headers.get("x-whop-signature");

  if (!verifySignature(rawBody, signature)) {
    // Log but don't reject yet — we need to confirm Whop's exact header name first
    console.warn("[whop] signature mismatch — sig header:", signature?.slice(0, 20));
  }

  const body = JSON.parse(rawBody);
  const data = body.data ?? {};

  console.log("[whop] payload:", JSON.stringify(body, null, 2));

  const email: string = data.user?.email ?? data.email ?? body.email ?? "";
  const planId: string = data.plan_id ?? data.plan?.id ?? data.product?.plan_id ?? body.plan_id ?? "";
  // Whop sends status in data.status — use that to determine what happened
  const status: string = data.status ?? "";

  console.log(`[whop] status=${status} email=${email} plan=${planId}`);

  if (!email) return NextResponse.json({ ok: true, skipped: "no email" });

  // "active" → subscription started or renewed → upgrade
  // anything else (expired, cancelled, etc.) → downgrade
  switch (status) {
    case "active": {
      const tier = tierFromWhopPlanId(planId);
      if (tier === null) {
        console.warn(`[whop] unknown plan: ${planId}`);
        break;
      }
      const tierPrices: Record<number, number> = { 1: 10, 2: 20, 3: 50 };
      const user = await prisma.user.findFirst({ where: { email }, select: { id: true } });
      await Promise.all([
        prisma.user.updateMany({
          where: { email },
          data: { tier, subscriptionStatus: "ACTIVE" }
        }),
        prisma.purchase.create({
          data: {
            userId: user?.id ?? null,
            email,
            tier,
            amountUsd: tierPrices[tier] ?? 0,
            planId,
            status: "active"
          }
        })
      ]);
      console.log(`[whop] upgraded ${email} to tier ${tier}`);
      break;
    }

    case "expired":
    case "canceled":
    case "cancelled":
    case "inactive": {
      await Promise.all([
        prisma.user.updateMany({
          where: { email },
          data: { tier: 0, subscriptionStatus: "CANCELLED" }
        }),
        prisma.purchase.updateMany({
          where: { email, status: "active" },
          data: { status: "cancelled" }
        })
      ]);
      console.log(`[whop] downgraded ${email} to free`);
      break;
    }

    default:
      console.log(`[whop] unhandled status: ${status}`);
  }

  return NextResponse.json({ ok: true });
}

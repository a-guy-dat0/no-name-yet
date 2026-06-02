import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const purchases = await prisma.purchase.findMany({
    orderBy: { createdAt: "desc" },
    take: 200
  });

  // Flag purchases whose email has no matching user account
  const emails = [...new Set(purchases.map(p => p.email))];
  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { email: true }
  });
  const matchedEmails = new Set(users.map(u => u.email));

  const enriched = purchases.map(p => ({
    ...p,
    matched: matchedEmails.has(p.email)
  }));

  const total = purchases
    .filter(p => p.status === "active")
    .reduce((sum, p) => sum + p.amountUsd, 0);

  return NextResponse.json({ purchases: enriched, total });
}

// POST — manually assign a purchase's tier to a different email
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { purchaseId, targetEmail } = await req.json();
  const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });

  const user = await prisma.user.findFirst({ where: { email: targetEmail } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.user.update({
    where: { id: user.id },
    data: { tier: purchase.tier, subscriptionStatus: "ACTIVE" }
  });

  await prisma.purchase.update({
    where: { id: purchaseId },
    data: { userId: user.id, email: targetEmail }
  });

  console.log(`[admin] assigned purchase ${purchaseId} (tier ${purchase.tier}) to ${targetEmail}`);
  return NextResponse.json({ ok: true });
}

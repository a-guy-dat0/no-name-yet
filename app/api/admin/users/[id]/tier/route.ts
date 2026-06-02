import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { tier } = await req.json();
  if (![0, 1, 2, 3].includes(tier))
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { tier, subscriptionStatus: tier > 0 ? "ACTIVE" : null },
    select: { email: true, tier: true }
  });

  console.log(`[admin] tier changed — email=${user.email} tier=${user.tier} by=${session!.user.email}`);
  return NextResponse.json(user);
}

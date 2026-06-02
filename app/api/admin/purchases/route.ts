import { NextResponse } from "next/server";
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

  const total = purchases
    .filter(p => p.status === "active")
    .reduce((sum, p) => sum + p.amountUsd, 0);

  return NextResponse.json({ purchases, total });
}

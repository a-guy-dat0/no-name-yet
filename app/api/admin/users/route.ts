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

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      tier: true,
      createdAt: true,
      tosAcceptedAt: true,
      subscriptionStatus: true,
      _count: { select: { conversations: true, questions: true } }
    }
  });

  return NextResponse.json(users);
}

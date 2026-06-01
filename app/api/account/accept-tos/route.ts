import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const now = new Date();
  await prisma.user.update({
    where: { id: session.user.id },
    data: { tosAcceptedAt: now }
  });

  // Log acceptance so there's an audit trail in the server logs
  console.log(
    `[tos] accepted — email=${session.user.email} userId=${session.user.id} at=${now.toISOString()}`
  );

  return NextResponse.json({ ok: true, acceptedAt: now.toISOString() });
}

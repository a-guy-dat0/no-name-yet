import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const conversations = await prisma.conversation.findMany({
    where: { userId: params.id },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "asc" } }
    }
  });

  return NextResponse.json(conversations);
}

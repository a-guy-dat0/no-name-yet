// GET    /api/conversations/[id] — fetch all messages in a conversation
// DELETE /api/conversations/[id] — delete a conversation + its memory entries

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clearConversationMemory } from "@/lib/memory";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const conv = await prisma.conversation.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } }
    }
  });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(conv);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // Remove memory entries tagged with this conversation before deleting it.
  await clearConversationMemory(session.user.id, params.id);

  await prisma.conversation.deleteMany({
    where: { id: params.id, userId: session.user.id }
  });
  return NextResponse.json({ ok: true });
}

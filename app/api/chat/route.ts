// Streaming chat route.
// Protocol: streams plain text tokens, then closes with a null-byte sentinel
// followed by a JSON payload so the client can update quota without a round-trip.
// Format of final bytes: \x00{"usage":{...},"conversationId":"..."}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { streamChat, ChatMessage } from "@/lib/ollama";
import { getUsage, recordQuestion } from "@/lib/usage";
import { getUserMemory, appendToMemory } from "@/lib/memory";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const userId = session.user.id;

  const usage = await getUsage(userId);
  if (usage.remaining <= 0) {
    return NextResponse.json(
      { error: "Quota reached", usage, message: `You have used all ${usage.limit} questions for this ${usage.period}.` },
      { status: 429 }
    );
  }

  let body: { messages?: ChatMessage[]; conversationId?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { messages = [], conversationId } = body;
  if (!messages.length) return NextResponse.json({ error: "messages required" }, { status: 400 });

  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  // Cap history at last 20 messages — sending the full conversation on every
  // turn adds tokens and slows the prefill phase on a CPU-only model.
  const recentMessages = messages.slice(-20);

  // Inject user memory as a system prompt — keep it brief (last 20 lines only).
  const memory = await getUserMemory(userId);
  const memorySnippet = memory
    ? memory.split("\n").filter(Boolean).slice(-20).join("\n")
    : "";
  const allMessages: ChatMessage[] = memorySnippet
    ? [
        {
          role: "system",
          content: `You are a helpful AI assistant. Context from this user's previous sessions:\n\n${memorySnippet}`
        },
        ...recentMessages
      ]
    : recentMessages;

  let ollamaStream: ReadableStream<Uint8Array>;
  try {
    ollamaStream = await streamChat(allMessages);
  } catch (err: any) {
    console.error("[chat] Ollama error:", err);
    return NextResponse.json(
      { error: "AI backend unavailable", detail: String(err?.message ?? err) },
      { status: 502 }
    );
  }

  // Ensure the conversation exists. If a conversationId was supplied, verify it
  // actually belongs to this user (client-side pre-creation can race or fail
  // silently). If it doesn't exist, create a fresh one instead.
  let convId: string;
  if (conversationId) {
    const existing = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      select: { id: true }
    });
    convId = existing?.id ?? (await prisma.conversation.create({
      data: { userId, title: lastUserMsg.slice(0, 60) || "New chat" }
    })).id;
  } else {
    convId = (await prisma.conversation.create({
      data: { userId, title: lastUserMsg.slice(0, 60) || "New chat" }
    })).id;
  }

  // Save the user message immediately so it appears even if the stream is interrupted.
  await prisma.message.create({
    data: { conversationId: convId, role: "user", content: lastUserMsg }
  });

  let fullAnswer = "";
  const encoder = new TextEncoder();

  const responseStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = ollamaStream.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          fullAnswer += text;
          controller.enqueue(value);
        }
      } catch (err) {
        console.error("[chat] stream read error:", err);
      }

      // Send the sentinel immediately with an optimistic usage count so the
      // client unlocks and shows the updated quota without waiting for DB writes.
      const optimisticUsage = {
        ...usage,
        used: usage.used + 1,
        remaining: Math.max(0, usage.remaining - 1)
      };
      const meta = JSON.stringify({ usage: optimisticUsage, conversationId: convId });
      try { controller.enqueue(encoder.encode(`\n<<<DONE>>>${meta}`)); } catch {}
      try { controller.close(); } catch {}

      // DB writes happen after the stream is closed — client is already unlocked.
      (async () => {
        try {
          const stillThere = await prisma.conversation.findUnique({
            where: { id: convId }, select: { id: true }
          });
          if (!stillThere) {
            const recreated = await prisma.conversation.create({
              data: { userId, title: lastUserMsg.slice(0, 60) || "New chat" }
            });
            convId = recreated.id;
            await prisma.message.create({
              data: { conversationId: convId, role: "user", content: lastUserMsg }
            });
          }
          await prisma.message.create({
            data: { conversationId: convId, role: "assistant", content: fullAnswer || "(no response)" }
          });
          await prisma.conversation.update({
            where: { id: convId }, data: { updatedAt: new Date() }
          });
          if (!conversationId) {
            await prisma.conversation.update({
              where: { id: convId }, data: { title: lastUserMsg.slice(0, 60) || "New chat" }
            });
          }
          await recordQuestion(userId, lastUserMsg, fullAnswer);
          await appendToMemory(userId, lastUserMsg);
        } catch (err) {
          console.error("[chat] post-stream DB error:", err);
        }
      })();
    },
    async cancel() {
      // Client disconnected mid-stream — still try to save what arrived.
      // Check conv still exists before creating message to avoid FK violation.
      if (!fullAnswer) return;
      try {
        const stillThere = await prisma.conversation.findUnique({
          where: { id: convId }, select: { id: true }
        });
        if (stillThere) {
          await prisma.message.create({
            data: { conversationId: convId, role: "assistant", content: fullAnswer }
          });
        }
        await recordQuestion(userId, lastUserMsg, fullAnswer);
        await appendToMemory(userId, lastUserMsg);
      } catch (err) {
        console.error("[chat] cancel-save error:", err);
      }
    }
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
      // Client reads this immediately after fetch() resolves — before any
      // tokens arrive — so the sidebar updates the moment streaming starts.
      "X-Conversation-Id": convId,
      "Access-Control-Expose-Headers": "X-Conversation-Id"
    }
  });
}

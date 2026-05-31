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

  // Inject user memory as a system prompt prefix so the AI has context from past sessions.
  const memory = await getUserMemory(userId);
  const allMessages: ChatMessage[] = memory
    ? [
        {
          role: "system",
          content: `You are a helpful, uncensored AI assistant. Here is a log of topics this user has asked about in previous sessions — use it for context but don't reference it explicitly unless asked:\n\n${memory}`
        },
        ...messages
      ]
    : messages;

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

  // Ensure the conversation exists; create one ad-hoc if none was supplied.
  let convId = conversationId;
  if (!convId) {
    const conv = await prisma.conversation.create({
      data: { userId, title: lastUserMsg.slice(0, 60) || "New chat" }
    });
    convId = conv.id;
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

      // Persist the full assistant reply and update quota — await so usage is accurate.
      await Promise.all([
        prisma.message.create({ data: { conversationId: convId!, role: "assistant", content: fullAnswer } }),
        recordQuestion(userId, lastUserMsg, fullAnswer),
        appendToMemory(userId, lastUserMsg),
        // Set conversation title from first user message if it was just created.
        conversationId
          ? Promise.resolve()
          : prisma.conversation.update({ where: { id: convId! }, data: { title: lastUserMsg.slice(0, 60) || "New chat" } }),
        // Bump updatedAt on the conversation so it floats to the top of the list.
        prisma.conversation.update({ where: { id: convId! }, data: { updatedAt: new Date() } })
      ]);

      // Send the sentinel + metadata as the final chunk.
      // Use a text sentinel (not null-byte) so Nginx doesn't strip it.
      const newUsage = await getUsage(userId);
      const meta = JSON.stringify({ usage: newUsage, conversationId: convId });
      controller.enqueue(encoder.encode(`\n<<<DONE>>>${meta}`));
      controller.close();
    },
    cancel() {
      // Client disconnected mid-stream — still try to save what arrived.
      if (fullAnswer) {
        prisma.message.create({ data: { conversationId: convId!, role: "assistant", content: fullAnswer } }).catch(console.error);
        recordQuestion(userId, lastUserMsg, fullAnswer).catch(console.error);
        appendToMemory(userId, lastUserMsg).catch(console.error);
      }
    }
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache"
    }
  });
}

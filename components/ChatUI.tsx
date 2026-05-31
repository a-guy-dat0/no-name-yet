"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface Usage {
  tier: 0 | 1 | 2 | 3;
  limit: number;
  period: "week" | "month";
  used: number;
  remaining: number;
  resetsAt: string | Date;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatUI({ initialUsage }: { initialUsage: Usage }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [usage, setUsage] = useState<Usage>(initialUsage);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || busy) return;
    setError(null);
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || json.error || `Error ${res.status}`);
        if (json.usage) setUsage(json.usage);
      } else {
        setMessages([...next, { role: "assistant", content: json.answer }]);
        if (json.usage) setUsage(json.usage);
      }
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setBusy(false);
    }
  }

  const outOfQuota = usage.remaining <= 0;

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <div className="mb-3 flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm">
        <div className="text-gray-300">
          Tier {usage.tier} — <span className="text-white">{usage.remaining}</span> of {usage.limit} questions left this {usage.period}
        </div>
        <Link href="/pricing" className="text-brand-500 hover:underline">
          {usage.tier === 0 ? "Upgrade" : "Change plan"}
        </Link>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-md border border-[var(--border)] bg-[var(--panel)] p-4"
      >
        {messages.length === 0 && (
          <p className="text-center text-gray-400">
            Ask anything to get started.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-lg px-4 py-2 ${
              m.role === "user"
                ? "ml-auto bg-brand-600 text-white"
                : "bg-[#1a1f2b] text-gray-100"
            }`}
          >
            <div className="prose-chat text-sm">
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {busy && (
          <div className="max-w-[85%] rounded-lg bg-[#1a1f2b] px-4 py-2 text-sm text-gray-300">
            Thinking…
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-900/40 px-4 py-2 text-sm text-red-200">
            {error}
            {outOfQuota && (
              <>
                {" "}
                <Link href="/pricing" className="underline">
                  Upgrade your plan
                </Link>
                .
              </>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy || outOfQuota}
          placeholder={outOfQuota ? "You're out of questions for this period." : "Type a message…"}
          className="flex-1 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-white placeholder-gray-500 outline-none focus:border-brand-600"
        />
        <button
          type="submit"
          disabled={busy || outOfQuota || !input.trim()}
          className="rounded-md bg-brand-600 px-5 py-2 font-medium text-white disabled:opacity-50 hover:bg-brand-700"
        >
          Send
        </button>
      </form>
    </div>
  );
}

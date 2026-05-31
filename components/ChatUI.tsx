"use client";

// Chat interface — glass panels, smooth scroll, markdown rendering.
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
        body: JSON.stringify({ messages: next }),
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
    <div className="flex h-[calc(100vh-5rem)] flex-col gap-3">

      {/* Usage bar */}
      <div className="glass flex items-center justify-between rounded-2xl px-4 py-2.5 text-xs">
        <div className="flex items-center gap-3 text-gray-400">
          <span className="inline-flex h-6 items-center rounded-lg bg-white/[0.05] px-2.5 font-mono text-gray-300">
            Tier {usage.tier}
          </span>
          <span>
            <span className={usage.remaining <= 2 ? "text-amber-400" : "text-white"}>
              {usage.remaining}
            </span>
            {" / "}{usage.limit} questions left this {usage.period}
          </span>
        </div>
        <Link href="/pricing" className="text-indigo-400 hover:text-indigo-300 hover:underline">
          {usage.tier === 0 ? "Upgrade ↑" : "Change plan"}
        </Link>
      </div>

      {/* Message list */}
      <div
        ref={scrollRef}
        className="glass flex-1 space-y-4 overflow-y-auto rounded-3xl p-5"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="icon-btn h-12 w-12 rounded-2xl border-white/[0.1] bg-indigo-500/10 text-indigo-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                   className="h-5 w-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
              </svg>
            </div>
            <p className="text-sm text-gray-500">Ask anything to get started.</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                m.role === "user"
                  ? "btn-brand text-white"
                  : "glass text-gray-100"
              }`}
            >
              <div className="prose-chat">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex justify-start">
            <div className="glass flex items-center gap-2 rounded-2xl px-4 py-3 text-sm text-gray-400">
              <span className="flex gap-1">
                {[0,1,2].map(i => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-gray-500 animate-pulse"
                        style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </span>
              Thinking…
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
            {error}
            {outOfQuota && (
              <> <Link href="/pricing" className="underline hover:text-red-200">Upgrade your plan</Link>.</>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="glass flex items-end gap-3 rounded-3xl p-3"
      >
        <textarea
          rows={1}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          }}
          disabled={busy || outOfQuota}
          placeholder={outOfQuota ? "Out of questions for this period." : "Type a message… (Enter to send, Shift+Enter for newline)"}
          className="flex-1 resize-none rounded-xl border-0 bg-transparent px-2 py-1.5 text-sm text-white placeholder-gray-600 outline-none"
          style={{ minHeight: "36px", maxHeight: "160px" }}
        />
        <button
          type="submit"
          disabled={busy || outOfQuota || !input.trim()}
          className="btn-brand shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}

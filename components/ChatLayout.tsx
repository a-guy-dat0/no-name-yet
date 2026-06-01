"use client";

// ChatLayout — sidebar with conversation list + main chat area.
// Handles conversation CRUD, message persistence, and streaming.

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
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

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatLayout({ initialUsage }: { initialUsage: Usage }) {
  const [usage, setUsage] = useState<Usage>(initialUsage);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { data: session } = useSession();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Tracks which conversation owns the current stream so stale callbacks
  // from a previous chat don't bleed into a newly created one.
  const streamingConvRef = useRef<string | null>(null);
  // Timestamp of the last token received — used by the inactivity watchdog.
  const lastTokenAt = useRef<number>(0);
  // AbortController for the current fetch — lets the stop button cancel it.
  const abortRef = useRef<AbortController | null>(null);

  // Watchdog: if busy but no token has arrived for 1.5 s, assume the stream
  // ended without a sentinel and unlock the UI.
  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => {
      if (lastTokenAt.current > 0 && Date.now() - lastTokenAt.current > 1500) {
        setBusy(false);
        lastTokenAt.current = 0;
      }
    }, 300);
    return () => clearInterval(id);
  }, [busy]);

  // Load conversation list on mount. If any exist, auto-open the most
  // recent one — so users land in their last chat instead of a blank screen.
  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then(async (data) => {
        if (!Array.isArray(data)) return;
        setConversations(data);
        if (data.length > 0) {
          const mostRecent = data[0]; // API returns newest first
          setActiveId(mostRecent.id);
          const res = await fetch(`/api/conversations/${mostRecent.id}`);
          if (res.ok) {
            const conv = await res.json();
            setMessages(conv.messages ?? []);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Scroll to bottom when messages change.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  // Load messages for a conversation.
  const loadConversation = useCallback(async (id: string) => {
    setActiveId(id);
    setMessages([]);
    setError(null);
    const res = await fetch(`/api/conversations/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages ?? []);
  }, []);

  // Create a new conversation and select it.
  // Clear messages immediately (before the fetch) so the UI is blank right away.
  async function newChat() {
    setMessages([]);
    setActiveId(null);
    setError(null);
    setBusy(false);
    streamingConvRef.current = null; // invalidate any in-flight stream
    const res = await fetch("/api/conversations", { method: "POST" });
    if (!res.ok) return;
    const conv: Conversation = await res.json();
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    textareaRef.current?.focus();
  }

  // Delete a conversation.
  async function deleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
  }

  // Stop the current generation.
  function stop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
    lastTokenAt.current = 0;
  }

  // Send a message and stream the response.
  // Conversation creation is handled server-side — the server verifies or
  // creates the conversation and sends back the real ID in the sentinel.
  async function send() {
    const trimmed = input.trim();
    if (!trimmed || busy) return;
    setError(null);

    const userMsg: Message = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setBusy(true);
    streamingConvRef.current = activeId;
    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abort.signal,
        body: JSON.stringify({
          messages: next.map(({ role, content }) => ({ role, content })),
          conversationId: activeId ?? undefined
        })
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.message || json.error || `Error ${res.status}`);
        if (json.usage) setUsage(json.usage);
        return;
      }

      // Server tells us the conversation ID in a header — read it right away
      // so the sidebar shows the new chat as soon as streaming begins,
      // not when it ends. This also makes the chat persist if user clicks
      // "New chat" mid-stream.
      const headerConvId = res.headers.get("X-Conversation-Id");
      if (headerConvId) {
        setActiveId(headerConvId);
        const title = trimmed.slice(0, 60) || "New chat";
        setConversations((prev) => {
          if (prev.some(c => c.id === headerConvId)) {
            return prev.map(c => c.id === headerConvId
              ? { ...c, title, updatedAt: new Date().toISOString() }
              : c);
          }
          return [{ id: headerConvId, title, updatedAt: new Date().toISOString() }, ...prev];
        });
      }

      // Add empty assistant bubble; fill it token by token.
      // Use a unique token per send() call so stale stream callbacks from
      // a previous chat are ignored after the user starts a new one.
      const thisToken = Date.now().toString(36);
      streamingConvRef.current = thisToken;
      const isStale = () => streamingConvRef.current !== thisToken;

      setMessages([...next, { role: "assistant", content: "" }]);
      lastTokenAt.current = Date.now(); // start the watchdog clock
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      const SENTINEL = "\n<<<DONE>>>";
      let displayText = "";
      let rawBuffer = "";
      let metaParsed = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done || isStale()) break;
        rawBuffer += decoder.decode(value, { stream: true });

        lastTokenAt.current = Date.now(); // reset watchdog on every chunk
        const sentinelIdx = rawBuffer.indexOf(SENTINEL);
        if (sentinelIdx !== -1) {
          lastTokenAt.current = 0; // sentinel received — disarm watchdog
          displayText = rawBuffer.slice(0, sentinelIdx);
          if (!isStale()) {
            setMessages((prev) => [
              ...prev.slice(0, -1),
              { role: "assistant", content: displayText }
            ]);
            try {
              const meta = JSON.parse(rawBuffer.slice(sentinelIdx + SENTINEL.length));
              if (meta.usage) { setUsage(meta.usage); metaParsed = true; }
              if (meta.conversationId) {
                const firstUserContent = next.find(m => m.role === "user")?.content ?? "";
                const title = firstUserContent.slice(0, 60) || "New chat";
                setActiveId(meta.conversationId);
                streamingConvRef.current = meta.conversationId;
                setConversations((prev) => {
                  const exists = prev.some(c => c.id === meta.conversationId);
                  if (exists) {
                    // Update title + timestamp on existing entry
                    return prev.map(c =>
                      c.id === meta.conversationId
                        ? { ...c, title, updatedAt: new Date().toISOString() }
                        : c
                    );
                  }
                  // Server created a new conversation — add it to the top
                  return [{ id: meta.conversationId, title, updatedAt: new Date().toISOString() }, ...prev];
                });
              }
            } catch {}
          }
          break;
        }

        // Normal chunk — append new text only.
        displayText = rawBuffer;
        if (!isStale()) {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (!last || last.role !== "assistant") return prev;
            return [...prev.slice(0, -1), { ...last, content: displayText }];
          });
        }
      }

      // Fallback: if sentinel never arrived (proxy issue, timeout, etc.)
      // fetch usage the old-fashioned way so the quota bar stays correct.
      if (!metaParsed) {
        fetch("/api/usage").then(r => r.json()).then(u => setUsage(u)).catch(() => {});
      }
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setBusy(false);
    }
  }

  const outOfQuota = usage.remaining <= 0;
  const pct = Math.round((usage.used / usage.limit) * 100);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">

      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className={`flex flex-col border-r border-white/[0.07] transition-all duration-200 ${
        sidebarOpen ? "w-60 min-w-[15rem]" : "w-0 overflow-hidden"
      }`} style={{ background: "rgba(7,8,14,0.6)", backdropFilter: "blur(12px)" }}>

        {/* New chat */}
        <div className="p-3">
          <button
            onClick={newChat}
            className="flex w-full items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-gray-300 transition-all hover:bg-white/[0.08] hover:text-white"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/>
            </svg>
            New chat
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {conversations.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-gray-600">No conversations yet</p>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => loadConversation(conv.id)}
              className={`group mb-0.5 flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm transition-all ${
                activeId === conv.id
                  ? "bg-white/[0.08] text-white"
                  : "text-gray-400 hover:bg-white/[0.05] hover:text-gray-200"
              }`}
            >
              <span className="truncate">{conv.title}</span>
              <button
                onClick={(e) => deleteConversation(conv.id, e)}
                className="ml-1 shrink-0 rounded-md p-0.5 opacity-0 transition-opacity hover:bg-white/[0.1] hover:text-red-400 group-hover:opacity-100"
                title="Delete"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                  <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5.5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
                  <path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 010-2h4a1 1 0 011-1h2a1 1 0 011 1h4a1 1 0 011 1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Usage + user profile at bottom of sidebar */}
        <div className="border-t border-white/[0.07] p-3 space-y-2">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-gray-500">Tier {usage.tier} quota</span>
              <Link href="/account" className="text-indigo-400 hover:underline">Upgrade</Link>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-indigo-500"}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-600">
              {usage.remaining} of {usage.limit} left this {usage.period}
            </p>
          </div>

          {/* User avatar + email — mixed into sidebar */}
          {session?.user && (
            <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt="avatar"
                  className="h-7 w-7 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                  {session.user.email?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <span className="truncate text-xs text-gray-400">
                {session.user.email}
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main chat area ───────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Topbar */}
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-2.5"
             style={{ background: "rgba(7,8,14,0.4)", backdropFilter: "blur(8px)" }}>
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="icon-btn text-gray-400 hover:text-white"
            title="Toggle sidebar"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 012 10z" clipRule="evenodd"/>
            </svg>
          </button>
          <span className="text-sm text-gray-400 truncate">
            {activeId
              ? conversations.find((c) => c.id === activeId)?.title || "Chat"
              : "New chat"}
          </span>
        </div>

        {/* Messages — min-h-0 prevents the flex child from growing past its container */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="icon-btn h-12 w-12 rounded-2xl border-white/[0.1] bg-indigo-500/10 text-indigo-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
                </svg>
              </div>
              <p className="text-sm text-gray-500">Ask anything to get started.</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                m.role === "user" ? "user-bubble text-white" : "ai-bubble text-gray-100"
              }`}>
                <div className="prose-chat">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {busy && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="glass flex items-center gap-2 rounded-2xl px-4 py-3 text-sm text-gray-400">
                <span className="flex gap-1">
                  {[0,1,2].map(i => (
                    <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-500"
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
        <div className="border-t border-white/[0.07] p-3"
             style={{ background: "rgba(7,8,14,0.5)", backdropFilter: "blur(8px)" }}>
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="glass flex items-end gap-3 rounded-2xl p-3"
          >
            <textarea
              ref={textareaRef}
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
              disabled={outOfQuota}
              placeholder={busy ? "Waiting for reply…" : outOfQuota ? "Out of questions for this period." : "Type a message… (Enter to send, Shift+Enter for newline)"}
              className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-white placeholder-gray-600 outline-none"
              style={{ minHeight: "36px", maxHeight: "160px" }}
            />
            {busy ? (
              /* Stop button — spinning ring with a square in the centre */
              <button
                type="button"
                onClick={stop}
                className="relative shrink-0 flex items-center justify-center w-10 h-10 rounded-xl"
                title="Stop generating"
              >
                {/* Spinning ring */}
                <span className="absolute inset-0 rounded-xl border-2 border-transparent border-t-white border-r-white animate-spin" />
                {/* Stop square */}
                <span className="h-3 w-3 rounded-sm bg-white" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={outOfQuota || !input.trim()}
                className="glass glass-hover shrink-0 rounded-xl px-4 py-2 text-sm font-medium text-gray-200 disabled:opacity-30 hover:text-white"
              >
                Send
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

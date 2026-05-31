"use client";

// Dedicated sign-in page — supports Google OAuth and email magic link.
// NextAuth redirects here because authOptions.pages.signIn = "/signin".

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    const result = await signIn("email", {
      email: email.trim(),
      callbackUrl: "/chat",
      redirect: false
    });
    setBusy(false);
    if (result?.error) {
      setError("Could not send the link. Check your email address and try again.");
    } else {
      setSent(true);
    }
  }

  return (
    <div className="mx-auto mt-20 max-w-sm space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">{"{no name yet}"}</h1>
        <p className="mt-2 text-gray-400">Sign in to start chatting</p>
      </div>

      {/* Google */}
      <button
        onClick={() => signIn("google", { callbackUrl: "/chat" })}
        className="flex w-full items-center justify-center gap-3 rounded-md border border-[var(--border)] bg-[var(--panel)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--border)]"
      >
        {/* Google "G" logo */}
        <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.1 0 5.7 1.1 7.8 2.9l5.8-5.8C33.9 3.5 29.3 1.5 24 1.5 14.9 1.5 7.2 7 3.7 14.8l6.8 5.3C12.2 13.6 17.6 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
          <path fill="#FBBC05" d="M10.5 28.1A14.7 14.7 0 0 1 9.5 24c0-1.4.2-2.8.5-4.1l-6.8-5.3A23.5 23.5 0 0 0 .5 24c0 3.8.9 7.4 2.5 10.5l7.5-6.4z"/>
          <path fill="#34A853" d="M24 46.5c5.3 0 9.8-1.8 13-4.8l-7.5-5.8c-1.8 1.2-4.1 1.9-5.5 1.9-6.4 0-11.8-4.3-13.5-10.1l-7.5 6.4C7.2 41 15 46.5 24 46.5z"/>
        </svg>
        Continue with Google
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[var(--bg)] px-2 text-gray-500">or continue with email</span>
        </div>
      </div>

      {/* Email magic link */}
      {sent ? (
        <div className="rounded-md border border-[var(--border)] bg-[var(--panel)] p-4 text-center text-sm text-gray-300">
          <p className="font-medium text-white">Check your inbox ✉️</p>
          <p className="mt-1">We sent a sign-in link to <span className="text-white">{email}</span>.</p>
          <p className="mt-1 text-gray-500">It expires in 24 hours.</p>
        </div>
      ) : (
        <form onSubmit={handleEmail} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-2.5 text-white placeholder-gray-500 outline-none focus:border-brand-600"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send magic link"}
          </button>
        </form>
      )}
    </div>
  );
}

"use client";

// Sign-in page — email magic link only.
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
      redirect: false,
    });
    setBusy(false);
    if (result?.error) {
      setError("Couldn't send the link — check your address and try again.");
    } else {
      setSent(true);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="glass rounded-3xl p-8 shadow-2xl shadow-black/40">

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.1] bg-gradient-to-br from-indigo-500/30 to-purple-600/20 backdrop-blur-sm shadow-[0_0_30px_rgba(99,102,241,0.25)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                   className="h-6 w-6 text-indigo-300" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white">{"{ask-it}"}</h1>
            <p className="mt-1 text-sm text-gray-500">Enter your email to get a sign-in link</p>
          </div>

          {/* Email magic link */}
          {sent ? (
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] px-5 py-5 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                     className="h-5 w-5 text-indigo-300" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
                </svg>
              </div>
              <p className="font-medium text-white">Check your inbox</p>
              <p className="mt-1 text-sm text-gray-400">
                We sent a sign-in link to <span className="text-gray-200">{email}</span>
              </p>
              <p className="mt-1 text-xs text-gray-600">Link expires in 24 hours</p>
            </div>
          ) : (
            <form onSubmit={handleEmail} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none backdrop-blur-sm transition-all focus:border-indigo-500/50 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
              />
              {error && (
                <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="btn-brand w-full rounded-2xl py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Sending…" : "Send magic link"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-gray-700">
          By signing in you agree to our{" "}
          <a href="/terms" className="text-gray-500 hover:text-gray-300">terms</a> and{" "}
          <a href="/terms" className="text-gray-500 hover:text-gray-300">privacy policy</a>.
        </p>
      </div>
    </div>
  );
}

"use client";

// Nav — liquid glass pill buttons, no Pricing, user avatar + email bottom-right.
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function Nav() {
  const { data: session, status } = useSession();

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full border-b border-white/[0.07] backdrop-blur-2xl"
        style={{ background: "rgba(7,8,14,0.75)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">

          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="icon-btn text-indigo-400 group-hover:text-indigo-300">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 3a1 1 0 110 2 1 1 0 010-2zm-1 4h2v5H9V9z"/>
              </svg>
            </span>
            <span className="text-sm font-semibold tracking-tight text-white">{"{ask-it}"}</span>
          </Link>

          {/* Nav pills */}
          <nav className="flex items-center gap-2 text-sm">
            {status === "authenticated" ? (
              <>
                {/* Liquid glass long-pill buttons */}
                <Link
                  href="/chat"
                  className="glass glass-hover rounded-full px-5 py-1.5 text-gray-300 transition-all hover:text-white"
                >
                  Chat
                </Link>
                <Link
                  href="/account"
                  className="glass glass-hover rounded-full px-5 py-1.5 text-gray-300 transition-all hover:text-white"
                >
                  Account
                </Link>
              </>
            ) : (
              <Link
                href="/signin"
                className="btn-brand rounded-full px-5 py-1.5 font-medium text-white"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Fixed bottom-right: avatar + email */}
      {status === "authenticated" && session?.user && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 glass rounded-full pl-1 pr-4 py-1 shadow-lg">
          {/* Avatar */}
          {session.user.image ? (
            <img
              src={session.user.image}
              alt="avatar"
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
              {session.user.email?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          {/* Email */}
          <span className="text-xs text-gray-300 max-w-[160px] truncate">
            {session.user.email}
          </span>
        </div>
      )}
    </>
  );
}

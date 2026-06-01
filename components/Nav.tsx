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
        <div className="flex w-full items-center px-3 py-3">

          {/* Brand — flush left */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="icon-btn text-indigo-400 group-hover:text-indigo-300">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 3a1 1 0 110 2 1 1 0 010-2zm-1 4h2v5H9V9z"/>
              </svg>
            </span>
            <span className="text-sm font-semibold tracking-tight text-white">{"{ask-it}"}</span>
          </Link>

          {/* Nav pills — pushed all the way to the right */}
          <nav className="ml-auto flex items-center gap-2 text-sm pr-2">
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

    </>
  );
}

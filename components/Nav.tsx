"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Nav() {
  const { data: session, status } = useSession();
  return (
    <header className="border-b border-[var(--border)] bg-[var(--panel)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-white">
          {"{no name yet}"}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/pricing" className="text-gray-300 hover:text-white">
            Pricing
          </Link>
          <Link href="/chat" className="text-gray-300 hover:text-white">
            Chat
          </Link>
          {status === "authenticated" ? (
            <>
              <Link href="/account" className="text-gray-300 hover:text-white">
                Account
              </Link>
              <button
                onClick={() => signOut()}
                className="rounded-md border border-[var(--border)] px-3 py-1 text-gray-200 hover:bg-[var(--border)]"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="rounded-md bg-brand-600 px-3 py-1 font-medium text-white hover:bg-brand-700"
            >
              Sign in
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

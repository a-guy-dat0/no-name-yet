"use client";

// ToS modal — shown only to signed-in users who haven't accepted yet.
// Acceptance is stored in the DB (User.tosAcceptedAt) so the email and
// timestamp are permanently logged server-side.

import { useState } from "react";
import { useSession } from "next-auth/react";
import TosContent from "@/components/TosContent";

export default function TosModal() {
  const { data: session, status, update } = useSession();
  const [accepting, setAccepting] = useState(false);

  // Only show when signed in and ToS hasn't been accepted yet
  if (status !== "authenticated") return null;
  if (session?.user?.tosAcceptedAt) return null;

  async function accept() {
    setAccepting(true);
    const res = await fetch("/api/account/accept-tos", { method: "POST" });
    if (res.ok) {
      // Refresh the session so tosAcceptedAt is populated and modal disappears
      await update();
    }
    setAccepting(false);
  }

  function decline() {
    window.location.href = "https://www.google.com";
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="glass w-full max-w-2xl rounded-3xl flex flex-col shadow-2xl shadow-black/60"
        style={{ maxHeight: "85vh" }}
      >
        {/* Header */}
        <div className="shrink-0 px-6 pt-6 pb-4 border-b border-white/[0.07]">
          <h2 className="text-lg font-bold text-white">{"{ask-it}"} Terms of Service</h2>
          <p className="mt-1 text-sm text-gray-400">
            Before you start — please read and accept our terms. By clicking{" "}
            <span className="text-white font-medium">I Agree</span> you also consent
            to cookies as described in Section 8.
          </p>
        </div>

        {/* Scrollable ToS */}
        <div className="flex-1 overflow-y-auto px-6 py-4 text-sm">
          <TosContent />
        </div>

        {/* Actions */}
        <div className="shrink-0 px-6 py-4 border-t border-white/[0.07] flex flex-col sm:flex-row gap-3">
          <button
            onClick={accept}
            disabled={accepting}
            className="btn-brand flex-1 rounded-2xl py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {accepting ? "Saving…" : "I Agree — Continue to {ask-it}"}
          </button>
          <button
            onClick={decline}
            className="glass glass-hover flex-1 rounded-2xl py-3 text-sm text-gray-400 hover:text-gray-200"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}

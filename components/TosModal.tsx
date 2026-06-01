"use client";

// First-visit Terms of Service modal.
// Reads/writes the ask-it-tos cookie. If the cookie is absent the entire
// site is blocked behind this modal — the user must click "I Agree" to
// continue, or they're sent away.

import { useState, useEffect } from "react";
import TosContent from "@/components/TosContent";

const COOKIE = "ask-it-tos";
const EXPIRES_DAYS = 365;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function TosModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show if the acceptance cookie is missing
    if (!getCookie(COOKIE)) setShow(true);
  }, []);

  function accept() {
    // Store acceptance timestamp so you have a record of when each browser agreed
    setCookie(COOKIE, `accepted-${Date.now()}`, EXPIRES_DAYS);
    setShow(false);
  }

  function decline() {
    // Redirect away — they can't use the site without accepting
    window.location.href = "https://www.google.com";
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center p-4"
         style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div className="glass w-full max-w-2xl rounded-3xl flex flex-col shadow-2xl shadow-black/60"
           style={{ maxHeight: "85vh" }}>

        {/* Header */}
        <div className="shrink-0 px-6 pt-6 pb-4 border-b border-white/[0.07]">
          <h2 className="text-lg font-bold text-white">{"{ask-it}"} Terms of Service</h2>
          <p className="mt-1 text-sm text-gray-400">
            Read and accept our terms to use the service. By clicking{" "}
            <span className="text-white font-medium">I Agree</span> you also consent
            to the use of cookies as described in Section 8.
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
            className="btn-brand flex-1 rounded-2xl py-3 text-sm font-semibold text-white"
          >
            I Agree — Continue to {"{ask-it}"}
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

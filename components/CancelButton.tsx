"use client";

// Cancel subscription button — glass style to match account page.
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function cancel() {
    if (!confirm("Cancel your subscription? You'll drop to the free tier immediately.")) return;
    setBusy(true);
    const res = await fetch("/api/paypal/cancel", { method: "POST" });
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      alert("Cancel failed: " + (j.error ?? res.status));
    }
  }

  return (
    <button
      onClick={cancel}
      disabled={busy}
      className="glass glass-hover rounded-xl px-4 py-2 text-sm text-gray-300 disabled:opacity-50"
    >
      {busy ? "Cancelling…" : "Cancel"}
    </button>
  );
}

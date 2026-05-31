"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function cancel() {
    if (!confirm("Cancel your subscription? You'll drop to the free tier.")) return;
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
      className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-gray-200 hover:bg-[var(--border)] disabled:opacity-50"
    >
      {busy ? "Cancelling…" : "Cancel subscription"}
    </button>
  );
}

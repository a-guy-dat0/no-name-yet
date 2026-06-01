"use client";

// Account page — profile, usage, data controls, danger zone.
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";

interface Usage {
  tier: number; limit: number; period: string;
  used: number; remaining: number; resetsAt: string;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-3xl p-6 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{title}</h2>
      {children}
    </div>
  );
}

function ActionButton({
  label, description, buttonLabel, variant = "default", onClick, busy
}: {
  label: string; description: string; buttonLabel: string;
  variant?: "default" | "danger"; onClick: () => void; busy?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        onClick={onClick}
        disabled={busy}
        className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-40 ${
          variant === "danger"
            ? "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
            : "glass glass-hover text-gray-200 hover:text-white"
        }`}
      >
        {busy ? "…" : buttonLabel}
      </button>
    </div>
  );
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/signin");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/usage").then(r => r.json()).then(setUsage).catch(() => {});
  }, []);

  async function action(key: string, url: string, confirm?: string) {
    if (confirm && !window.confirm(confirm)) return;
    setBusy(key);
    setDone(null);
    const res = await fetch(url, { method: "POST" });
    setBusy(null);
    if (res.ok) {
      setDone(key);
      if (key === "delete") { await signOut({ callbackUrl: "/" }); }
      if (key === "clearChats") { router.refresh(); }
    }
  }

  if (status === "loading") return null;
  const user = session?.user;
  const pct = usage ? Math.round((usage.used / usage.limit) * 100) : 0;
  const tierNames = ["Free", "Tier 1", "Tier 2", "Tier 3"];

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-bold text-white">Account</h1>

      {/* ── Profile ── */}
      <Section title="Profile">
        <div className="flex items-center gap-4">
          {user?.image ? (
            <img src={user.image} alt="avatar" className="h-14 w-14 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xl font-bold text-white">
              {user?.email?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div className="flex-1">
            <p className="font-semibold text-white">{user?.name ?? "—"}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="glass glass-hover rounded-xl px-4 py-2 text-sm text-gray-300 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </Section>

      {/* ── Plan & usage ── */}
      <Section title="Plan & Usage">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">{tierNames[usage?.tier ?? 0]}</p>
            <p className="text-sm text-gray-400">
              {usage ? `${usage.used} / ${usage.limit} questions used this ${usage.period}` : "Loading…"}
            </p>
          </div>
          <Link href="/pricing" className="glass glass-hover rounded-xl px-4 py-2 text-sm text-gray-300 hover:text-white">
            Change plan
          </Link>
        </div>
        {usage && (
          <>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-indigo-500"}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-600">
              {usage.remaining} remaining · resets {new Date(usage.resetsAt).toLocaleDateString()}
            </p>
          </>
        )}
      </Section>

      {/* ── Data ── */}
      <Section title="Your Data">
        <ActionButton
          label="Clear AI memory"
          description="The AI will forget everything it learned about you from past sessions."
          buttonLabel={done === "clearMemory" ? "Cleared ✓" : "Clear memory"}
          busy={busy === "clearMemory"}
          onClick={() => action("clearMemory", "/api/account/clear-memory")}
        />
        <div className="divider" />
        <ActionButton
          label="Delete all chats"
          description="Permanently deletes every conversation and its messages. Cannot be undone."
          buttonLabel={done === "clearChats" ? "Deleted ✓" : "Delete all chats"}
          busy={busy === "clearChats"}
          onClick={() => action("clearChats", "/api/account/clear-chats", "Delete all chats? This cannot be undone.")}
        />
      </Section>

      {/* ── Danger zone ── */}
      <Section title="Danger Zone">
        <ActionButton
          label="Delete account"
          description="Permanently deletes your account, all chats, and all data. Immediate and irreversible."
          buttonLabel="Delete my account"
          variant="danger"
          busy={busy === "delete"}
          onClick={() => action("delete", "/api/account/delete", "Permanently delete your account? This cannot be undone.")}
        />
      </Section>
    </div>
  );
}

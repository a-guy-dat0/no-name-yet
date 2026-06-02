"use client";

// Admin dashboard — only visible to superdrea13@gmail.com.
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TIERS = ["Free", "Tier 1 — $10", "Tier 2 — $20", "Tier 3 — $50"];
const TIER_COLORS = ["text-gray-400", "text-indigo-400", "text-purple-400", "text-amber-400"];

interface Purchase {
  id: string;
  email: string;
  tier: number;
  amountUsd: number;
  status: string;
  createdAt: string;
}

interface User {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  tier: number;
  createdAt: string;
  tosAcceptedAt: string | null;
  subscriptionStatus: string | null;
  _count: { conversations: number; questions: number };
}

interface Message { id: string; role: string; content: string; createdAt: string; }
interface Conversation { id: string; title: string; updatedAt: string; messages: Message[]; }

function UserMessagesPanel({ user, onClose }: { user: User; onClose: () => void }) {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [openConvId, setOpenConvId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/users/${user.id}/conversations`)
      .then(r => r.json())
      .then(d => { setConvs(d); setLoading(false); });
  }, [user.id]);

  return (
    <div className="fixed inset-0 z-[300] flex" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Drawer — slides in from right */}
      <div
        className="glass relative ml-auto flex h-full w-full max-w-2xl flex-col shadow-2xl shadow-black/60"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
          <div className="flex items-center gap-3">
            {user.image ? (
              <img src={user.image} className="h-8 w-8 rounded-full" alt="" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/30 text-xs font-bold text-indigo-300">
                {user.email?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-white">{user.name ?? user.email}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="glass glass-hover rounded-xl px-3 py-1.5 text-xs text-gray-400 hover:text-white">
            Close ✕
          </button>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading && <p className="text-center text-sm text-gray-600">Loading…</p>}
          {!loading && convs.length === 0 && (
            <p className="text-center text-sm text-gray-600">No conversations yet.</p>
          )}
          {convs.map(conv => (
            <div key={conv.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              {/* Conv header */}
              <button
                className="flex w-full items-center justify-between px-4 py-3 text-left"
                onClick={() => setOpenConvId(openConvId === conv.id ? null : conv.id)}
              >
                <span className="text-sm font-medium text-white truncate">{conv.title}</span>
                <span className="ml-3 shrink-0 text-xs text-gray-600">
                  {conv.messages.length} msgs · {new Date(conv.updatedAt).toLocaleDateString()}
                </span>
              </button>

              {/* Messages */}
              {openConvId === conv.id && (
                <div className="border-t border-white/[0.06] px-4 py-3 space-y-2">
                  {conv.messages.length === 0 && (
                    <p className="text-xs text-gray-600">No messages.</p>
                  )}
                  {conv.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                        msg.role === "user"
                          ? "bg-indigo-500/20 text-indigo-200"
                          : "bg-white/[0.04] text-gray-300"
                      }`}>
                        <p className="mb-0.5 text-[10px] font-semibold opacity-50">
                          {msg.role} · {new Date(msg.createdAt).toLocaleTimeString()}
                        </p>
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [tab, setTab] = useState<"users" | "payments">("users");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    if (status === "loading") return;
    if (session?.user?.email !== "superdrea13@gmail.com") { router.replace("/"); return; }
    Promise.all([
      fetch("/api/admin/users").then(r => r.json()),
      fetch("/api/admin/purchases").then(r => r.json())
    ]).then(([users, pData]) => {
      setUsers(users);
      setPurchases(pData.purchases ?? []);
      setTotalRevenue(pData.total ?? 0);
      setLoading(false);
    });
  }, [status, session, router]);

  async function setTier(userId: string, tier: number) {
    setUpdatingId(userId);
    const res = await fetch(`/api/admin/users/${userId}/tier`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier })
    });
    if (res.ok) setUsers(prev => prev.map(u => u.id === userId ? { ...u, tier } : u));
    setUpdatingId(null);
  }

  if (status === "loading" || loading)
    return <div className="flex h-screen items-center justify-center text-gray-500">Loading…</div>;

  const filtered = users.filter(u =>
    !search || u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    tosAccepted: users.filter(u => u.tosAcceptedAt).length,
    paid: users.filter(u => u.tier > 0).length,
    questions: users.reduce((s, u) => s + u._count.questions, 0),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      {selectedUser && (
        <UserMessagesPanel user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <span className="text-xs text-gray-600">Only visible to you</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["users", "payments"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition-all ${
              tab === t ? "btn-brand text-white" : "glass glass-hover text-gray-400"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "payments" && (
        <>
          {/* Revenue stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "Total active MRR", value: `$${totalRevenue}/mo` },
              { label: "Total payments", value: purchases.length },
              { label: "Active subs", value: purchases.filter(p => p.status === "active").length },
            ].map(s => (
              <div key={s.label} className="glass rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="mt-0.5 text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Payments table */}
          <div className="glass rounded-3xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07] text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p, i) => (
                  <tr key={p.id} className={`border-b border-white/[0.04] ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                    <td className="px-4 py-3 text-xs text-gray-300">{p.email}</td>
                    <td className={`px-4 py-3 text-xs ${TIER_COLORS[p.tier]}`}>{TIERS[p.tier]}</td>
                    <td className="px-4 py-3 text-xs text-green-400">${p.amountUsd}/mo</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        p.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-500"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {purchases.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-600">No payments yet.</p>
            )}
          </div>
        </>
      )}

      {tab === "users" && <>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total users", value: stats.total },
          { label: "ToS accepted", value: `${stats.tosAccepted} / ${stats.total}` },
          { label: "Paid users", value: stats.paid },
          { label: "Total questions", value: stats.questions },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="mt-0.5 text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <input
        type="text"
        placeholder="Search by email or name…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50"
      />

      <div className="glass rounded-3xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.07] text-left text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">ToS</th>
              <th className="px-4 py-3">Chats</th>
              <th className="px-4 py-3">Questions</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user, i) => (
              <tr key={user.id} className={`border-b border-white/[0.04] hover:bg-white/[0.02] ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {user.image ? (
                      <img src={user.image} className="h-7 w-7 rounded-full" alt="" />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/30 text-xs font-bold text-indigo-300">
                        {user.email?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-white">{user.name ?? "—"}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {user.tosAcceptedAt
                    ? <span className="text-xs text-green-400">✓ {new Date(user.tosAcceptedAt).toLocaleDateString()}</span>
                    : <span className="text-xs text-gray-600">Not accepted</span>}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{user._count.conversations}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{user._count.questions}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.tier}
                    disabled={updatingId === user.id}
                    onChange={e => setTier(user.id, Number(e.target.value))}
                    className={`rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-xs outline-none disabled:opacity-50 ${TIER_COLORS[user.tier]}`}
                  >
                    {TIERS.map((t, i) => (
                      <option key={i} value={i} className="bg-[#0b0d12] text-white">{t}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="glass glass-hover rounded-lg px-3 py-1 text-xs text-gray-400 hover:text-white"
                  >
                    View chats
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="py-8 text-center text-sm text-gray-600">No users found.</p>}
      </div>
    </>}
    </div>
  );
}

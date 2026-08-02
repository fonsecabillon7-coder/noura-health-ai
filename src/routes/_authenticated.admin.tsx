import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, BarChart3, Users, CreditCard, Settings2, Loader2, Search, ShieldAlert,
} from "lucide-react";
import {
  amIAdmin, getAdminOverview, listUsers, setUserSubscription, setUserRole,
  getPlanSettings, updatePlanSetting, listHotmartEvents,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  component: Admin,
  head: () => ({
    meta: [
      { title: "Admin — Neura AI" },
      { name: "description", content: "Neura AI internal admin dashboard: revenue, subscribers and plan settings." },
      { property: "og:title", content: "Admin — Neura AI" },
      { property: "og:description", content: "Neura AI internal admin dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Tab = "overview" | "users" | "plans" | "webhooks";

function money(n: number) {
  return `US$${n.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
}

function Admin() {
  const nav = useNavigate();
  const check = useServerFn(amIAdmin);
  const [tab, setTab] = useState<Tab>("overview");
  const gate = useQuery({ queryKey: ["is-admin"], queryFn: () => check() });

  if (gate.isLoading) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-emerald" /></div>;
  }
  if (!gate.data?.admin) {
    return (
      <div className="grid min-h-screen place-items-center px-8 text-center">
        <div>
          <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">You don't have access to this area.</p>
          <button onClick={() => nav({ to: "/dashboard" })} className="mt-5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black">
            Back to app
          </button>
        </div>
      </div>
    );
  }

  const tabs: { k: Tab; label: string; icon: any }[] = [
    { k: "overview", label: "Overview", icon: BarChart3 },
    { k: "users", label: "Users", icon: Users },
    { k: "plans", label: "Plans", icon: Settings2 },
    { k: "webhooks", label: "Hotmart", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen pb-16">
      <div className="sticky top-0 z-20 bg-background/85 px-5 pb-3 pt-12 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button onClick={() => nav({ to: "/profile" })} className="grid h-10 w-10 place-items-center rounded-full bg-white/8">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight">Neura Admin</h1>
            <p className="text-[11px] text-muted-foreground">Business intelligence & operations</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {tabs.map((tb) => (
            <button
              key={tb.k}
              onClick={() => setTab(tb.k)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold ${
                tab === tb.k ? "bg-emerald text-black" : "bg-white/8 text-muted-foreground"
              }`}
            >
              <tb.icon className="h-3.5 w-3.5" /> {tb.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4">
        {tab === "overview" && <Overview />}
        {tab === "users" && <UsersTab />}
        {tab === "plans" && <PlansTab />}
        {tab === "webhooks" && <WebhooksTab />}
      </div>
    </div>
  );
}

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="glass rounded-[22px] p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Overview() {
  const fn = useServerFn(getAdminOverview);
  const { data, isLoading } = useQuery({ queryKey: ["admin-overview"], queryFn: () => fn() });
  if (isLoading || !data) return <Loader2 className="mx-auto mt-16 h-6 w-6 animate-spin text-emerald" />;
  const k = data.kpis;
  const max = Math.max(1, ...data.series.map((s: any) => s.revenue));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card label="MRR" value={money(k.mrr)} sub={`ARR ${money(k.arr)}`} />
        <Card label="Premium" value={String(k.premiumUsers)} sub={`${k.trials} in trial`} />
        <Card label="Users" value={String(k.totalUsers)} sub={`${k.dau} DAU · ${k.mau} MAU`} />
        <Card label="Conversion" value={`${k.conversion.toFixed(1)}%`} sub={`Churn ${k.churn.toFixed(1)}%`} />
        <Card label="LTV" value={money(k.ltv)} sub="est. per subscriber" />
        <Card label="Cancelled" value={String(k.cancelled)} sub={`${k.expired} expired`} />
      </div>

      <div className="glass rounded-[22px] p-4">
        <div className="text-xs font-semibold">Revenue · last 30 days</div>
        <div className="mt-4 flex h-28 items-end gap-1">
          {data.series.map((s: any) => (
            <motion.div
              key={s.date}
              initial={{ height: 0 }}
              animate={{ height: `${(s.revenue / max) * 100}%` }}
              className="flex-1 rounded-t bg-gradient-to-t from-emerald/40 to-emerald"
              style={{ minHeight: 2 }}
              title={`${s.date}: ${money(s.revenue)}`}
            />
          ))}
        </div>
      </div>

      <div className="glass rounded-[22px] p-4">
        <div className="text-xs font-semibold">Acquisition sources</div>
        <div className="mt-3 space-y-2">
          {data.sources.map((s: any) => (
            <div key={s.key} className="flex items-center justify-between text-sm">
              <span className="capitalize text-muted-foreground">{s.key}</span>
              <span className="tabular-nums">{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-[22px] p-4">
        <div className="text-xs font-semibold">Funnel (30d events)</div>
        <div className="mt-3 space-y-2">
          {["signup", "onboarding_completed", "paywall_viewed", "checkout_started", "checkout_clicked", "subscription_activated"].map((key) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{key.replace(/_/g, " ")}</span>
              <span className="tabular-nums">{(data.funnel as any)[key] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-[22px] p-4">
        <div className="text-xs font-semibold">Top countries</div>
        <div className="mt-3 space-y-2">
          {data.countries.map((c: any) => (
            <div key={c.key} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{c.key}</span>
              <span className="tabular-nums">{c.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const fn = useServerFn(listUsers);
  const setSub = useServerFn(setUserSubscription);
  const setRole = useServerFn(setUserRole);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | "FREE" | "TRIAL" | "PREMIUM" | "EXPIRED" | "CANCELLED">("ALL");
  const [q, setQ] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setQ(search), 350);
    return () => clearTimeout(id);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", q, status],
    queryFn: () => fn({ data: { search: q || undefined, status } }),
  });

  async function act(userId: string, next: any) {
    await setSub({ data: { userId, status: next, days: next === "TRIAL" ? 7 : 365 } });
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }

  return (
    <div className="space-y-3">
      <div className="glass flex items-center gap-2 rounded-[18px] px-3.5 py-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {(["ALL", "PREMIUM", "TRIAL", "FREE", "CANCELLED", "EXPIRED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
              status === s ? "bg-white text-black" : "bg-white/8 text-muted-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading && <Loader2 className="mx-auto mt-10 h-5 w-5 animate-spin text-emerald" />}
      {(data ?? []).map((u: any) => (
        <div key={u.user_id} className="glass rounded-[20px] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{u.name || "—"}</div>
              <div className="truncate text-[11px] text-muted-foreground">{u.email}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {u.country || "—"} · {u.acquisition_source || "unknown"}
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                u.status === "PREMIUM" ? "bg-emerald text-black"
                  : u.status === "TRIAL" ? "bg-hydration/30"
                  : "bg-white/10 text-muted-foreground"
              }`}
            >
              {u.status}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => act(u.user_id, "PREMIUM")} className="rounded-full bg-emerald/20 px-3 py-1.5 text-[11px] font-semibold text-emerald">Grant premium</button>
            <button onClick={() => act(u.user_id, "TRIAL")} className="rounded-full bg-white/8 px-3 py-1.5 text-[11px]">Start trial</button>
            <button onClick={() => act(u.user_id, "FREE")} className="rounded-full bg-white/8 px-3 py-1.5 text-[11px]">Revoke</button>
            <button
              onClick={async () => {
                await setRole({ data: { userId: u.user_id, role: "admin", grant: !u.roles.includes("admin") } });
                qc.invalidateQueries({ queryKey: ["admin-users"] });
              }}
              className={`rounded-full px-3 py-1.5 text-[11px] ${u.roles.includes("admin") ? "bg-destructive/25" : "bg-white/8"}`}
            >
              {u.roles.includes("admin") ? "Remove admin" : "Make admin"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PlansTab() {
  const fn = useServerFn(getPlanSettings);
  const update = useServerFn(updatePlanSetting);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-plans"], queryFn: () => fn() });
  const [draft, setDraft] = useState<Record<string, any>>({});

  const rows = useMemo(() => data ?? [], [data]);
  if (isLoading) return <Loader2 className="mx-auto mt-10 h-5 w-5 animate-spin text-emerald" />;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Webhook URL for Hotmart: <span className="text-foreground">/api/public/hotmart</span>
      </p>
      {rows.map((p: any) => {
        const d = { ...p, ...(draft[p.key] ?? {}) };
        return (
          <div key={p.key} className="glass space-y-3 rounded-[22px] p-4">
            <div className="text-sm font-semibold capitalize">{p.name || p.key}</div>
            <label className="block text-[11px] text-muted-foreground">
              Price (USD)
              <input
                type="number"
                step="0.01"
                value={d.price_usd}
                onChange={(e) => setDraft((s) => ({ ...s, [p.key]: { ...d, price_usd: Number(e.target.value) } }))}
                className="mt-1 w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-foreground outline-none"
              />
            </label>
            <label className="block text-[11px] text-muted-foreground">
              Hotmart checkout URL
              <input
                value={d.checkout_url ?? ""}
                onChange={(e) => setDraft((s) => ({ ...s, [p.key]: { ...d, checkout_url: e.target.value } }))}
                placeholder="https://pay.hotmart.com/XXXXXX"
                className="mt-1 w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-foreground outline-none"
              />
            </label>
            <label className="block text-[11px] text-muted-foreground">
              Trial days
              <input
                type="number"
                value={d.trial_days}
                onChange={(e) => setDraft((s) => ({ ...s, [p.key]: { ...d, trial_days: Number(e.target.value) } }))}
                className="mt-1 w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-foreground outline-none"
              />
            </label>
            <button
              onClick={async () => {
                await update({
                  data: {
                    key: p.key,
                    price_usd: Number(d.price_usd),
                    checkout_url: d.checkout_url ?? "",
                    trial_days: Number(d.trial_days),
                  },
                });
                qc.invalidateQueries({ queryKey: ["admin-plans"] });
              }}
              className="w-full rounded-[18px] bg-white py-3 text-sm font-semibold text-black"
            >
              Save
            </button>
          </div>
        );
      })}
    </div>
  );
}

function WebhooksTab() {
  const fn = useServerFn(listHotmartEvents);
  const { data, isLoading } = useQuery({ queryKey: ["admin-hotmart"], queryFn: () => fn() });
  if (isLoading) return <Loader2 className="mx-auto mt-10 h-5 w-5 animate-spin text-emerald" />;
  if (!data?.length) return <p className="mt-10 text-center text-xs text-muted-foreground">No Hotmart events received yet.</p>;
  return (
    <div className="space-y-2">
      {data.map((e: any) => (
        <div key={e.id} className="glass rounded-[18px] p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">{e.event_type}</span>
            <span className={`text-[10px] ${e.processed ? "text-emerald" : "text-destructive"}`}>
              {e.processed ? "processed" : "failed"}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">{e.email || "—"} · {new Date(e.created_at).toLocaleString()}</div>
          {e.error && <div className="mt-1 text-[11px] text-destructive">{e.error}</div>}
        </div>
      ))}
    </div>
  );
}

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const isAdmin = (data ?? []).some((r: any) => r.role === "admin");
  if (!isAdmin) throw new Error("Forbidden");
}

export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    return { admin: (data ?? []).some((r: any) => r.role === "admin") };
  });

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: subs }, { data: profiles }, { data: events }] = await Promise.all([
      supabaseAdmin.from("subscriptions").select("*"),
      supabaseAdmin.from("profiles").select("user_id, name, email, country, plan, acquisition_source, last_active_at, created_at, onboarding_completed"),
      supabaseAdmin
        .from("analytics_events")
        .select("name, created_at")
        .gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString()),
    ]);

    const rows: any[] = subs ?? [];
    const now = Date.now();
    const isActive = (s: any) =>
      s.status === "PREMIUM" ||
      (s.status === "TRIAL" && s.trial_end_date && new Date(s.trial_end_date).getTime() > now) ||
      (s.status === "CANCELLED" && s.next_payment_date && new Date(s.next_payment_date).getTime() > now);

    const active = rows.filter(isActive);
    const paying = active.filter((s) => s.status !== "TRIAL");
    const trials = rows.filter((s) => s.status === "TRIAL" && isActive(s));
    const cancelled = rows.filter((s) => s.status === "CANCELLED");
    const expired = rows.filter((s) => s.status === "EXPIRED");

    const mrr = paying.reduce(
      (sum, s) => sum + (s.billing_cycle === "annual" ? Number(s.price_usd) / 12 : Number(s.price_usd)),
      0,
    );
    const arr = mrr * 12;

    const totalUsers = (profiles ?? []).length;
    const premiumUsers = paying.length;
    const conversion = totalUsers ? (premiumUsers / totalUsers) * 100 : 0;
    const churn = paying.length + cancelled.length
      ? (cancelled.length / (paying.length + cancelled.length)) * 100
      : 0;
    const ltv = mrr && paying.length && churn > 0 ? (mrr / paying.length) / (churn / 100) : 0;

    // 30-day signup + revenue series
    const series: { date: string; signups: number; newSubs: number; revenue: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 864e5);
      series.push({ date: dayKey(d), signups: 0, newSubs: 0, revenue: 0 });
    }
    const idx = new Map(series.map((s, i) => [s.date, i]));
    (profiles ?? []).forEach((p: any) => {
      const i = idx.get(String(p.created_at).slice(0, 10));
      if (i !== undefined) series[i].signups++;
    });
    rows.forEach((s: any) => {
      if (s.status === "FREE") return;
      const i = idx.get(String(s.subscription_start_date ?? s.created_at).slice(0, 10));
      if (i !== undefined) {
        series[i].newSubs++;
        series[i].revenue += Number(s.price_usd) || 0;
      }
    });

    const sources: Record<string, number> = {};
    (profiles ?? []).forEach((p: any) => {
      const k = p.acquisition_source || "unknown";
      sources[k] = (sources[k] ?? 0) + 1;
    });

    const countries: Record<string, number> = {};
    (profiles ?? []).forEach((p: any) => {
      const k = p.country || "—";
      countries[k] = (countries[k] ?? 0) + 1;
    });

    const funnel: Record<string, number> = {};
    (events ?? []).forEach((e: any) => {
      funnel[e.name] = (funnel[e.name] ?? 0) + 1;
    });
    funnel["signup"] = totalUsers;
    funnel["onboarding_completed"] = (profiles ?? []).filter((p: any) => p.onboarding_completed).length;

    const dau = (profiles ?? []).filter(
      (p: any) => p.last_active_at && now - new Date(p.last_active_at).getTime() < 864e5,
    ).length;
    const mau = (profiles ?? []).filter(
      (p: any) => p.last_active_at && now - new Date(p.last_active_at).getTime() < 30 * 864e5,
    ).length;

    return {
      kpis: {
        mrr, arr, totalUsers, premiumUsers,
        trials: trials.length,
        cancelled: cancelled.length,
        expired: expired.length,
        conversion, churn, ltv, dau, mau,
      },
      series,
      sources: Object.entries(sources).map(([k, v]) => ({ key: k, count: v })).sort((a, b) => b.count - a.count),
      countries: Object.entries(countries).map(([k, v]) => ({ key: k, count: v })).sort((a, b) => b.count - a.count).slice(0, 8),
      funnel,
    };
  });

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      search: z.string().optional(),
      status: z.enum(["ALL", "FREE", "TRIAL", "PREMIUM", "EXPIRED", "CANCELLED"]).default("ALL"),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let q = supabaseAdmin
      .from("profiles")
      .select("user_id, name, email, country, plan, acquisition_source, last_active_at, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.search) q = q.or(`email.ilike.%${data.search}%,name.ilike.%${data.search}%`);
    const { data: profiles } = await q;

    const ids = (profiles ?? []).map((p: any) => p.user_id);
    const { data: subs } = await supabaseAdmin.from("subscriptions").select("*").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

    const subByUser = new Map((subs ?? []).map((s: any) => [s.user_id, s]));
    const rolesByUser = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      rolesByUser.set(r.user_id, [...(rolesByUser.get(r.user_id) ?? []), r.role]);
    });

    const merged = (profiles ?? []).map((p: any) => {
      const s: any = subByUser.get(p.user_id) ?? {};
      return {
        ...p,
        status: s.status ?? "FREE",
        billing_cycle: s.billing_cycle ?? null,
        price_usd: s.price_usd ?? 0,
        next_payment_date: s.next_payment_date ?? null,
        trial_end_date: s.trial_end_date ?? null,
        roles: rolesByUser.get(p.user_id) ?? [],
      };
    });

    return data.status === "ALL" ? merged : merged.filter((u) => u.status === data.status);
  });

export const setUserSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      userId: z.string().uuid(),
      status: z.enum(["FREE", "TRIAL", "PREMIUM", "EXPIRED", "CANCELLED"]),
      days: z.number().int().min(0).max(3650).default(30),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const until = new Date(Date.now() + data.days * 864e5).toISOString();
    const payload: any = {
      user_id: data.userId,
      status: data.status,
      plan_type: data.status === "PREMIUM" || data.status === "TRIAL" ? "premium" : "free",
      updated_at: new Date().toISOString(),
    };
    if (data.status === "TRIAL") {
      payload.trial_active = true;
      payload.trial_start_date = new Date().toISOString();
      payload.trial_end_date = until;
    }
    if (data.status === "PREMIUM") {
      payload.next_payment_date = until;
      payload.subscription_start_date = new Date().toISOString();
    }
    if (data.status === "CANCELLED") payload.cancelled_date = new Date().toISOString();

    const { data: existing } = await supabaseAdmin
      .from("subscriptions").select("id").eq("user_id", data.userId).maybeSingle();
    if (existing) await supabaseAdmin.from("subscriptions").update(payload).eq("user_id", data.userId);
    else await supabaseAdmin.from("subscriptions").insert(payload);

    await supabaseAdmin.from("profiles")
      .update({ plan: payload.plan_type }).eq("user_id", data.userId);
    return { ok: true };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), role: z.enum(["admin", "user"]), grant: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role }).select();
    } else {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role);
    }
    return { ok: true };
  });

export const getPlanSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("plan_settings").select("*").order("price_usd");
    return data ?? [];
  });

export const updatePlanSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      key: z.string().min(1),
      price_usd: z.number().min(0).optional(),
      checkout_url: z.string().url().or(z.literal("")).optional(),
      trial_days: z.number().int().min(0).max(90).optional(),
      active: z.boolean().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { key, ...patch } = data;
    await supabaseAdmin
      .from("plan_settings")
      .update({ ...patch, checkout_url: patch.checkout_url === "" ? null : patch.checkout_url, updated_at: new Date().toISOString() })
      .eq("key", key);
    return { ok: true };
  });

export const listHotmartEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("hotmart_events")
      .select("id, event_type, email, processed, error, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

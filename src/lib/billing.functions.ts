import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** Current user's subscription + computed access state. */
export const getSubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getAccessState, FREE_LIMITS } = await import("@/lib/access.server");
    const access = await getAccessState(context.supabase as any, context.userId);
    return { ...access, limits: FREE_LIMITS };
  });

/** Admin-configurable plans (checkout links, prices, trial length). */
export const listPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("plan_settings")
      .select("key, name, description, price_usd, checkout_url, trial_days, active")
      .eq("active", true);
    const rows = data ?? [];
    const byKey = (k: string) => rows.find((r: any) => r.key === k) ?? null;
    return {
      monthly: byKey("monthly"),
      annual: byKey("annual"),
    };
  });

/** Analytics event tracking. */
export const trackEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().min(1).max(64),
        props: z.record(z.string(), z.any()).default({}),
        source: z.string().max(64).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await context.supabase.from("analytics_events").insert({
      user_id: context.userId,
      name: data.name,
      props: data.props,
      source: data.source ?? null,
    });
    await (context.supabase.from("profiles") as any)
      .update({ last_active_at: new Date().toISOString() })
      .eq("user_id", context.userId);
    return { ok: true };
  });

/**
 * Prepares an in-app checkout: records the intent, then returns the
 * Hotmart checkout URL pre-filled with the user's email + external ref
 * so the webhook can match the payment back to this account.
 */
export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ cycle: z.enum(["monthly", "annual"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: plan } = await context.supabase
      .from("plan_settings")
      .select("*")
      .eq("key", data.cycle)
      .maybeSingle();

    if (!plan?.checkout_url) {
      return { ok: false as const, reason: "NO_CHECKOUT_URL" as const, plan };
    }

    const email = (context.claims as any)?.email as string | undefined;
    const url = new URL(plan.checkout_url);
    url.searchParams.set("off", url.searchParams.get("off") ?? "");
    if (email) url.searchParams.set("email", email);
    url.searchParams.set("src", "neura_app");
    url.searchParams.set("sck", context.userId);
    if (!url.searchParams.get("off")) url.searchParams.delete("off");

    await context.supabase.from("analytics_events").insert({
      user_id: context.userId,
      name: "checkout_clicked",
      props: { cycle: data.cycle, price: plan.price_usd },
    });

    return { ok: true as const, url: url.toString(), plan };
  });

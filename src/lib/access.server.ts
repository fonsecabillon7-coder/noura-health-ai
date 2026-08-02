// Server-only access control helpers. Never import from client code.
import type { SupabaseClient } from "@supabase/supabase-js";

export type AccessStatus = "FREE" | "TRIAL" | "PREMIUM" | "EXPIRED" | "CANCELLED";

export interface AccessState {
  status: AccessStatus;
  premium: boolean;
  planType: string;
  billingCycle: string | null;
  trialEndsAt: string | null;
  nextPaymentDate: string | null;
  cancelledDate: string | null;
}

/** Free tier daily allowances. */
export const FREE_LIMITS = {
  scansPerDay: 3,
  recipesPerDay: 1,
  fridgeScansPerDay: 0,
};

export async function getAccessState(
  supabase: SupabaseClient<any>,
  userId: string,
): Promise<AccessState> {
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const now = Date.now();
  const row: any = data ?? {};
  let status: AccessStatus = (row.status as AccessStatus) ?? "FREE";

  const trialEnd = row.trial_end_date ? new Date(row.trial_end_date).getTime() : null;
  const nextPayment = row.next_payment_date ? new Date(row.next_payment_date).getTime() : null;

  if (status === "TRIAL" && trialEnd !== null && trialEnd <= now) status = "EXPIRED";
  if (status === "CANCELLED" && (nextPayment === null || nextPayment <= now)) status = "EXPIRED";
  if (status === "PREMIUM" && nextPayment !== null && nextPayment + 3 * 864e5 <= now) status = "EXPIRED";

  const premium =
    status === "PREMIUM" ||
    (status === "TRIAL" && trialEnd !== null && trialEnd > now) ||
    (status === "CANCELLED" && nextPayment !== null && nextPayment > now);

  return {
    status,
    premium,
    planType: row.plan_type ?? "free",
    billingCycle: row.billing_cycle ?? null,
    trialEndsAt: row.trial_end_date ?? null,
    nextPaymentDate: row.next_payment_date ?? null,
    cancelledDate: row.cancelled_date ?? null,
  };
}

export class PremiumRequiredError extends Error {
  code = "PREMIUM_REQUIRED";
  constructor(message = "PREMIUM_REQUIRED") {
    super(message);
  }
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Backend gate for premium features. Free users get a small daily allowance
 * on some features and zero on others.
 */
export async function assertFeatureAccess(
  supabase: SupabaseClient<any>,
  userId: string,
  feature: "scan" | "recipe" | "fridge" | "insights",
): Promise<AccessState> {
  const access = await getAccessState(supabase, userId);
  if (access.premium) return access;

  if (feature === "fridge" || feature === "insights") {
    throw new PremiumRequiredError();
  }

  const table = feature === "scan" ? "scans" : "recipes";
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfToday());

  const limit = feature === "scan" ? FREE_LIMITS.scansPerDay : FREE_LIMITS.recipesPerDay;
  if ((count ?? 0) >= limit) throw new PremiumRequiredError();
  return access;
}

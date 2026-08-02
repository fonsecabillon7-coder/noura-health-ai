import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSubscription } from "@/lib/billing.functions";

export type SubscriptionState = Awaited<ReturnType<typeof getSubscription>>;

export function useSubscription() {
  const fn = useServerFn(getSubscription);
  const q = useQuery({
    queryKey: ["subscription"],
    queryFn: () => fn(),
    staleTime: 60_000,
  });
  return {
    ...q,
    premium: q.data?.premium ?? false,
    status: q.data?.status ?? "FREE",
    subscription: q.data,
  };
}

export function isPremiumError(e: unknown) {
  const m = (e as any)?.message ?? "";
  return typeof m === "string" && m.includes("PREMIUM_REQUIRED");
}

import { createFileRoute } from "@tanstack/react-router";

type Json = Record<string, any>;

function pick(obj: Json | undefined, path: string[]): any {
  return path.reduce((acc: any, k) => (acc == null ? acc : acc[k]), obj);
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/hotmart")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const hottok = process.env["HOTMART_HOTTOK"];
        const raw = await request.text();

        let body: Json = {};
        try {
          body = JSON.parse(raw || "{}");
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const sent =
          request.headers.get("x-hotmart-hottok") ||
          request.headers.get("hottok") ||
          (body["hottok"] as string) ||
          "";

        if (!hottok || !sent || !timingSafeEqual(sent, hottok)) {
          return new Response("Invalid token", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const eventType: string = body["event"] || body["status"] || "UNKNOWN";
        const eventId: string | null = body["id"] ?? null;
        const data: Json = body["data"] ?? body;

        const email: string | null =
          pick(data, ["buyer", "email"]) ?? pick(data, ["subscriber", "email"]) ?? null;
        const externalUserId: string | null =
          pick(data, ["purchase", "sckPaymentLink"]) ??
          pick(data, ["purchase", "tracking", "source_sck"]) ??
          pick(data, ["tracking", "source_sck"]) ??
          null;

        // Idempotency: skip duplicates
        if (eventId) {
          const { data: dup } = await supabaseAdmin
            .from("hotmart_events").select("id").eq("event_id", eventId).maybeSingle();
          if (dup) return Response.json({ ok: true, duplicate: true });
        }

        let userId: string | null = null;
        if (externalUserId && /^[0-9a-f-]{36}$/i.test(externalUserId)) userId = externalUserId;
        if (!userId && email) {
          const { data: p } = await supabaseAdmin
            .from("profiles").select("user_id").ilike("email", email).maybeSingle();
          userId = (p as any)?.user_id ?? null;
        }

        let error: string | null = null;

        try {
          if (!userId) throw new Error(`No Neura user matched (email: ${email ?? "n/a"})`);

          const recurrency = pick(data, ["purchase", "recurrence_number"]);
          const planName: string = (pick(data, ["subscription", "plan", "name"]) ?? "").toLowerCase();
          const period = pick(data, ["purchase", "payment", "installments_number"]);
          const billing =
            planName.includes("anual") || planName.includes("annual") || planName.includes("year")
              ? "annual"
              : "monthly";
          const price = Number(pick(data, ["purchase", "price", "value"]) ?? 0);
          const nextCharge =
            pick(data, ["purchase", "date_next_charge"]) ??
            pick(data, ["subscription", "date_next_charge"]) ??
            null;
          const subscriberCode = pick(data, ["subscription", "subscriber", "code"]) ?? null;
          const transaction = pick(data, ["purchase", "transaction"]) ?? null;
          const productId = String(pick(data, ["product", "id"]) ?? "");

          const base: Json = {
            user_id: userId,
            hotmart_subscriber_code: subscriberCode,
            hotmart_transaction: transaction,
            hotmart_user_id: pick(data, ["buyer", "ucode"]) ?? null,
            product_id: productId || null,
            billing_cycle: billing,
            price_usd: price || (billing === "annual" ? 39.99 : 4.99),
            updated_at: new Date().toISOString(),
          };

          let patch: Json = {};
          switch (eventType) {
            case "PURCHASE_APPROVED":
            case "PURCHASE_COMPLETE":
            case "SWITCH_PLAN":
              patch = {
                ...base,
                status: "PREMIUM",
                plan_type: "premium",
                trial_active: false,
                subscription_start_date: new Date().toISOString(),
                next_payment_date: nextCharge
                  ? new Date(nextCharge).toISOString()
                  : new Date(Date.now() + (billing === "annual" ? 365 : 30) * 864e5).toISOString(),
                cancelled_date: null,
              };
              break;
            case "SUBSCRIPTION_CANCELLATION":
              patch = { ...base, status: "CANCELLED", cancelled_date: new Date().toISOString() };
              break;
            case "PURCHASE_REFUNDED":
            case "PURCHASE_CHARGEBACK":
            case "PURCHASE_PROTEST":
            case "PURCHASE_EXPIRED":
            case "PURCHASE_CANCELED":
              patch = { ...base, status: "EXPIRED", plan_type: "free", next_payment_date: null };
              break;
            case "PURCHASE_DELAYED":
            case "PURCHASE_BILLET_PRINTED":
            case "PURCHASE_OUT_OF_SHOPPING_CART":
              patch = {};
              break;
            default:
              patch = {};
          }

          if (Object.keys(patch).length) {
            const { data: existing } = await supabaseAdmin
              .from("subscriptions").select("id").eq("user_id", userId).maybeSingle();
            if (existing) await supabaseAdmin.from("subscriptions").update(patch).eq("user_id", userId);
            else await supabaseAdmin.from("subscriptions").insert(patch);

            await supabaseAdmin
              .from("profiles")
              .update({ plan: patch["plan_type"] ?? "premium" })
              .eq("user_id", userId);

            await supabaseAdmin.from("analytics_events").insert({
              user_id: userId,
              name: `hotmart_${eventType.toLowerCase()}`,
              props: { billing, price, recurrency, period },
              source: "hotmart",
            });
          }
        } catch (e: any) {
          error = e?.message ?? String(e);
        }

        await supabaseAdmin.from("hotmart_events").insert({
          event_id: eventId,
          event_type: eventType,
          email,
          user_id: userId,
          payload: body,
          processed: !error,
          error,
        });

        return Response.json({ ok: !error, error });
      },
      GET: async () => Response.json({ ok: true, endpoint: "hotmart-webhook" }),
    },
  },
});

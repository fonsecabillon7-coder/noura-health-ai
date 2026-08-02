import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createCheckout, getSubscription, trackEvent } from "@/lib/billing.functions";

const search = z.object({ cycle: z.enum(["monthly", "annual"]).default("annual") });

export const Route = createFileRoute("/_authenticated/checkout")({
  validateSearch: search,
  component: Checkout,
});

function Checkout() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { cycle } = useSearch({ from: "/_authenticated/checkout" });
  const start = useServerFn(createCheckout);
  const status = useServerFn(getSubscription);
  const track = useServerFn(trackEvent);

  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await start({ data: { cycle } });
        if (!alive) return;
        if (res.ok) setUrl(res.url);
        else setErr("NO_CHECKOUT_URL");
      } catch (e: any) {
        setErr(e?.message ?? "error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [cycle]);

  // Poll subscription while the checkout is open — the Hotmart webhook
  // activates premium server-side.
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const s = await status();
        if (s.premium) {
          await track({ data: { name: "subscription_activated", props: { cycle } } }).catch(() => {});
          nav({ to: "/dashboard" });
        }
      } catch {
        /* ignore */
      }
    }, 6000);
    return () => clearInterval(id);
  }, [cycle]);

  const price = useMemo(() => (cycle === "annual" ? "US$39.99" : "US$4.99"), [cycle]);

  async function manualCheck() {
    setChecking(true);
    try {
      const s = await status();
      if (s.premium) nav({ to: "/dashboard" });
      else setErr("PENDING");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center gap-3 px-5 pb-3 pt-12">
        <button onClick={() => nav({ to: "/paywall" })} className="grid h-10 w-10 place-items-center rounded-full bg-white/8">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="text-[15px] font-semibold">{t("pay.checkout", { defaultValue: "Secure checkout" })}</div>
          <div className="text-xs text-muted-foreground">
            Neura AI Premium · {cycle === "annual" ? t("ob.pay.annual") : t("ob.pay.monthly")} · {price}
          </div>
        </div>
        <ShieldCheck className="h-5 w-5 text-emerald" />
      </div>

      {!url && !err && (
        <div className="grid flex-1 place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald" />
        </div>
      )}

      {err === "NO_CHECKOUT_URL" && (
        <div className="mx-auto mt-16 max-w-sm px-6 text-center">
          <div className="text-3xl">🔧</div>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("pay.noLink", {
              defaultValue:
                "Checkout link not configured yet. Add your Hotmart checkout URL in the admin panel (Plans).",
            })}
          </p>
        </div>
      )}

      {url && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative flex-1">
          <iframe
            src={url}
            title="Neura AI checkout"
            className="h-full min-h-[70vh] w-full border-0 bg-white"
            allow="payment *"
          />
        </motion.div>
      )}

      <div className="space-y-2 px-5 pb-8 pt-3">
        <button
          onClick={manualCheck}
          disabled={checking}
          className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-white py-3.5 text-sm font-semibold text-black disabled:opacity-60"
        >
          {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {t("pay.iPaid", { defaultValue: "I completed the payment" })}
        </button>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 py-2 text-xs text-muted-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("pay.openExternal", { defaultValue: "Trouble loading? Open secure page" })}
          </a>
        )}
        {err === "PENDING" && (
          <p className="text-center text-xs text-muted-foreground">
            {t("pay.pending", { defaultValue: "Payment not confirmed yet — it can take a few seconds." })}
          </p>
        )}
      </div>
    </div>
  );
}

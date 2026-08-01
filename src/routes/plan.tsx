import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Droplets, Flame, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { buildPlan, loadOnboarding } from "@/lib/noura";

export const Route = createFileRoute("/plan")({
  component: PlanReveal,
  head: () => ({
    meta: [
      { title: "Your plan is ready — Neura AI" },
      { name: "description", content: "See your personalized calorie, macro, hydration and habit targets from Neura AI." },
      { property: "og:title", content: "Your plan is ready — Neura AI" },
      { property: "og:description", content: "See your personalized calorie, macro, hydration and habit targets from Neura AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function PlanReveal() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [d, setD] = useState(loadOnboarding());
  useEffect(() => setD(loadOnboarding()), []);
  const plan = useMemo(() => buildPlan(d), [d]);

  const macros = [
    { label: t("ob.plan.protein"), v: `${plan.protein}g` },
    { label: t("ob.plan.carbs"), v: `${plan.carbs}g` },
    { label: t("ob.plan.fat"), v: `${plan.fat}g` },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald/20 blur-[130px]" />
      <div className="relative z-10 mx-auto max-w-md px-6 pb-28 pt-16">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 text-emerald">
            <Sparkles className="h-4 w-4" />
            <span className="text-[11px] font-semibold uppercase tracking-widest">{t("ob.plan.forYou")}</span>
          </div>
          <h1 className="mt-3 font-display text-[28px] font-bold leading-tight tracking-tight">{t("ob.plan.ready")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("ob.plan.sub")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-strong mt-6 rounded-[28px] p-6 text-center shadow-premium"
        >
          <Flame className="mx-auto h-5 w-5 text-emerald" />
          <div className="mt-2 font-display text-5xl font-bold tabular-nums">{plan.kcal}</div>
          <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{t("ob.plan.calories")}</div>
        </motion.div>

        <div className="mt-3 grid grid-cols-3 gap-3">
          {macros.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              className="glass rounded-[22px] p-4 text-center"
            >
              <div className="font-display text-xl font-bold tabular-nums">{m.v}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">{m.label}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass mt-3 flex items-center gap-3 rounded-[22px] p-4"
        >
          <Droplets className="h-5 w-5 text-hydration" />
          <span className="flex-1 text-sm">{t("ob.plan.water")}</span>
          <span className="font-display text-lg font-bold tabular-nums">{(plan.waterMl / 1000).toFixed(1)}L</span>
        </motion.div>

        {plan.weeklyDelta !== 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36 }}
            className="glass mt-3 rounded-[22px] p-4"
          >
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{t("ob.plan.weekly")}</div>
            <div className="mt-4 flex h-24 items-end gap-2">
              {plan.weeks.map((w) => {
                const all = plan.weeks.map((x) => x.weight);
                const min = Math.min(...all) - 1;
                const max = Math.max(...all) + 1;
                const h = 20 + ((w.weight - min) / (max - min)) * 70;
                return (
                  <motion.div
                    key={w.week}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.4 + w.week * 0.07 }}
                    className="flex-1 rounded-t-lg bg-gradient-to-t from-emerald/30 to-emerald"
                  />
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              {plan.weeks.map((w) => (
                <span key={w.week}>{w.weight}kg</span>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mt-5">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{t("ob.plan.habits")}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {plan.habits.map((h) => (
              <span key={h.key} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[13px]">
                {h.icon} {h.name}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-background via-background/95 to-transparent px-6 pb-8 pt-6">
        <div className="mx-auto max-w-md">
          <button
            onClick={() => nav({ to: "/paywall" })}
            className="flex w-full items-center justify-center gap-2 rounded-[24px] bg-white py-4 text-[15px] font-semibold text-black"
          >
            {t("ob.plan.cta")} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

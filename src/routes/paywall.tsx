import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { buildPlan, clearOnboarding, loadOnboarding } from "@/lib/noura";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/paywall")({
  component: Paywall,
  head: () => ({
    meta: [
      { title: "Neura AI Premium — start your transformation" },
      { name: "description", content: "Unlock unlimited AI food analysis, personalized recipes, hydration and habit tracking with Neura AI Premium." },
      { property: "og:title", content: "Neura AI Premium — start your transformation" },
      { property: "og:description", content: "Unlock unlimited AI food analysis, personalized recipes, hydration and habit tracking with Neura AI Premium." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Paywall() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [sel, setSel] = useState<"annual" | "monthly">("annual");
  const [saving, setSaving] = useState(false);
  const [d, setD] = useState(loadOnboarding());
  useEffect(() => setD(loadOnboarding()), []);

  async function finish(plan: "free" | "premium") {
    setSaving(true);
    const p = buildPlan(d);
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await supabase
          .from("profiles")
          .update({
            goal: d.goal ?? null,
            challenge: d.challenge ?? null,
            body_goal: d.bodyGoal ?? null,
            age: d.age ?? null,
            height_cm: d.heightCm ?? null,
            weight_kg: d.weightKg ?? null,
            target_weight_kg: d.targetWeightKg ?? null,
            activity_level: d.activity ?? null,
            nutrition_style: d.nutritionStyle ?? null,
            hydration_habit: d.hydration ?? null,
            equipment: d.equipment ?? [],
            favorite_foods: d.likes ?? [],
            avoided_foods: d.avoids ?? [],
            diets: d.diets ?? [],
            allergies: d.allergies ?? [],
            cook_time: d.cookTime ?? null,
            motivation: d.motivation ?? null,
            country: d.country ?? null,
            language: d.language ?? "en-US",
            kcal_goal: p.kcal,
            protein_goal: p.protein,
            carbs_goal: p.carbs,
            fat_goal: p.fat,
            fiber_goal: p.fiber,
            water_goal_ml: p.waterMl,
            onboarding_completed: true,
            plan,
          })
          .eq("user_id", data.user.id);
      }
      clearOnboarding();
    } catch {
      /* profile sync retried on next dashboard load */
    }
    nav({ to: "/dashboard" });
  }

  const benefits = ["b1", "b2", "b3", "b4", "b5"].map((k) => t(`ob.pay.${k}`));

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald/20 blur-[130px]" />
      <div className="relative z-10 mx-auto max-w-md px-6 pb-32 pt-14">
        <button
          onClick={() => finish("free")}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/8"
          aria-label={t("ob.pay.later") as string}
        >
          <X className="h-4 w-4" />
        </button>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
          <div className="flex items-center gap-2 text-emerald">
            <Sparkles className="h-4 w-4" />
            <span className="text-[11px] font-semibold uppercase tracking-widest">Neura AI Premium</span>
          </div>
          <h1 className="mt-3 font-display text-[28px] font-bold leading-tight tracking-tight">{t("ob.pay.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("ob.pay.sub")}</p>
        </motion.div>

        <div className="mt-6 space-y-2.5">
          {benefits.map((b, i) => (
            <motion.div
              key={b}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * i }}
              className="flex items-center gap-3"
            >
              <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald/20">
                <Check className="h-3.5 w-3.5 text-emerald" />
              </div>
              <span className="text-sm">{b}</span>
            </motion.div>
          ))}
        </div>

        <div className="mt-7 space-y-3">
          <button
            onClick={() => setSel("annual")}
            className={`relative flex w-full items-center gap-3 rounded-[24px] border p-4 text-left ${
              sel === "annual" ? "border-emerald/60 bg-emerald/10 shadow-emerald-glow" : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="flex-1">
              <div className="text-[15px] font-semibold">{t("ob.pay.annual")}</div>
              <div className="text-xs text-muted-foreground">US$49.90 {t("ob.pay.perYear")}</div>
            </div>
            <span className="rounded-full bg-emerald px-2.5 py-1 text-[10px] font-bold text-black">
              {t("ob.pay.save")}
            </span>
          </button>
          <button
            onClick={() => setSel("monthly")}
            className={`flex w-full items-center gap-3 rounded-[24px] border p-4 text-left ${
              sel === "monthly" ? "border-emerald/60 bg-emerald/10" : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="flex-1">
              <div className="text-[15px] font-semibold">{t("ob.pay.monthly")}</div>
              <div className="text-xs text-muted-foreground">US$19.90 {t("ob.pay.perMonth")}</div>
            </div>
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {t("ob.pay.trial")} · {t("ob.pay.today")}
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-background via-background/95 to-transparent px-6 pb-8 pt-6">
        <div className="mx-auto max-w-md">
          <button
            disabled={saving}
            onClick={() => finish("premium")}
            className="w-full rounded-[24px] bg-white py-4 text-[15px] font-semibold text-black disabled:opacity-60"
          >
            {t("ob.pay.ctaTrial")}
          </button>
          <button onClick={() => finish("free")} className="mt-3 w-full py-2 text-xs text-muted-foreground">
            {t("ob.pay.later")}
          </button>
          <p className="mt-2 text-center text-[10px] text-muted-foreground/70">{t("ob.pay.legal")}</p>
        </div>
      </div>
    </div>
  );
}

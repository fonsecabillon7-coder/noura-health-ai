import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { LangSwitcher } from "@/components/lang-switcher";
import { loadOnboarding } from "@/lib/noura";

export const Route = createFileRoute("/auth")({ component: Auth });

function Auth() {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name },
          },
        });
        if (error) throw error;
        if (!data.session) { setConfirm(true); return; }
        // Save onboarding to profile if available
        const onb = loadOnboarding();
        await supabase.from("profiles").update({
          name: name || undefined,
          language: i18n.resolvedLanguage || "en-US",
          goal: onb.goal,
          activity_level: onb.activity,
          age: onb.age,
          height_cm: onb.heightCm,
          weight_kg: onb.weightKg,
          target_weight_kg: onb.targetWeightKg,
          diets: onb.diets,
          allergies: onb.allergies,
          equipment: onb.equipment,
          cook_time: onb.cookTime,
          motivation: onb.motivation,
          water_goal_ml: onb.water ? Math.round(onb.water * 250) : undefined,
          onboarding_completed: true,
        }).eq("user_id", data.user!.id);
        nav({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: "/dashboard" });
      }
    } catch (e: any) {
      setErr(e.message || t("auth.errorGeneric"));
    } finally { setLoading(false); }
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute right-5 top-14 z-10"><LangSwitcher /></div>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-emerald/15 blur-[100px]" />
      </div>
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-6 pt-14 pb-10">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-emerald to-emerald/60"><Sparkles className="h-4 w-4 text-black" /></div>
          <span className="text-lg font-semibold tracking-tight">Noura AI</span>
        </div>
        <div className="mt-14">
          <h1 className="font-display text-3xl font-bold tracking-tight">{t("auth.welcome")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{mode === "in" ? t("auth.signInSub") : t("auth.signUpSub")}</p>
        </div>
        {confirm ? (
          <div className="glass-strong mt-8 rounded-3xl p-6 text-center">
            <div className="text-3xl">📬</div>
            <p className="mt-3 text-sm">{t("auth.checkEmail")}</p>
          </div>
        ) : (
          <motion.form onSubmit={submit} className="mt-8 space-y-3">
            {mode === "up" && (
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("common.name")} className="glass w-full rounded-2xl px-4 py-4 text-sm outline-none placeholder:text-muted-foreground" />
            )}
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("common.email")} className="glass w-full rounded-2xl px-4 py-4 text-sm outline-none placeholder:text-muted-foreground" />
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("common.password")} className="glass w-full rounded-2xl px-4 py-4 text-sm outline-none placeholder:text-muted-foreground" />
            {err && <p className="rounded-2xl bg-destructive/15 px-4 py-2.5 text-sm text-destructive">{err}</p>}
            <button disabled={loading} className="w-full rounded-[28px] bg-white py-5 text-[17px] font-semibold text-black shadow-premium disabled:opacity-60">
              {loading ? t("common.loading") : mode === "in" ? t("common.signIn") : t("common.signUp")}
            </button>
            <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full py-3 text-center text-sm text-muted-foreground">
              {mode === "in" ? t("auth.orSignUp") : t("auth.orSignIn")}
            </button>
          </motion.form>
        )}
      </div>
    </div>
  );
}

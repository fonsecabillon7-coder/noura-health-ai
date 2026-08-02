import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { BottomNav } from "@/components/bottom-nav";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, upsertProfile } from "@/lib/data.functions";
import { useTranslation } from "react-i18next";
import { LangSwitcher } from "@/components/lang-switcher";
import { Crown, ChevronRight, Target, Droplets, Flame, LogOut, History as HistoryIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/use-subscription";
import { amIAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/profile")({ component: Profile });

function Profile() {
  const { t, i18n } = useTranslation();
  const fetch = useServerFn(getProfile);
  const save = useServerFn(upsertProfile);
  const adminCheck = useServerFn(amIAdmin);
  const qc = useQueryClient();
  const nav = useNavigate();
  const { premium, status } = useSubscription();
  const isAdmin = useQuery({ queryKey: ["is-admin"], queryFn: () => adminCheck() });
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => fetch() });
  const mut = useMutation({
    mutationFn: (data: Record<string, unknown>) => save({ data }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });

  const name = profile?.name || "";
  const ms = profile?.measurement_system || "metric";

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-md px-5 pt-14">
        <div className="flex items-start justify-between">
          <div>
            <div className="glass-strong rounded-[28px] p-5">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-emerald to-hydration font-display text-2xl font-bold text-black">{(name[0] || "N").toUpperCase()}</div>
                <div>
                  <div className="font-display text-xl font-bold">{name || "Neura"}</div>
                  <div className="text-xs text-muted-foreground">{profile?.goal || ""}</div>
                </div>
              </div>
              <button onClick={() => nav({ to: premium ? "/checkout" : "/paywall", ...(premium ? { search: { cycle: "annual" as const } } : {}) } as any)} className="mt-4 flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-gold/25 to-gold/10 p-3">
                <div className="flex items-center gap-2"><Crown className="h-5 w-5 text-gold" /><span className="font-semibold text-gold">{premium ? `Premium · ${status}` : "Upgrade to Premium"}</span></div>
                <ChevronRight className="h-4 w-4 text-gold" />
              </button>
            </div>
          </div>
          <LangSwitcher />
        </div>

        {/* Language */}
        <div className="glass-strong mt-4 rounded-[24px] p-5">
          <div className="text-xs text-muted-foreground">{t("profile.language")}</div>
          <div className="mt-2 flex gap-2">
            {[["en-US", "🇺🇸 English"], ["pt-BR", "🇧🇷 Português"]].map(([code, label]) => (
              <button key={code} onClick={() => { i18n.changeLanguage(code); mut.mutate({ language: code, locale: code }); }}
                className={`flex-1 rounded-2xl border py-2.5 text-xs ${(profile?.language || i18n.resolvedLanguage) === code ? "border-emerald/60 bg-emerald/10 text-emerald" : "border-white/8"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Measurement */}
        <div className="glass-strong mt-4 rounded-[24px] p-5">
          <div className="text-xs text-muted-foreground">{t("profile.measurementSystem")}</div>
          <div className="mt-2 flex gap-2">
            {[["metric", t("profile.metric")], ["imperial", t("profile.imperial")]].map(([v, l]) => (
              <button key={v} onClick={() => mut.mutate({ measurement_system: v })}
                className={`flex-1 rounded-2xl border py-2.5 text-xs ${ms === v ? "border-emerald/60 bg-emerald/10 text-emerald" : "border-white/8"}`}>{l}</button>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div className="glass-strong mt-4 rounded-[24px] p-5">
          <div className="text-sm font-semibold">{t("profile.dailyGoals")}</div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Stat Icon={Flame} color="text-calorie" label={t("profile.kcalGoal")} val={String(profile?.kcal_goal ?? 2200)} />
            <Stat Icon={Droplets} color="text-hydration" label={t("profile.waterGoal")} val={`${profile?.water_goal_ml ?? 2000} ml`} />
            <Stat Icon={Target} color="text-emerald" label="Protein" val={`${profile?.protein_goal ?? 140}g`} />
            <Stat Icon={Target} color="text-carbs" label="Carbs" val={`${profile?.carbs_goal ?? 250}g`} />
          </div>
        </div>

        <Link
          to="/scans"
          className="glass mt-6 flex w-full items-center justify-between rounded-2xl px-4 py-4 text-sm font-medium"
        >
          <span className="flex items-center gap-2">
            <HistoryIcon className="h-4 w-4 text-emerald" />
            {t("scans.title", { defaultValue: "Scan history" })}
          </span>
          <span className="text-muted-foreground">›</span>
        </Link>

        {isAdmin.data?.admin && (
          <Link to="/admin" className="glass mt-3 flex w-full items-center justify-between rounded-2xl px-4 py-4 text-sm font-medium">
            <span className="flex items-center gap-2">👑 Admin dashboard</span>
            <span className="text-muted-foreground">›</span>
          </Link>
        )}

        <button onClick={signOut} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-4 text-sm">
          <LogOut className="h-4 w-4" /> {t("common.signOut")}
        </button>
      </div>
      <BottomNav />
    </div>
  );
}

function Stat({ Icon, color, label, val }: { Icon: React.ComponentType<{ className?: string }>; color: string; label: string; val: string }) {
  return (
    <div className="glass rounded-2xl p-3">
      <Icon className={`h-4 w-4 ${color}`} />
      <div className="mt-2 font-display text-lg font-bold">{val}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

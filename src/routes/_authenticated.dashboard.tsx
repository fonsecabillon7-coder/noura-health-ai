import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Flame, Droplets, Beef, Wheat, Nut, Sparkles, Wheat as FiberIcon, Trophy, ChevronRight } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { ProgressRing } from "@/components/progress-ring";
import { BodyHydration } from "@/components/body-hydration";
import { getDashboard, logWater } from "@/lib/data.functions";
import { useMemo, useState, useEffect } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const { t, i18n } = useTranslation();
  const fetchDash = useServerFn(getDashboard);
  const addWater = useServerFn(logWater);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDash() });
  const mutate = useMutation({
    mutationFn: (ml: number) => addWater({ data: { ml } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? "goodMorning" : hour < 18 ? "goodAfternoon" : "goodEvening";
  const dateFmt = new Intl.DateTimeFormat(i18n.resolvedLanguage, { weekday: "long", month: "short", day: "numeric" }).format(new Date());
  const motivations = t("dashboard.motivations", { returnObjects: true }) as string[];
  const motivation = useMemo(() => motivations[new Date().getDate() % motivations.length], [motivations]);

  const totals = data?.totals ?? { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, waterMl: 0 };
  const goals = data?.goals ?? { kcal: 2200, protein: 140, carbs: 250, fat: 70, fiber: 30, waterMl: 2000 };
  const habits = data?.habits ?? { total: 0, done: 0 };
  const score = data?.balanceScore ?? 0;
  const remaining = Math.max(0, goals.kcal - totals.kcal);
  const name = data?.profile?.name || "";

  return (
    <div className="relative min-h-screen pb-4">
      <div className="mx-auto max-w-md px-5 pt-14">
        <div>
          <div className="text-xs text-muted-foreground">{dateFmt}</div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
            {t(`dashboard.${greetingKey}`)}{name ? `, ` : ""}<span className="text-gradient-emerald">{name}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{motivation}</p>
        </div>

        {/* Today's progress + Balance score */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-strong mt-5 rounded-[28px] p-5 shadow-premium">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-muted-foreground">{t("dashboard.balanceScore")}</div>
              <div className="mt-1 font-display text-5xl font-bold">{score}</div>
              <div className="text-xs text-muted-foreground">/ 100</div>
            </div>
            <ProgressRing size={92} progress={score / 100} color="oklch(0.72 0.18 155)">
              <Trophy className="h-6 w-6 text-emerald" />
            </ProgressRing>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            <MiniRing label={t("dashboard.protein")} value={totals.kcal} goal={goals.kcal} color="oklch(0.75 0.17 55)" Icon={Flame} suffix="kcal" />
            <MiniRing label={t("dashboard.protein")} value={totals.protein} goal={goals.protein} color="oklch(0.68 0.20 25)" Icon={Beef} suffix="g" />
            <MiniRing label={t("dashboard.carbs")} value={totals.carbs} goal={goals.carbs} color="oklch(0.78 0.15 75)" Icon={Wheat} suffix="g" />
            <MiniRing label={t("dashboard.habitsCompleted")} value={habits.done} goal={Math.max(1, habits.total)} color="oklch(0.72 0.15 235)" Icon={Sparkles} suffix="" />
          </div>
        </motion.div>

        {/* Calorie summary */}
        <div className="glass-strong mt-4 flex items-center justify-between rounded-[28px] p-5">
          <div>
            <div className="text-xs text-muted-foreground">{t("dashboard.caloriesEaten")}</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold">{Math.round(totals.kcal)}</span>
              <span className="text-sm text-muted-foreground">/ {goals.kcal}</span>
            </div>
            <div className="mt-0.5 text-xs text-emerald">{Math.round(remaining)} {t("dashboard.remaining")}</div>
          </div>
          <ProgressRing size={88} progress={totals.kcal / goals.kcal} color="oklch(0.75 0.17 55)">
            <Flame className="h-6 w-6 text-calorie" />
          </ProgressRing>
        </div>

        {/* Macros */}
        <div className="mt-3 grid grid-cols-3 gap-3">
          <MacroCard label={t("dashboard.protein")} value={Math.round(totals.protein)} goal={goals.protein} color="oklch(0.68 0.20 25)" Icon={Beef} />
          <MacroCard label={t("dashboard.carbs")} value={Math.round(totals.carbs)} goal={goals.carbs} color="oklch(0.78 0.15 75)" Icon={Wheat} />
          <MacroCard label={t("dashboard.fat")} value={Math.round(totals.fat)} goal={goals.fat} color="oklch(0.7 0.15 235)" Icon={Nut} />
        </div>
        <div className="mt-3">
          <MacroCard label={t("dashboard.fiber")} value={Math.round(totals.fiber)} goal={goals.fiber} color="oklch(0.72 0.18 155)" Icon={FiberIcon} wide />
        </div>

        {/* Hydration — animated body */}
        <Link to="/hydration" className="glass-strong mt-4 flex items-center gap-4 rounded-[28px] p-5 active:scale-[0.99] transition">
          <BodyHydration progress={totals.waterMl / goals.waterMl} height={160} />
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold"><Droplets className="h-4 w-4 text-hydration" />{t("dashboard.hydration")}<ChevronRight className="ml-auto h-4 w-4 text-white/40" /></div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-display text-3xl font-bold">{totals.waterMl}</span>
              <span className="text-sm text-muted-foreground">/ {goals.waterMl} ml</span>
            </div>
            <div className="text-xs text-hydration">{Math.round((totals.waterMl / goals.waterMl) * 100)}%</div>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {[125, 250, 500].map((ml) => (
                <motion.button
                  key={ml}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); mutate.mutate(ml); setPulse(ml); }}
                  className="rounded-xl bg-hydration/15 py-2 text-[11px] font-bold text-hydration"
                >
                  +{ml}
                </motion.button>
              ))}
            </div>
          </div>
          <AnimatePresence>
            {pulse && (
              <motion.div
                key={pulse}
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                onAnimationComplete={() => setPulse(null)}
                className="pointer-events-none absolute right-6 rounded-full bg-emerald px-3 py-1 text-xs font-bold text-black"
              >
                +{pulse}ml
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        {/* Streaks */}
        {data?.streaks && (
          <div className="glass-strong mt-4 rounded-[28px] p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">{t("dashboard.streak")}</div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold">🔥 {data.streaks.overall.current}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{t("dashboard.longest")}: {data.streaks.overall.longest} · {t("dashboard.weekly")}: {data?.weekly.pct}%</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {data.weekly.days.map((v, i) => (
                  <div key={i} className={`h-1.5 w-10 rounded-full ${v ? "bg-emerald" : "bg-white/10"}`} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent meals */}
        <div className="mt-6">
          <h2 className="text-lg font-bold">{t("dashboard.recentMeals")}</h2>
          <div className="mt-3 space-y-3">
            {(data?.recentMeals ?? []).slice(0, 5).map((m: any) => (
              <div key={m.id} className="glass flex items-center gap-3 rounded-3xl p-3">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald/40 to-emerald/10">
                  <Sparkles className="h-5 w-5 text-white/60" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{Math.round(m.kcal)} kcal · P {Math.round(m.protein)}g · C {Math.round(m.carbs)}g · F {Math.round(m.fat)}g</div>
                </div>
              </div>
            ))}
            {(data?.recentMeals ?? []).length === 0 && (
              <div className="glass rounded-3xl p-6 text-center text-sm text-muted-foreground">—</div>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function MiniRing({ label, value, goal, color, Icon, suffix }: { label: string; value: number; goal: number; color: string; Icon: React.ComponentType<{ className?: string }>; suffix: string }) {
  return (
    <div className="flex flex-col items-center">
      <ProgressRing size={56} progress={value / goal} color={color} stroke={5}>
        <Icon className="h-4 w-4" />
      </ProgressRing>
      <div className="mt-1 text-[10px] text-white/60">{Math.round(value)}{suffix}</div>
    </div>
  );
}

function MacroCard({ label, value, goal, color, Icon, wide }: { label: string; value: number; goal: number; color: string; Icon: React.ComponentType<{ className?: string }>; wide?: boolean }) {
  return (
    <div className={`glass-strong rounded-3xl p-4 ${wide ? "flex items-center gap-4" : ""}`}>
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 flex items-baseline gap-0.5">
          <span className="font-display text-2xl font-bold">{value}</span>
          <span className="text-[10px] text-muted-foreground">/{goal}g</span>
        </div>
      </div>
      <div className={wide ? "" : "mt-3 flex justify-center"}>
        <ProgressRing size={wide ? 56 : 62} progress={value / goal} color={color}>
          <Icon className="h-4 w-4" />
        </ProgressRing>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getWaterHistory, logWater } from "@/lib/data.functions";
import { BottomNav } from "@/components/bottom-nav";
import { BodyHydration } from "@/components/body-hydration";
import { motion } from "framer-motion";
import { ArrowLeft, Droplets, Flame, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/hydration")({ component: HydrationPage });

function HydrationPage() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const fetchHistory = useServerFn(getWaterHistory);
  const addWater = useServerFn(logWater);
  const tzOffset = new Date().getTimezoneOffset();
  const { data } = useQuery({
    queryKey: ["water-history"],
    queryFn: () => fetchHistory({ data: { tzOffset } }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const mutate = useMutation({
    mutationFn: (ml: number) => addWater({ data: { ml } }),
    onMutate: async (ml: number) => {
      await qc.cancelQueries({ queryKey: ["water-history"] });
      const prev = qc.getQueryData(["water-history"]);
      qc.setQueryData(["water-history"], (old: any) => {
        if (!old?.days?.length) return old;
        const days = old.days.map((d: any, i: number) =>
          i === old.days.length - 1 ? { ...d, ml: d.ml + ml } : d,
        );
        return { ...old, days };
      });
      return { prev };
    },
    onError: (_e, _v, ctx: any) => { if (ctx?.prev) qc.setQueryData(["water-history"], ctx.prev); },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["water-history"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const days = data?.days ?? [];
  const goal = data?.goal ?? 2000;
  const today = days[days.length - 1]?.ml ?? 0;
  const week = days.slice(-7);
  const max = Math.max(goal, ...days.map((d) => d.ml), 1);
  const progress = Math.min(1, today / goal);
  const dayFmt = new Intl.DateTimeFormat(i18n.resolvedLanguage, { weekday: "short" });

  return (
    <div className="min-h-screen pb-4">
      <div className="mx-auto max-w-md px-5 pt-14">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold">{t("hydration.title", { defaultValue: "Hydration" })}</h1>
            <p className="text-xs text-muted-foreground">{t("hydration.subtitle", { defaultValue: "Keep your body flowing" })}</p>
          </div>
        </div>

        <div className="glass-strong mt-5 flex items-center gap-4 rounded-[28px] p-5">
          <BodyHydration progress={progress} height={220} />
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">{t("hydration.today", { defaultValue: "Today" })}</div>
            <div className="font-display text-4xl font-bold">{today}<span className="text-lg text-muted-foreground">ml</span></div>
            <div className="text-xs text-muted-foreground">/ {goal}ml</div>
            <div className="mt-4 space-y-2">
              {[125, 250, 500].map((ml) => (
                <motion.button
                  key={ml}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => mutate.mutate(ml)}
                  className="flex w-full items-center justify-between rounded-2xl bg-hydration/15 px-3 py-2.5 text-sm font-semibold text-hydration"
                >
                  <span className="flex items-center gap-2"><Droplets className="h-4 w-4" /> +{ml}ml</span>
                  <span className="text-xs opacity-70">
                    {ml === 125 ? "🥃" : ml === 250 ? "🥤" : "🍶"}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat icon={Flame} label={t("hydration.streak", { defaultValue: "Streak" })} value={`${data?.streak ?? 0}d`} />
          <Stat icon={TrendingUp} label={t("hydration.avg", { defaultValue: "Avg" })} value={`${data?.avg ?? 0}ml`} />
          <Stat icon={Droplets} label={t("hydration.goal", { defaultValue: "Goal" })} value={`${goal}ml`} />
        </div>

        <div className="glass-strong mt-4 rounded-[28px] p-5">
          <div className="mb-3 text-sm font-semibold">{t("hydration.thisWeek", { defaultValue: "This week" })}</div>
          <div className="flex h-32 items-end justify-between gap-2">
            {week.map((d) => {
              const h = Math.max(4, (d.ml / max) * 100);
              const hit = d.ml >= goal;
              return (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    className={`w-full rounded-t-lg ${hit ? "bg-gradient-to-t from-emerald to-emerald/50" : "bg-gradient-to-t from-hydration to-hydration/40"}`}
                  />
                  <div className="text-[10px] text-muted-foreground">{dayFmt.format(new Date(d.date)).slice(0, 2)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-strong mt-4 rounded-[28px] p-5">
          <div className="mb-3 text-sm font-semibold">{t("hydration.month", { defaultValue: "Last 30 days" })}</div>
          <div className="grid grid-cols-10 gap-1.5">
            {days.map((d) => {
              const pct = Math.min(1, d.ml / goal);
              const bg = pct === 0 ? "bg-white/5" : pct >= 1 ? "bg-emerald" : pct >= 0.5 ? "bg-hydration" : "bg-hydration/40";
              return <div key={d.date} title={`${d.date}: ${d.ml}ml`} className={`aspect-square rounded-md ${bg}`} />;
            })}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-hydration" />
      <div className="mt-1 font-display text-lg font-bold">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

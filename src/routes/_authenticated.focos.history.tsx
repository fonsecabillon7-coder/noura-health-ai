import { createFileRoute, Link } from "@tanstack/react-router";
import { BottomNav } from "@/components/bottom-nav";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { habitHistory } from "@/lib/data.functions";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/focos/history")({ component: HistoryPage });

function HistoryPage() {
  const { t, i18n } = useTranslation();
  const fetch = useServerFn(habitHistory);
  const { data: logs = [] } = useQuery({ queryKey: ["habit-history"], queryFn: () => fetch() });
  const dates = new Set((logs as any[]).map((l) => l.completed_on));

  // Build calendar for current month
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const offset = first.getDay();

  const monthLabel = new Intl.DateTimeFormat(i18n.resolvedLanguage, { month: "long", year: "numeric" }).format(now);
  const completedDays = [...dates].filter((d) => d.startsWith(now.toISOString().slice(0, 7))).length;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-md px-5 pt-14">
        <div className="flex items-center gap-3">
          <Link to="/focos" className="grid h-10 w-10 place-items-center rounded-full bg-white/8"><ChevronLeft className="h-5 w-5" /></Link>
          <h1 className="font-display text-2xl font-bold tracking-tight">{t("focos.history")}</h1>
        </div>

        <div className="glass-strong mt-5 rounded-[24px] p-5">
          <div className="text-sm font-semibold capitalize">{monthLabel}</div>
          <div className="mt-4 grid grid-cols-7 gap-1.5">
            {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: days }).map((_, i) => {
              const day = i + 1;
              const iso = new Date(now.getFullYear(), now.getMonth(), day).toISOString().slice(0, 10);
              const active = dates.has(iso);
              return (
                <div key={day} className={`grid aspect-square place-items-center rounded-xl text-xs font-medium ${active ? "bg-emerald/25 text-emerald" : "bg-white/5 text-white/40"}`}>
                  {day}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-between text-xs text-muted-foreground">
            <span>{completedDays} / {days} {t("focos.monthly")}</span>
            <span>{Math.round((completedDays / days) * 100)}%</span>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

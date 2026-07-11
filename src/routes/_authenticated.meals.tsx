import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/bottom-nav";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMealsAll } from "@/lib/data.functions";
import { useTranslation } from "react-i18next";
import { Search, Sparkles } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/meals")({ component: Meals });

function Meals() {
  const { t, i18n } = useTranslation();
  const fetchAll = useServerFn(listMealsAll);
  const { data: meals = [] } = useQuery({ queryKey: ["meals"], queryFn: () => fetchAll() });
  const [q, setQ] = useState("");
  const filtered = meals.filter((m: any) => m.name.toLowerCase().includes(q.toLowerCase()));
  const fmt = new Intl.DateTimeFormat(i18n.resolvedLanguage, { hour: "numeric", minute: "2-digit" });

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-md px-5 pt-14">
        <h1 className="font-display text-3xl font-bold tracking-tight">{t("meals.title")}</h1>
        <div className="glass mt-4 flex items-center gap-2 rounded-2xl px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("meals.search")} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </div>
        <div className="mt-5 space-y-3">
          {filtered.length === 0 && (
            <div className="glass rounded-3xl p-6 text-center text-sm text-muted-foreground">{t("meals.empty")}</div>
          )}
          {filtered.map((m: any) => (
            <div key={m.id} className="glass flex items-center gap-3 rounded-3xl p-3">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald/40 to-emerald/10">
                <Sparkles className="h-5 w-5 text-white/60" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{m.name}</div>
                <div className="text-xs text-muted-foreground">{fmt.format(new Date(m.eaten_at))} · {Math.round(m.kcal)} kcal</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

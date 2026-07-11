import { createFileRoute, Link } from "@tanstack/react-router";
import { BottomNav } from "@/components/bottom-nav";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listHabits, toggleHabit, createHabit } from "@/lib/data.functions";
import { Check, Plus, History, X } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/focos")({ component: Focos });

const ICONS = ["💧", "🏋️", "📖", "😴", "🥗", "🧘", "🚶", "💊", "☀️", "🎯", "✨", "🍎"];

function Focos() {
  const { t } = useTranslation();
  const list = useServerFn(listHabits);
  const toggle = useServerFn(toggleHabit);
  const create = useServerFn(createHabit);
  const qc = useQueryClient();
  const { data: habits = [] } = useQuery({ queryKey: ["habits"], queryFn: () => list() });
  const [open, setOpen] = useState(false);

  const toggleMut = useMutation({
    mutationFn: (id: string) => toggle({ data: { habitId: id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["habits"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); if (navigator.vibrate) navigator.vibrate(30); },
  });

  const done = habits.filter((h: any) => h.completed_today).length;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-md px-5 pt-14">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">{t("focos.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("focos.subtitle")}</p>
          </div>
          <Link to="/focos/history" className="grid h-10 w-10 place-items-center rounded-full bg-white/8"><History className="h-4 w-4" /></Link>
        </div>

        <div className="glass-strong mt-5 flex items-center justify-between rounded-[24px] p-4">
          <div>
            <div className="text-xs text-muted-foreground">{t("focos.completed")}</div>
            <div className="mt-1 font-display text-3xl font-bold">{done} / {habits.length}</div>
          </div>
          <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-full bg-emerald px-4 py-2 text-sm font-semibold text-black">
            <Plus className="h-4 w-4" /> {t("focos.newHabit")}
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {habits.length === 0 && (
            <div className="glass rounded-3xl p-6 text-center text-sm text-muted-foreground">{t("focos.empty")}</div>
          )}
          {habits.map((h: any) => {
            const active = h.completed_today;
            return (
              <motion.button
                key={h.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleMut.mutate(h.id)}
                className={`flex w-full items-center gap-4 rounded-3xl border p-4 text-left transition ${active ? "border-emerald/60 bg-emerald/10" : "border-white/8 bg-white/[0.03]"}`}
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl">{h.icon}</div>
                <div className="flex-1">
                  <div className={`font-semibold ${active ? "text-emerald" : ""}`}>{h.name}</div>
                  {h.category && <div className="text-xs text-muted-foreground">{h.category}</div>}
                </div>
                <div className={`grid h-8 w-8 place-items-center rounded-full ${active ? "bg-emerald text-black" : "border-2 border-white/20"}`}>
                  {active && <Check className="h-4 w-4" strokeWidth={3} />}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {open && <NewHabitSheet onClose={() => setOpen(false)} onCreate={async (h) => { await create({ data: h }); qc.invalidateQueries({ queryKey: ["habits"] }); setOpen(false); }} />}
      <BottomNav />
    </div>
  );
}

function NewHabitSheet({ onClose, onCreate }: { onClose: () => void; onCreate: (h: { name: string; icon: string; category?: string; frequency: string }) => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("✨");
  const [frequency, setFrequency] = useState("daily");
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full rounded-t-[32px] bg-background p-6 pb-10">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">{t("focos.createTitle")}</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("focos.habitName")} className="glass mt-4 w-full rounded-2xl px-4 py-3 text-sm outline-none" />
        <div className="mt-3">
          <div className="text-xs text-muted-foreground">Icon</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {ICONS.map((i) => (
              <button key={i} onClick={() => setIcon(i)} className={`h-10 w-10 rounded-2xl text-xl ${icon === i ? "bg-emerald/20 ring-2 ring-emerald" : "bg-white/8"}`}>{i}</button>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xs text-muted-foreground">{t("focos.frequency")}</div>
          <div className="mt-2 flex gap-2">
            {[["daily", t("focos.daily")], ["weekdays", t("focos.weekdays")], ["weekends", t("focos.weekends")]].map(([v, l]) => (
              <button key={v} onClick={() => setFrequency(v)} className={`flex-1 rounded-2xl border py-2.5 text-xs ${frequency === v ? "border-emerald/60 bg-emerald/10 text-emerald" : "border-white/8"}`}>{l}</button>
            ))}
          </div>
        </div>
        <button disabled={!name.trim()} onClick={() => onCreate({ name: name.trim(), icon, frequency })} className="mt-5 w-full rounded-2xl bg-white py-3.5 text-sm font-semibold text-black disabled:opacity-40">{t("common.save")}</button>
      </div>
    </div>
  );
}

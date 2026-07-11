import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/bottom-nav";
import { useState } from "react";
import { Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/shopping")({ component: Shopping });

const groups = [
  { cat: "Vegetables", items: ["Spinach", "Tomatoes", "Bell Pepper"] },
  { cat: "Protein", items: ["Chicken Breast", "Salmon Fillet", "Eggs"] },
  { cat: "Pantry", items: ["Olive Oil", "Brown Rice", "Quinoa"] },
];

function Shopping() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const toggle = (n: string) => setDone((s) => { const c = new Set(s); c.has(n) ? c.delete(n) : c.add(n); return c; });
  const total = groups.reduce((a, g) => a + g.items.length, 0);
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-md px-5 pt-14">
        <h1 className="font-display text-3xl font-bold tracking-tight">Shopping</h1>
        <div className="glass-strong mt-4 rounded-3xl p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{done.size} / {total}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
            <div className="h-full rounded-full bg-emerald transition-all" style={{ width: `${(done.size / total) * 100}%` }} />
          </div>
        </div>
        {groups.map((g) => (
          <div key={g.cat} className="mt-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{g.cat}</div>
            <div className="mt-2 space-y-2">
              {g.items.map((it) => {
                const on = done.has(it);
                return (
                  <button key={it} onClick={() => toggle(it)} className="glass flex w-full items-center gap-3 rounded-2xl p-3.5 text-left">
                    <div className={`grid h-6 w-6 place-items-center rounded-full border-2 ${on ? "border-emerald bg-emerald" : "border-white/20"}`}>
                      {on && <Check className="h-3.5 w-3.5 text-black" />}
                    </div>
                    <span className={`font-medium ${on ? "text-white/40 line-through" : ""}`}>{it}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}

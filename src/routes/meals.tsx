import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/bottom-nav";
import { Search } from "lucide-react";

export const Route = createFileRoute("/meals")({ component: Meals });

function Meals() {
  const meals = [
    { name: "Grilled Salmon", time: "12:37 PM", kcal: 550, tint: "from-orange-500/40 to-red-600/20" },
    { name: "Caesar Salad", time: "9:40 AM", kcal: 330, tint: "from-emerald/40 to-emerald/10" },
    { name: "Overnight Oats", time: "7:15 AM", kcal: 380, tint: "from-yellow-500/40 to-carbs/10" },
  ];
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-md px-5 pt-14">
        <h1 className="font-display text-3xl font-bold tracking-tight">Meals</h1>
        <div className="glass mt-4 flex items-center gap-2 rounded-2xl px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input placeholder="Search foods, meals..." className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </div>
        <div className="mt-5 text-xs uppercase tracking-wider text-muted-foreground">Today</div>
        <div className="mt-3 space-y-3">
          {meals.map((m) => (
            <div key={m.name} className="glass flex items-center gap-3 rounded-3xl p-3">
              <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${m.tint}`} />
              <div className="flex-1">
                <div className="font-semibold">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.time} · {m.kcal} kcal</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

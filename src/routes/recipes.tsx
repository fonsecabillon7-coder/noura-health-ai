import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/bottom-nav";
import { ChefHat } from "lucide-react";

export const Route = createFileRoute("/recipes")({ component: RecipesPage });

const recipes = [
  { title: "Herb Chicken Bowl", time: "22m", kcal: 480, p: 42, tags: ["High Protein", "Quick"], tint: "from-emerald/40 to-emerald/10" },
  { title: "Spinach Rice Skillet", time: "18m", kcal: 390, p: 14, tags: ["Vegetarian"], tint: "from-orange-500/40 to-orange-500/10" },
  { title: "Salmon Poke", time: "15m", kcal: 520, p: 38, tags: ["Low Carb"], tint: "from-red-500/40 to-pink-500/10" },
  { title: "Avocado Toast Plus", time: "8m", kcal: 340, p: 18, tags: ["Quick", "Breakfast"], tint: "from-yellow-500/40 to-emerald/10" },
];

function RecipesPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-md px-5 pt-14">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold tracking-tight">Recipes</h1>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald text-black">
            <ChefHat className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Scan your fridge — get recipes in seconds.</p>

        <button className="glass-strong mt-5 flex w-full items-center gap-3 rounded-[24px] p-4">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald text-black">
            <ChefHat className="h-5 w-5" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-semibold">Scan Refrigerator</div>
            <div className="text-xs text-muted-foreground">AI detects ingredients instantly</div>
          </div>
        </button>

        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {["All", "High Protein", "Low Carb", "Quick Meals", "Vegetarian", "Breakfast"].map((f, i) => (
            <button key={f} className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-medium ${i === 0 ? "border-emerald/60 bg-emerald/15 text-emerald" : "border-white/8 bg-white/[0.03] text-white/70"}`}>{f}</button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {recipes.map((r) => (
            <div key={r.title} className="glass rounded-3xl p-3">
              <div className={`h-36 rounded-2xl bg-gradient-to-br ${r.tint}`} />
              <div className="mt-3 flex items-start justify-between">
                <div>
                  <div className="font-semibold">{r.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{r.time} · {r.kcal} kcal · {r.p}g protein</div>
                </div>
              </div>
              <div className="mt-2 flex gap-1.5">
                {r.tags.map((t) => (
                  <span key={t} className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-white/70">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

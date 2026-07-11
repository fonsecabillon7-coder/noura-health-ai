import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/bottom-nav";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { generateRecipe } from "@/lib/ai.functions";
import { logMeal } from "@/lib/data.functions";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChefHat, Sparkles, Loader2, Clock, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/recipes")({ component: RecipesPage });

async function fetchRecipes() {
  const { data } = await supabase.from("recipes").select("*").order("created_at", { ascending: false }).limit(30);
  return data ?? [];
}

function RecipesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: recipes = [] } = useQuery({ queryKey: ["recipes"], queryFn: fetchRecipes });
  const gen = useServerFn(generateRecipe);
  const log = useServerFn(logMeal);
  const [ingredients, setIngredients] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<any>(null);

  const genMut = useMutation({
    mutationFn: () => gen({ data: { ingredients } }),
    onSuccess: (r) => { setIngredients(""); setError(null); qc.invalidateQueries({ queryKey: ["recipes"] }); setOpen(r); },
    onError: () => setError(t("recipes.error")),
  });

  const logMut = useMutation({
    mutationFn: (r: any) => log({ data: {
      name: r.title,
      kcal: r.macros?.kcal ?? 0, protein: r.macros?.protein ?? 0,
      carbs: r.macros?.carbs ?? 0, fat: r.macros?.fat ?? 0, fiber: 0, source: "recipe",
    }}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dashboard"] }); qc.invalidateQueries({ queryKey: ["meals"] }); setOpen(null); },
  });

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-md px-5 pt-14">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold tracking-tight">{t("recipes.title")}</h1>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald text-black"><ChefHat className="h-5 w-5" /></div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{t("recipes.subtitle")}</p>

        <div className="glass-strong mt-5 rounded-[24px] p-4">
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder={t("recipes.generatePlaceholder")}
            rows={2}
            className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            disabled={ingredients.trim().length < 2 || genMut.isPending}
            onClick={() => genMut.mutate()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald py-3 text-sm font-semibold text-black disabled:opacity-50"
          >
            {genMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("common.generating")}</> : <><Sparkles className="h-4 w-4" /> {t("recipes.generateBtn")}</>}
          </button>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>

        <div className="mt-5 space-y-3">
          {recipes.length === 0 && (
            <div className="glass rounded-3xl p-6 text-center text-sm text-muted-foreground">{t("recipes.empty")}</div>
          )}
          {recipes.map((r: any) => (
            <button key={r.id} onClick={() => setOpen(r)} className="glass block w-full rounded-3xl p-4 text-left">
              <div className="font-semibold">{r.title}</div>
              <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.description}</div>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.prep_minutes} {t("recipes.min")}</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.servings}</span>
                <span>{Math.round(r.macros?.kcal ?? 0)} kcal</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[85vh] w-full overflow-y-auto rounded-t-[32px] bg-background p-6 pb-10">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            <h2 className="font-display text-2xl font-bold">{open.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{open.description}</p>
            <div className="mt-3 flex gap-2 text-xs">
              <span className="rounded-full bg-white/8 px-3 py-1"><Clock className="mr-1 inline h-3 w-3" />{open.prep_minutes} {t("recipes.min")}</span>
              <span className="rounded-full bg-white/8 px-3 py-1"><Users className="mr-1 inline h-3 w-3" />{open.servings} {t("recipes.servings")}</span>
              <span className="rounded-full bg-emerald/20 px-3 py-1 text-emerald">{Math.round(open.macros?.kcal ?? 0)} kcal</span>
            </div>
            <div className="mt-5">
              <h3 className="text-sm font-bold">{t("recipes.ingredients")}</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {(open.ingredients ?? []).map((i: any, idx: number) => (
                  <li key={idx} className="flex justify-between border-b border-white/5 py-1.5">
                    <span>{i.item}</span><span className="text-muted-foreground">{i.amount}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-5">
              <h3 className="text-sm font-bold">{t("recipes.steps")}</h3>
              <ol className="mt-2 space-y-2 text-sm">
                {(open.steps ?? []).map((s: string, idx: number) => (
                  <li key={idx} className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald text-xs font-bold text-black">{idx + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
            <button onClick={() => logMut.mutate(open)} disabled={logMut.isPending} className="mt-6 w-full rounded-2xl bg-white py-3.5 text-sm font-semibold text-black disabled:opacity-60">{t("recipes.logAsMeal")}</button>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}

import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { BottomNav } from "@/components/bottom-nav";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { generateRecipe, detectIngredients } from "@/lib/ai.functions";
import { logMeal } from "@/lib/data.functions";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChefHat, Sparkles, Loader2, Clock, Users, Camera, X } from "lucide-react";
import { motion } from "framer-motion";
import { LiveCamera } from "@/components/live-camera";

export const Route = createFileRoute("/_authenticated/recipes")({
  component: RecipesPage,
  validateSearch: (s: Record<string, unknown>) => ({ scan: s.scan === "1" ? "1" : undefined }),
});

async function fetchRecipes() {
  const { data } = await supabase.from("recipes").select("*").order("created_at", { ascending: false }).limit(30);
  return data ?? [];
}

function RecipesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const nav = useNavigate();
  const search = useSearch({ from: "/_authenticated/recipes" });
  const { data: recipes = [] } = useQuery({ queryKey: ["recipes"], queryFn: fetchRecipes });
  const gen = useServerFn(generateRecipe);
  const detect = useServerFn(detectIngredients);
  const log = useServerFn(logMeal);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [manual, setManual] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<any>(null);
  const showCamera = search.scan === "1";

  const detectMut = useMutation({
    mutationFn: (url: string) => detect({ data: { imageDataUrl: url } }),
    onSuccess: (r: any) => {
      setIngredients((prev) => Array.from(new Set([...prev, ...(r?.ingredients ?? [])])));
      nav({ to: "/recipes", search: {} });
    },
    onError: (e: any) => {
      setError(e?.message || (t("recipes.scanError", { defaultValue: "Could not detect ingredients" }) as string));
      nav({ to: "/recipes", search: {} });
    },
  });


  const genMut = useMutation({
    mutationFn: () => gen({ data: { ingredients: ingredients.join(", ") } }),
    onSuccess: (r) => { setIngredients([]); setError(null); qc.invalidateQueries({ queryKey: ["recipes"] }); setOpen(r); },
    onError: () => setError(t("recipes.error")),
  });

  const logMut = useMutation({
    mutationFn: (r: any) => log({ data: {
      name: r.title, kcal: r.macros?.kcal ?? 0, protein: r.macros?.protein ?? 0,
      carbs: r.macros?.carbs ?? 0, fat: r.macros?.fat ?? 0, fiber: 0, source: "recipe",
    }}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dashboard"] }); qc.invalidateQueries({ queryKey: ["meals"] }); setOpen(null); },
  });

  return (
    <div className="min-h-screen">
      {showCamera && (
        <LiveCamera
          label={t("recipes.scanFridge", { defaultValue: "Scan ingredients" }) as string}
          onCapture={(url) => detectMut.mutate(url)}
          onClose={() => nav({ to: "/recipes", search: {} })}
          busy={detectMut.isPending}
          busyLabel={t("common.generating") as string}
        />
      )}

      <div className="mx-auto max-w-md px-5 pt-14">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold tracking-tight">{t("recipes.title")}</h1>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald text-black"><ChefHat className="h-5 w-5" /></div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{t("recipes.subtitle")}</p>

        <div className="glass-strong mt-5 rounded-[24px] p-4">
          <div className="mb-3 flex gap-2">
            <button onClick={() => nav({ to: "/recipes", search: { scan: "1" } })} disabled={detectMut.isPending} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/8 py-2.5 text-xs font-semibold disabled:opacity-60">
              {detectMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} {t("recipes.scanFridge", { defaultValue: "Scan fridge/pantry" })}
            </button>
          </div>


          <div className="mb-2 flex flex-wrap gap-1.5">
            {ingredients.map((ing, i) => (
              <motion.span key={i} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-1 rounded-full bg-emerald/15 px-3 py-1 text-xs text-emerald">
                {ing}
                <button onClick={() => setIngredients(ingredients.filter((_, x) => x !== i))}><X className="h-3 w-3" /></button>
              </motion.span>
            ))}
            {ingredients.length === 0 && (
              <span className="text-xs text-muted-foreground">{t("recipes.emptyIngs", { defaultValue: "Scan or type ingredients" })}</span>
            )}
          </div>

          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && manual.trim()) { setIngredients([...ingredients, manual.trim()]); setManual(""); } }}
            placeholder={t("recipes.addIng", { defaultValue: "+ add ingredient" }) as string}
            className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />

          <button
            disabled={ingredients.length < 1 || genMut.isPending}
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

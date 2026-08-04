import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { BottomNav } from "@/components/bottom-nav";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { generateRecipeOptions, detectIngredients } from "@/lib/ai.functions";
import { logMeal, listRecipes, toggleRecipeFavorite, setRecipeImage } from "@/lib/data.functions";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChefHat, Sparkles, Loader2, Clock, Users, Camera, X, Star, CupSoda, UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";
import { LiveCamera } from "@/components/live-camera";

export const Route = createFileRoute("/_authenticated/recipes")({
  component: RecipesPage,
  validateSearch: (s: Record<string, unknown>) => ({ scan: s.scan === "1" ? "1" : undefined }),
});

function RecipesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const nav = useNavigate();
  const search = useSearch({ from: "/_authenticated/recipes" });
  const fetchRecipes = useServerFn(listRecipes);
  const { data: recipes = [] } = useQuery({
    queryKey: ["recipes"],
    queryFn: () => fetchRecipes(),
    staleTime: 60_000,
  });
  const gen = useServerFn(generateRecipeOptions);
  const detect = useServerFn(detectIngredients);
  const log = useServerFn(logMeal);
  const favFn = useServerFn(toggleRecipeFavorite);
  const imgFn = useServerFn(setRecipeImage);

  const [ingredients, setIngredients] = useState<string[]>([]);
  const [manual, setManual] = useState("");
  const [kind, setKind] = useState<"food" | "drink">("food");
  const [onlyFav, setOnlyFav] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const showCamera = search.scan === "1";

  async function attachImage(recipe: any) {
    try {
      const res = await fetch("/api/recipe-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: recipe.title, description: recipe.description }),
      });
      if (!res.ok) return;
      const { image } = (await res.json()) as { image: string };
      setOptions((prev) => prev.map((r) => (r.id === recipe.id ? { ...r, image_url: image } : r)));
      setOpen((prev: any) => (prev && prev.id === recipe.id ? { ...prev, image_url: image } : prev));
      await imgFn({ data: { id: recipe.id, image_url: image } });
      qc.invalidateQueries({ queryKey: ["recipes"] });
    } catch {
      /* image is a bonus, never block the recipe */
    }
  }

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
    mutationFn: () => gen({ data: { ingredients: ingredients.join(", "), kind, count: 3 } }),
    onSuccess: (rows: any) => {
      const list = Array.isArray(rows) ? rows : [];
      setOptions(list);
      setError(null);
      qc.invalidateQueries({ queryKey: ["recipes"] });
      list.forEach((r) => attachImage(r));
    },
    onError: () => setError(t("recipes.error")),
  });

  const favMut = useMutation({
    mutationFn: (r: any) => favFn({ data: { id: r.id, favorite: !r.favorite } }),
    onMutate: async (r: any) => {
      const next = !r.favorite;
      setOptions((prev) => prev.map((x) => (x.id === r.id ? { ...x, favorite: next } : x)));
      setOpen((prev: any) => (prev && prev.id === r.id ? { ...prev, favorite: next } : prev));
      qc.setQueryData(["recipes"], (old: any) =>
        Array.isArray(old) ? old.map((x: any) => (x.id === r.id ? { ...x, favorite: next } : x)) : old,
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["recipes"] }),
  });

  const logMut = useMutation({
    mutationFn: (r: any) => log({ data: {
      name: r.title, kcal: r.macros?.kcal ?? 0, protein: r.macros?.protein ?? 0,
      carbs: r.macros?.carbs ?? 0, fat: r.macros?.fat ?? 0, fiber: 0, source: "recipe",
      ...(r.image_url && !String(r.image_url).startsWith("data:") ? { image_url: r.image_url } : {}),
    }}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dashboard"] }); qc.invalidateQueries({ queryKey: ["meals"] }); setOpen(null); },
  });

  const list = (recipes as any[]).filter((r) => (onlyFav ? r.favorite : true));

  return (
    <div className="min-h-screen pb-32">
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
          {/* Food / Drink */}
          <div className="mb-3 grid grid-cols-2 gap-2">
            {([["food", UtensilsCrossed, t("recipes.food", { defaultValue: "Food" })],
               ["drink", CupSoda, t("recipes.drink", { defaultValue: "Drink" })]] as const).map(([k, Icon, label]) => (
              <button
                key={k}
                onClick={() => setKind(k as "food" | "drink")}
                className={`flex items-center justify-center gap-2 rounded-2xl border py-2.5 text-xs font-semibold transition ${
                  kind === k ? "border-emerald/60 bg-emerald/10 text-emerald" : "border-white/8 text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {label as string}
              </button>
            ))}
          </div>

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
            {genMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("common.generating")}</> : <><Sparkles className="h-4 w-4" /> {t("recipes.generate3", { defaultValue: "Generate 3 options" })}</>}
          </button>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>

        {/* Generated options */}
        {options.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 text-sm font-semibold">{t("recipes.options", { defaultValue: "Choose your favorite" })}</div>
            <div className="space-y-3">
              {options.map((r) => (
                <RecipeCard key={r.id} r={r} onOpen={() => setOpen(r)} onFav={() => favMut.mutate(r)} t={t} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm font-semibold">{t("recipes.saved", { defaultValue: "Your recipes" })}</div>
          <button
            onClick={() => setOnlyFav((v) => !v)}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${onlyFav ? "bg-gold/20 text-gold" : "bg-white/8 text-muted-foreground"}`}
          >
            <Star className={`h-3.5 w-3.5 ${onlyFav ? "fill-current" : ""}`} /> {t("recipes.favorites", { defaultValue: "Favorites" })}
          </button>
        </div>

        <div className="mt-3 space-y-3">
          {list.length === 0 && (
            <div className="glass rounded-3xl p-6 text-center text-sm text-muted-foreground">{t("recipes.empty")}</div>
          )}
          {list.map((r: any) => (
            <RecipeCard key={r.id} r={r} onOpen={() => setOpen(r)} onFav={() => favMut.mutate(r)} t={t} />
          ))}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full overflow-y-auto rounded-t-[32px] bg-background p-6 pb-10">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            {open.image_url && (
              <img src={open.image_url} alt={open.title} className="mb-4 h-44 w-full rounded-3xl object-cover" />
            )}
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-2xl font-bold">{open.title}</h2>
              <button onClick={() => favMut.mutate(open)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/8">
                <Star className={`h-5 w-5 ${open.favorite ? "fill-gold text-gold" : "text-muted-foreground"}`} />
              </button>
            </div>
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

function RecipeCard({ r, onOpen, onFav, t }: { r: any; onOpen: () => void; onFav: () => void; t: any }) {
  return (
    <div className="glass relative flex items-center gap-3 overflow-hidden rounded-3xl p-3">
      <button onClick={onOpen} className="flex flex-1 items-center gap-3 text-left">
        {r.image_url ? (
          <img src={r.image_url} alt={r.title} className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
        ) : (
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white/5">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{r.title}</div>
          <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{r.description}</div>
          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.prep_minutes} {t("recipes.min")}</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.servings}</span>
            <span className="text-calorie">{Math.round(r.macros?.kcal ?? 0)} kcal</span>
          </div>
        </div>
      </button>
      <button onClick={onFav} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/8">
        <Star className={`h-4 w-4 ${r.favorite ? "fill-gold text-gold" : "text-muted-foreground"}`} />
      </button>
    </div>
  );
}

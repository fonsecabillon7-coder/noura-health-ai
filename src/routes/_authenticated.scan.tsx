import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { X, Image as ImageIcon, Sparkles, Loader2, Minus, Plus, Zap } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { analyzeFoodImage } from "@/lib/ai.functions";
import { logMeal } from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/scan")({
  component: Scan,
  validateSearch: (s: Record<string, unknown>) => ({ mode: (s.mode as string) === "ingredients" ? "ingredients" : "food" }),
});

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f); });
}

function Scan() {
  const { t } = useTranslation();
  const nav = useNavigate();
  useSearch({ from: "/_authenticated/scan" });
  const inputRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [servings, setServings] = useState(1);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIng, setNewIng] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const qc = useQueryClient();

  const analyze = useServerFn(analyzeFoodImage);
  const save = useServerFn(logMeal);

  const analyzing = useMutation({
    mutationFn: (dataUrl: string) => analyze({ data: { imageDataUrl: dataUrl } }),
    onSuccess: (r: any) => { setResult(r); setServings(1); setIngredients(r?.ingredients ?? []); },
    onError: () => setErr(t("scan.error")),
  });

  const saveMut = useMutation({
    mutationFn: () => save({ data: {
      name: result.name,
      kcal: (result.kcal ?? 0) * servings,
      protein: (result.protein ?? 0) * servings,
      carbs: (result.carbs ?? 0) * servings,
      fat: (result.fat ?? 0) * servings,
      fiber: (result.fiber ?? 0) * servings,
      source: "scan",
      image_url: preview ?? undefined,
    } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dashboard"] }); qc.invalidateQueries({ queryKey: ["meals"] }); nav({ to: "/dashboard" }); },
  });

  async function onFile(f: File | undefined) {
    if (!f) return;
    setErr(null); setResult(null); setIngredients([]);
    const dataUrl = await fileToDataUrl(f);
    setPreview(dataUrl);
    analyzing.mutate(dataUrl);
  }

  return (
    <div className="relative min-h-screen bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,oklch(0.35_0.08_45)_0%,oklch(0.1_0.02_45)_70%)]" />

      <div className="relative z-10 flex items-center justify-between px-5 pt-14">
        <button onClick={() => nav({ to: "/dashboard" })} className="grid h-10 w-10 place-items-center rounded-full bg-black/50 backdrop-blur">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-emerald" />
          <span className="text-xs font-semibold">{t("scan.title")}</span>
        </div>
        <div className="w-10" />
      </div>

      <div className="relative z-10 grid place-items-center py-12">
        <div className="relative h-72 w-72 overflow-hidden rounded-3xl border-2 border-emerald/60">
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <ImageIcon className="h-12 w-12 text-white/30" />
            </div>
          )}
          {analyzing.isPending && (
            <>
              <motion.div
                animate={{ y: [0, 280, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald to-transparent shadow-[0_0_20px_rgba(74,222,128,0.7)]"
              />
              <div className="absolute inset-0 grid place-items-center bg-black/60 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald" />
                  <span className="text-xs text-white/80">{t("scan.detecting")}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />

      {!result && (
        <div className="absolute bottom-0 inset-x-0 z-10 pb-10 pt-6">
          <div className="mx-auto flex max-w-md items-center justify-between px-8">
            <button onClick={() => inputRef.current?.click()} className="grid h-11 w-11 place-items-center rounded-full bg-white/10 backdrop-blur">
              <ImageIcon className="h-5 w-5" />
            </button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => camRef.current?.click()} className="grid h-20 w-20 place-items-center rounded-full border-4 border-white/40">
              <div className="h-14 w-14 rounded-full bg-white" />
            </motion.button>
            <div className="h-11 w-11" />
          </div>
        </div>
      )}

      {err && !result && (
        <div className="absolute inset-x-6 bottom-40 rounded-2xl bg-destructive/20 p-3 text-center text-sm text-destructive">{err}</div>
      )}

      {result && (
        <motion.div
          initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ type: "spring", damping: 24 }}
          className="absolute inset-x-0 bottom-0 z-20 max-h-[86vh] overflow-y-auto rounded-t-[32px] bg-background p-6 pb-10 shadow-premium"
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">{t("scan.detected")}</div>
              <div className="font-display text-xl font-bold">{result.name}</div>
              <div className="text-xs text-muted-foreground">{result.portion}</div>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-emerald/20 px-2.5 py-1 text-xs font-semibold text-emerald">
              <Sparkles className="h-3 w-3" /> {Math.round((result.confidence ?? 0.9) * 100)}%
            </div>
          </div>

          <div className="glass-strong mt-4 flex items-center justify-between rounded-[24px] p-5">
            <div>
              <div className="text-xs text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" /> kcal</div>
              <motion.div key={result.kcal * servings} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="font-display text-4xl font-bold">
                {Math.round(result.kcal * servings)}
              </motion.div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setServings((s) => Math.max(0.5, +(s - 0.5).toFixed(1)))} className="grid h-9 w-9 place-items-center rounded-full bg-white/10">
                <Minus className="h-4 w-4" />
              </button>
              <div className="min-w-[60px] text-center">
                <div className="font-display text-lg font-bold">{servings}×</div>
                <div className="text-[10px] text-muted-foreground">{t("scan.servings", { defaultValue: "servings" })}</div>
              </div>
              <button onClick={() => setServings((s) => +(s + 0.5).toFixed(1))} className="grid h-9 w-9 place-items-center rounded-full bg-white/10">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {[
              ["P", result.protein, "protein"],
              ["C", result.carbs, "carbs"],
              ["F", result.fat, "fat"],
              ["Fi", result.fiber, "emerald"],
            ].map(([l, v, c]) => (
              <div key={l as string} className="glass rounded-2xl p-3 text-center">
                <div className="text-[10px] text-muted-foreground">{l as string}</div>
                <div className={`font-display text-lg font-bold text-${c}`}>{Math.round(Number(v) * servings)}g</div>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="mb-2 text-sm font-semibold">{t("scan.ingredients", { defaultValue: "Detected ingredients" })}</div>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ing, i) => (
                <span key={i} className="flex items-center gap-1 rounded-full bg-white/8 px-3 py-1 text-xs">
                  {ing}
                  <button onClick={() => setIngredients(ingredients.filter((_, x) => x !== i))} className="text-white/50 hover:text-white">×</button>
                </span>
              ))}
              <input
                value={newIng}
                onChange={(e) => setNewIng(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && newIng.trim()) { setIngredients([...ingredients, newIng.trim()]); setNewIng(""); } }}
                placeholder={t("scan.addIngredient", { defaultValue: "+ add" }) as string}
                className="rounded-full bg-white/5 px-3 py-1 text-xs outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button onClick={() => { setResult(null); setPreview(null); }} className="flex-1 rounded-2xl border border-white/10 py-3.5 text-sm font-semibold">{t("scan.scanAgain")}</button>
            <button disabled={saveMut.isPending} onClick={() => saveMut.mutate()} className="flex-[1.4] rounded-2xl bg-white py-3.5 text-sm font-semibold text-black disabled:opacity-60">
              {saveMut.isPending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : t("scan.saveMeal")}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

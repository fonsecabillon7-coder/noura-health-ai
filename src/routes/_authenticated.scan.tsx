import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Minus, Plus, Zap, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { analyzeFoodImage } from "@/lib/ai.functions";
import { logMeal } from "@/lib/data.functions";
import { LiveCamera } from "@/components/live-camera";

export const Route = createFileRoute("/_authenticated/scan")({
  component: Scan,
  validateSearch: (s: Record<string, unknown>) => ({
    mode: (s.mode as string) === "ingredients" ? "ingredients" : "food",
  }),
});

function Scan() {
  const { t } = useTranslation();
  const nav = useNavigate();
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
    onSuccess: (r: any) => {
      setResult(r);
      setServings(1);
      setIngredients(r?.ingredients ?? []);
    },
    onError: (e: any) => setErr(e?.message || (t("scan.error") as string)),
  });

  const saveMut = useMutation({
    mutationFn: () =>
      save({
        data: {
          name: result.name,
          kcal: (result.kcal ?? 0) * servings,
          protein: (result.protein ?? 0) * servings,
          carbs: (result.carbs ?? 0) * servings,
          fat: (result.fat ?? 0) * servings,
          fiber: (result.fiber ?? 0) * servings,
          source: "scan",
          image_url: preview ?? undefined,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["meals"] });
      nav({ to: "/dashboard" });
    },
  });

  function onCapture(dataUrl: string) {
    setErr(null);
    setPreview(dataUrl);
    analyzing.mutate(dataUrl);
  }

  // If no result yet: show live camera fullscreen
  if (!result) {
    return (
      <>
        <LiveCamera
          label={t("scan.title") as string}
          onCapture={onCapture}
          onClose={() => nav({ to: "/dashboard" })}
          busy={analyzing.isPending}
          busyLabel={t("scan.detecting") as string}
        />
        {err && (
          <div className="fixed inset-x-6 bottom-40 z-[60] rounded-2xl bg-destructive/25 p-3 text-center text-sm text-white">
            {err}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="relative">
        {preview && <img src={preview} alt="" className="h-72 w-full object-cover opacity-70" />}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        <button
          onClick={() => {
            setResult(null);
            setPreview(null);
          }}
          className="absolute left-4 top-12 grid h-10 w-10 place-items-center rounded-full bg-black/60 backdrop-blur"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative -mt-16 rounded-t-[32px] bg-background p-6 pb-32"
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
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" /> kcal
            </div>
            <motion.div
              key={result.kcal * servings}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="font-display text-4xl font-bold"
            >
              {Math.round(result.kcal * servings)}
            </motion.div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setServings((s) => Math.max(0.5, +(s - 0.5).toFixed(1)))}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="min-w-[60px] text-center">
              <div className="font-display text-lg font-bold">{servings}×</div>
              <div className="text-[10px] text-muted-foreground">
                {t("scan.servings", { defaultValue: "servings" })}
              </div>
            </div>
            <button
              onClick={() => setServings((s) => +(s + 0.5).toFixed(1))}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10"
            >
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
              <div className={`font-display text-lg font-bold text-${c}`}>
                {Math.round(Number(v) * servings)}g
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <div className="mb-2 text-sm font-semibold">
            {t("scan.ingredients", { defaultValue: "Detected ingredients" })}
          </div>
          <div className="flex flex-wrap gap-2">
            {ingredients.map((ing, i) => (
              <span key={i} className="flex items-center gap-1 rounded-full bg-white/8 px-3 py-1 text-xs">
                {ing}
                <button
                  onClick={() => setIngredients(ingredients.filter((_, x) => x !== i))}
                  className="text-white/50 hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              value={newIng}
              onChange={(e) => setNewIng(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newIng.trim()) {
                  setIngredients([...ingredients, newIng.trim()]);
                  setNewIng("");
                }
              }}
              placeholder={t("scan.addIngredient", { defaultValue: "+ add" }) as string}
              className="rounded-full bg-white/5 px-3 py-1 text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={() => {
              setResult(null);
              setPreview(null);
            }}
            className="flex-1 rounded-2xl border border-white/10 py-3.5 text-sm font-semibold"
          >
            {t("scan.scanAgain")}
          </button>
          <button
            disabled={saveMut.isPending}
            onClick={() => saveMut.mutate()}
            className="flex-[1.4] rounded-2xl bg-white py-3.5 text-sm font-semibold text-black disabled:opacity-60"
          >
            {saveMut.isPending ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              t("scan.saveMeal")
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

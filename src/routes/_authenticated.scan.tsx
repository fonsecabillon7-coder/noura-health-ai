import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { X, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { analyzeFoodImage } from "@/lib/ai.functions";
import { logMeal } from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/scan")({ component: Scan });

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f); });
}

function Scan() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const qc = useQueryClient();

  const analyze = useServerFn(analyzeFoodImage);
  const save = useServerFn(logMeal);

  const analyzing = useMutation({
    mutationFn: (dataUrl: string) => analyze({ data: { imageDataUrl: dataUrl } }),
    onSuccess: (r) => setResult(r),
    onError: () => setErr(t("scan.error")),
  });

  const saveMut = useMutation({
    mutationFn: () => save({ data: { name: result.name, kcal: result.kcal, protein: result.protein, carbs: result.carbs, fat: result.fat, fiber: result.fiber ?? 0, source: "scan", image_url: preview ?? undefined } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dashboard"] }); qc.invalidateQueries({ queryKey: ["meals"] }); nav({ to: "/dashboard" }); },
  });

  async function onFile(f: File | undefined) {
    if (!f) return;
    setErr(null); setResult(null);
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
            <div className="absolute inset-0 grid place-items-center bg-black/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-emerald" />
                <span className="text-xs text-white/80">{t("scan.detecting")}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />

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

      {err && !result && (
        <div className="absolute inset-x-6 bottom-40 rounded-2xl bg-destructive/20 p-3 text-center text-sm text-destructive">{err}</div>
      )}

      {result && (
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ type: "spring", damping: 24 }} className="absolute inset-x-0 bottom-0 z-20 rounded-t-[32px] bg-background p-6 pb-10 shadow-premium">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">{t("scan.detected")}</div>
              <div className="font-display text-xl font-bold">{result.name}</div>
              <div className="text-xs text-muted-foreground">{result.portion}</div>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-emerald/20 px-2.5 py-1 text-xs font-semibold text-emerald">
              <Sparkles className="h-3 w-3" /> {Math.round((result.confidence ?? 0.9) * 100)}% {t("scan.confidence")}
            </div>
          </div>
          <div className="glass-strong mt-4 rounded-[24px] p-5">
            <div className="text-xs text-muted-foreground">kcal</div>
            <div className="font-display text-4xl font-bold">{Math.round(result.kcal)}</div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[["P", result.protein, "protein"], ["C", result.carbs, "carbs"], ["F", result.fat, "fat"]].map(([l, v, c]) => (
              <div key={l as string} className="glass rounded-2xl p-3">
                <div className="text-[10px] text-muted-foreground">{l as string}</div>
                <div className={`font-display text-lg font-bold text-${c}`}>{Math.round(Number(v))}g</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => { setResult(null); setPreview(null); }} className="flex-1 rounded-2xl border border-white/10 py-3.5 text-sm font-semibold">{t("scan.scanAgain")}</button>
            <button disabled={saveMut.isPending} onClick={() => saveMut.mutate()} className="flex-[1.4] rounded-2xl bg-white py-3.5 text-sm font-semibold text-black disabled:opacity-60">{t("scan.saveMeal")}</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

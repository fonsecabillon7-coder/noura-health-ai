import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { listScans } from "@/lib/data.functions";
import { BottomNav } from "@/components/bottom-nav";

export const Route = createFileRoute("/_authenticated/scans")({
  component: ScanHistory,
  head: () => ({
    meta: [
      { title: "Scan history — Neura AI" },
      { name: "description", content: "Review every food scan with date, photo, calories, macros and detected ingredients." },
      { property: "og:title", content: "Scan history — Neura AI" },
      { property: "og:description", content: "Review every food scan with date, photo, calories, macros and detected ingredients." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ScanHistory() {
  const { t, i18n } = useTranslation();
  const fetchScans = useServerFn(listScans);
  const { data, isLoading } = useQuery({ queryKey: ["scans"], queryFn: () => fetchScans() });
  const [open, setOpen] = useState<string | null>(null);

  const fmt = new Intl.DateTimeFormat(i18n.resolvedLanguage || "en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen pb-32">
      <div className="mx-auto max-w-md px-5 pt-14">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="grid h-10 w-10 place-items-center rounded-full bg-white/8">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {t("scans.title", { defaultValue: "Scan history" })}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t("scans.sub", { defaultValue: "Every analysis, saved for later" })}
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="mt-16 grid place-items-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {!isLoading && (data ?? []).length === 0 && (
          <div className="glass-strong mt-8 rounded-3xl p-8 text-center">
            <Camera className="mx-auto h-7 w-7 text-emerald" />
            <div className="mt-3 text-sm font-semibold">
              {t("scans.emptyTitle", { defaultValue: "No scans yet" })}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("scans.emptySub", { defaultValue: "Scan a meal and it will show up here." })}
            </p>
            <Link
              to="/scan"
              search={{ mode: "food" } as never}
              className="mt-5 inline-block rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black"
            >
              {t("scans.scanNow", { defaultValue: "Scan food" })}
            </Link>
          </div>
        )}

        <div className="mt-5 space-y-3">
          {(data ?? []).map((s: any, i: number) => {
            const expanded = open === s.id;
            return (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                onClick={() => setOpen(expanded ? null : s.id)}
                className="glass-strong block w-full overflow-hidden rounded-[28px] text-left"
              >
                <div className="flex items-center gap-3 p-3">
                  {s.image_url ? (
                    <img src={s.image_url} alt={s.name} className="h-16 w-16 rounded-2xl object-cover" />
                  ) : (
                    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/8">
                      <Camera className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-base font-bold">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {fmt.format(new Date(s.scanned_at))}
                      {s.portion ? ` · ${s.portion}` : ""}
                    </div>
                    <div className="mt-1 flex gap-2 text-[11px]">
                      <span className="text-calorie font-semibold">{Math.round(Number(s.kcal))} kcal</span>
                      <span className="text-protein">P {Math.round(Number(s.protein))}g</span>
                      <span className="text-carbs">C {Math.round(Number(s.carbs))}g</span>
                      <span className="text-fat">F {Math.round(Number(s.fat))}g</span>
                    </div>
                  </div>
                  {s.confidence != null && (
                    <div className="flex items-center gap-1 rounded-full bg-emerald/15 px-2 py-1 text-[10px] font-semibold text-emerald">
                      <Sparkles className="h-3 w-3" />
                      {Math.round(Number(s.confidence) * 100)}%
                    </div>
                  )}
                </div>

                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="border-t border-white/8 px-4 pb-4 pt-3"
                  >
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        ["kcal", Math.round(Number(s.kcal)), "text-calorie"],
                        ["P", `${Math.round(Number(s.protein))}g`, "text-protein"],
                        ["C", `${Math.round(Number(s.carbs))}g`, "text-carbs"],
                        ["Fi", `${Math.round(Number(s.fiber))}g`, "text-emerald"],
                      ].map(([l, v, c]) => (
                        <div key={l as string} className="rounded-2xl bg-white/5 p-2 text-center">
                          <div className="text-[10px] text-muted-foreground">{l as string}</div>
                          <div className={`font-display text-base font-bold ${c as string}`}>{v as string}</div>
                        </div>
                      ))}
                    </div>
                    {Array.isArray(s.ingredients) && s.ingredients.length > 0 && (
                      <div className="mt-3">
                        <div className="text-[11px] text-muted-foreground">
                          {t("scan.ingredients", { defaultValue: "Detected ingredients" })}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {s.ingredients.map((ing: string, x: number) => (
                            <span key={x} className="rounded-full bg-white/8 px-2.5 py-1 text-[11px]">
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {s.logged && (
                      <div className="mt-3 text-[11px] text-emerald">
                        {t("scans.logged", { defaultValue: "Added to your meal log" })}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

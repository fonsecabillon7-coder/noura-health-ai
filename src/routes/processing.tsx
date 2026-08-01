import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/processing")({
  component: Processing,
  head: () => ({
    meta: [
      { title: "Building your plan — Neura AI" },
      { name: "description", content: "Neura AI is turning your answers into a personalized nutrition and hydration plan." },
      { property: "og:title", content: "Building your plan — Neura AI" },
      { property: "og:description", content: "Neura AI is turning your answers into a personalized nutrition and hydration plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Processing() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [i, setI] = useState(0);
  const steps = [1, 2, 3, 4, 5].map((n) => t(`ob.proc.${n}`));

  useEffect(() => {
    const id = setInterval(() => setI((v) => v + 1), 900);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (i >= steps.length) {
      const to = setTimeout(() => nav({ to: "/plan" }), 500);
      return () => clearTimeout(to);
    }
  }, [i, steps.length, nav]);

  const pct = Math.min(100, Math.round((i / steps.length) * 100));

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-8">
      <motion.div
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald/20 blur-[130px]"
      />
      <div className="relative z-10 w-full max-w-sm text-center">
        <div
          className="mx-auto grid h-40 w-40 place-items-center rounded-full"
          style={{ background: `conic-gradient(var(--emerald, #34d399) ${pct * 3.6}deg, rgba(255,255,255,0.07) 0deg)` }}
        >
          <div className="grid h-32 w-32 place-items-center rounded-full bg-background">
            <div className="font-display text-3xl font-bold tabular-nums">{pct}%</div>
          </div>
        </div>

        <h1 className="mt-8 font-display text-2xl font-bold tracking-tight">{t("ob.proc.title")}</h1>

        <div className="mt-6 space-y-2.5 text-left">
          {steps.map((s, idx) => {
            const done = idx < i;
            const active = idx === i;
            return (
              <motion.div
                key={s}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: done || active ? 1 : 0.35, x: 0 }}
                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3.5"
              >
                <div
                  className={`grid h-6 w-6 place-items-center rounded-full ${
                    done ? "bg-emerald" : "bg-white/10"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5 text-black" /> : <Sparkles className="h-3 w-3" />}
                </div>
                <span className="text-sm">{s}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";

export const Route = createFileRoute("/processing")({ component: Processing });

const steps = [
  "Analyzing your goals...",
  "Building your nutrition profile...",
  "Calculating calorie needs...",
  "Estimating hydration target...",
  "Personalizing recipe recommendations...",
  "Preparing your dashboard...",
];

function Processing() {
  const [i, setI] = useState(0);
  const nav = useNavigate();

  useEffect(() => {
    if (i >= steps.length) {
      const t = setTimeout(() => nav({ to: "/auth" }), 900);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setI((v) => v + 1), 700);
    return () => clearTimeout(t);
  }, [i, nav]);

  const done = i >= steps.length;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald/15 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-6 pt-16 pb-10">
        {/* Ring */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="relative grid h-40 w-40 place-items-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(from 0deg, transparent, oklch(0.72 0.18 155) 60%, transparent)`,
                mask: "radial-gradient(circle, transparent 55%, black 56%)",
                WebkitMask: "radial-gradient(circle, transparent 55%, black 56%)",
              }}
            />
            <div className="glass-strong grid h-28 w-28 place-items-center rounded-full">
              <motion.div
                key={i}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="font-display text-3xl font-bold text-gradient-emerald"
              >
                {done ? "100" : Math.min(100, Math.round(((i + 1) / steps.length) * 100))}
                <span className="text-lg text-white/50">%</span>
              </motion.div>
            </div>
          </div>

          <div className="mt-12 w-full space-y-3">
            {steps.map((s, idx) => {
              const active = idx === i;
              const finished = idx < i;
              return (
                <motion.div
                  key={s}
                  animate={{ opacity: finished || active ? 1 : 0.35 }}
                  className="flex items-center gap-3 text-sm"
                >
                  <div className={`grid h-5 w-5 place-items-center rounded-full ${finished ? "bg-emerald text-black" : active ? "bg-white/10" : "bg-white/5"}`}>
                    {finished ? <Check className="h-3 w-3" /> : active ? <motion.div animate={{ scale: [0.6, 1, 0.6] }} transition={{ duration: 1, repeat: Infinity }} className="h-2 w-2 rounded-full bg-emerald" /> : null}
                  </div>
                  <span className={finished ? "text-white/70 line-through" : active ? "text-white font-medium" : "text-white/50"}>{s}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {done && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pb-4 text-center"
          >
            <div className="font-display text-xl font-semibold text-gradient-emerald">
              Your personalized plan is ready.
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

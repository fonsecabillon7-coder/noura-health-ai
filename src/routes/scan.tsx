import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { X, Zap, Image as ImageIcon, Barcode, HelpCircle, Sparkles } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/scan")({ component: Scan });

function Scan() {
  const nav = useNavigate();
  const [analyzed, setAnalyzed] = useState(false);
  return (
    <div className="relative min-h-screen bg-black">
      {/* Camera preview */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,oklch(0.35_0.08_45)_0%,oklch(0.1_0.02_45)_70%)]" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-14">
        <button onClick={() => nav({ to: "/dashboard" })} className="grid h-10 w-10 place-items-center rounded-full bg-black/50 backdrop-blur">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-emerald" />
          <span className="text-xs font-semibold">Cal AI</span>
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-full bg-black/50 backdrop-blur">
          <HelpCircle className="h-5 w-5" />
        </button>
      </div>

      {/* Scan frame */}
      <div className="relative z-10 grid place-items-center py-12">
        <div className="relative h-64 w-64">
          <div className="absolute inset-0 rounded-3xl border-2 border-emerald/60" />
          <div className="absolute -left-1 -top-1 h-6 w-6 rounded-tl-xl border-l-[3px] border-t-[3px] border-emerald" />
          <div className="absolute -right-1 -top-1 h-6 w-6 rounded-tr-xl border-r-[3px] border-t-[3px] border-emerald" />
          <div className="absolute -bottom-1 -left-1 h-6 w-6 rounded-bl-xl border-b-[3px] border-l-[3px] border-emerald" />
          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-br-xl border-b-[3px] border-r-[3px] border-emerald" />
          <motion.div
            animate={{ top: ["10%", "90%", "10%"] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-x-4 h-[2px] bg-gradient-to-r from-transparent via-emerald to-transparent"
            style={{ boxShadow: "0 0 16px oklch(0.72 0.18 155)" }}
          />
        </div>
      </div>

      {/* Mode tabs */}
      <div className="relative z-10 mx-5 mt-4">
        <div className="glass-strong flex items-center gap-1 rounded-2xl p-1">
          {["Scan Food", "Barcode", "Food Label"].map((m, i) => (
            <button key={m} className={`flex-1 rounded-xl py-2.5 text-xs font-semibold ${i === 0 ? "bg-white text-black" : "text-white/70"}`}>{m}</button>
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 inset-x-0 z-10 pb-10 pt-6">
        <div className="mx-auto flex max-w-md items-center justify-between px-8">
          <button className="grid h-11 w-11 place-items-center rounded-full bg-white/10 backdrop-blur">
            <Zap className="h-5 w-5" />
          </button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setAnalyzed(true)}
            className="grid h-20 w-20 place-items-center rounded-full border-4 border-white/40"
          >
            <div className="h-14 w-14 rounded-full bg-white" />
          </motion.button>
          <button className="grid h-11 w-11 place-items-center rounded-full bg-white/10 backdrop-blur">
            <ImageIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Result sheet */}
      {analyzed && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ type: "spring", damping: 24 }}
          className="absolute inset-x-0 bottom-0 z-20 rounded-t-[32px] bg-background p-6 pb-10 shadow-premium"
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Detected</div>
              <div className="font-display text-xl font-bold">Caesar Salad</div>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-emerald/20 px-2.5 py-1 text-xs font-semibold text-emerald">
              <Sparkles className="h-3 w-3" /> 96% match
            </div>
          </div>
          <div className="glass-strong mt-4 rounded-[24px] p-5">
            <div className="text-xs text-muted-foreground">Calories</div>
            <div className="font-display text-4xl font-bold">330</div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[["Protein", "8g", "protein"], ["Carbs", "20g", "carbs"], ["Fat", "18g", "fat"]].map(([l, v, c]) => (
              <div key={l} className="glass rounded-2xl p-3">
                <div className="text-[10px] text-muted-foreground">{l}</div>
                <div className={`font-display text-lg font-bold text-${c}`}>{v}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setAnalyzed(false)} className="flex-1 rounded-2xl border border-white/10 py-3.5 text-sm font-semibold">Scan Again</button>
            <button onClick={() => nav({ to: "/dashboard" })} className="flex-[1.4] rounded-2xl bg-white py-3.5 text-sm font-semibold text-black">Save Meal</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

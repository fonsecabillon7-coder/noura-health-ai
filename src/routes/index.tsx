import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Camera, Flame, ChefHat, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LangSwitcher } from "@/components/lang-switcher";

export const Route = createFileRoute("/")({
  component: Welcome,
  head: () => ({
    meta: [
      { title: "Neura AI — Eat Smarter. Live Better." },
      { name: "description", content: "AI nutrition assistant. Track meals, hydration, and generate recipes from your fridge." },
    ],
  }),
});

const scenes = [
  {
    key: "scan",
    label: "AI Food Scan",
    icon: Camera,
    accent: "oklch(0.75 0.17 55)",
  },
  {
    key: "recipe",
    label: "Recipe Generator",
    icon: ChefHat,
    accent: "oklch(0.72 0.18 155)",
  },
];

function Welcome() {
  const { t } = useTranslation();
  const [scene, setScene] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setScene((s) => (s + 1) % scenes.length), 5200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[380px] w-[380px] rounded-full bg-hydration/15 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-6 pt-14 pb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-emerald to-emerald/60 shadow-emerald-glow">
              <Sparkles className="h-4 w-4 text-black" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Neura AI</span>
          </div>
          <LangSwitcher />
        </div>

        {/* Phone mockup */}
        <div className="mt-8 flex flex-1 items-center justify-center">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <PhoneMockup>
              <AnimatePresence mode="wait">
                {scene === 0 ? (
                  <ScanScene key="scan" />
                ) : (
                  <RecipeScene key="recipe" />
                )}
              </AnimatePresence>
            </PhoneMockup>
            {/* Reflection */}
            <div className="mx-auto mt-2 h-6 w-40 rounded-[100%] bg-emerald/20 blur-2xl" />
          </motion.div>
        </div>

        {/* Copy */}
        <div className="mt-2 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gradient-premium font-display text-4xl font-bold leading-tight tracking-tight"
          >
            {t("landing.tagline1")}
            <br />
            {t("landing.tagline2")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-muted-foreground"
          >
            {t("landing.subtitle")}
          </motion.p>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Link to="/auth" className="block">
            <motion.div
              whileTap={{ scale: 0.97 }}
              animate={{ scale: [1, 1.015, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="relative overflow-hidden rounded-[28px] bg-white py-5 text-center text-[17px] font-semibold text-black shadow-premium"
            >
              <span className="relative z-10">{t("common.getStarted")}</span>
              <div className="animate-shimmer absolute inset-0 opacity-40" />
            </motion.div>
          </Link>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {t("landing.footer")}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-[440px] w-[220px] rounded-[44px] border border-white/10 bg-gradient-to-b from-neutral-800 to-black p-2 shadow-premium">
      <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-black">
        {/* Notch */}
        <div className="absolute left-1/2 top-2 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
        {children}
      </div>
    </div>
  );
}

function ScanScene() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative flex h-full w-full flex-col bg-gradient-to-b from-neutral-900 via-black to-neutral-900"
    >
      {/* Camera viewfinder */}
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,oklch(0.4_0.08_45)_0%,oklch(0.15_0.02_45)_60%)]" />
        {/* Meal circle */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-orange-400 via-red-500 to-yellow-600 shadow-2xl"
        />
        {/* Scanning frame */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-emerald/70"
        >
          <div className="absolute -left-1 -top-1 h-4 w-4 rounded-tl-lg border-l-2 border-t-2 border-emerald" />
          <div className="absolute -right-1 -top-1 h-4 w-4 rounded-tr-lg border-r-2 border-t-2 border-emerald" />
          <div className="absolute -bottom-1 -left-1 h-4 w-4 rounded-bl-lg border-b-2 border-l-2 border-emerald" />
          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-br-lg border-b-2 border-r-2 border-emerald" />
        </motion.div>
        {/* Scan line */}
        <motion.div
          initial={{ top: "30%" }}
          animate={{ top: "70%" }}
          transition={{ duration: 1.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          className="absolute left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-emerald to-transparent shadow-[0_0_12px_theme(colors.emerald)]"
        />
      </div>

      {/* Result card */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9, type: "spring", damping: 20 }}
        className="glass-strong m-2 rounded-2xl p-3"
      >
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-medium text-white">Grilled Salmon</div>
          <div className="flex items-center gap-1 rounded-full bg-emerald/20 px-1.5 py-0.5 text-[8px] font-semibold text-emerald">
            <Sparkles className="h-2 w-2" /> 98%
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="font-display text-2xl font-bold text-white">550</span>
          <span className="text-[10px] text-white/60">kcal</span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <MacroPill color="protein" label="P" val="35g" />
          <MacroPill color="carbs" label="C" val="40g" />
          <MacroPill color="fat" label="F" val="28g" />
        </div>
      </motion.div>
    </motion.div>
  );
}

function MacroPill({ color, label, val }: { color: string; label: string; val: string }) {
  const bg = { protein: "bg-protein/20 text-protein", carbs: "bg-carbs/20 text-carbs", fat: "bg-fat/20 text-fat" }[color as "protein" | "carbs" | "fat"];
  return (
    <div className={`rounded-lg ${bg} px-1.5 py-1 text-center`}>
      <div className="text-[8px] font-semibold opacity-70">{label}</div>
      <div className="text-[10px] font-bold">{val}</div>
    </div>
  );
}

function RecipeScene() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative flex h-full w-full flex-col bg-gradient-to-b from-neutral-900 to-black"
    >
      <div className="px-3 pt-8 pb-2">
        <div className="text-[10px] text-white/50">AI Recipe Generator</div>
        <div className="text-[13px] font-semibold text-white">From your fridge</div>
      </div>
      {/* Ingredient chips */}
      <div className="flex flex-wrap gap-1 px-3">
        {["Chicken", "Rice", "Spinach", "Eggs", "Tomato"].map((ing, i) => (
          <motion.div
            key={ing}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-medium text-white"
          >
            {ing}
          </motion.div>
        ))}
      </div>

      {/* Recipe cards */}
      <div className="mt-3 flex-1 space-y-2 px-2 pb-2">
        {[
          { name: "Herb Chicken Bowl", time: "22m", kcal: 480, color: "from-emerald/40 to-emerald/10" },
          { name: "Spinach Rice Skillet", time: "18m", kcal: 390, color: "from-orange-500/40 to-orange-500/10" },
        ].map((r, i) => (
          <motion.div
            key={r.name}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.2 }}
            className="glass rounded-2xl p-2"
          >
            <div className={`h-14 rounded-xl bg-gradient-to-br ${r.color}`} />
            <div className="mt-1.5 flex items-start justify-between">
              <div>
                <div className="text-[10px] font-semibold text-white">{r.name}</div>
                <div className="text-[8px] text-white/50">{r.time} · {r.kcal} kcal</div>
              </div>
              <Flame className="h-3 w-3 text-calorie" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

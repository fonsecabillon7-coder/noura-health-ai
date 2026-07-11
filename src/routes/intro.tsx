import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Heart, Droplets, ChefHat, Camera, ShoppingCart, BarChart3, Bot, Salad } from "lucide-react";
import { LangSwitcher } from "@/components/lang-switcher";

export const Route = createFileRoute("/intro")({
  component: Intro,
});

const slides = [
  {
    title: "Your health deserves better.",
    desc: "Small daily decisions create lifelong results.",
    Illustration: HeartIllustration,
  },
  {
    title: "Nutrition doesn't have to be confusing.",
    desc: "Snap a photo. AI reveals the full breakdown instantly.",
    Illustration: ScanIllustration,
  },
  {
    title: "Hydration matters more than you think.",
    desc: "Stay effortlessly on track, every single day.",
    Illustration: WaterIllustration,
  },
  {
    title: "Cook amazing meals with what you already have.",
    desc: "Point at your fridge. Get recipes you'll actually love.",
    Illustration: FridgeIllustration,
  },
  {
    title: "Everything in one place.",
    desc: "One elegant assistant. Your entire nutrition life.",
    Illustration: HubIllustration,
  },
];

function Intro() {
  const [i, setI] = useState(0);
  const nav = useNavigate();

  const next = () => {
    if (i < slides.length - 1) setI(i + 1);
    else nav({ to: "/quiz" });
  };

  const Slide = slides[i];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute right-5 top-14 z-20"><LangSwitcher /></div>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 right-0 h-[400px] w-[400px] rounded-full bg-emerald/15 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-6 pt-14 pb-10">
        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-all ${
                idx <= i ? "bg-emerald" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        <div className="mt-14 flex flex-1 flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center"
            >
              <div className="mb-10">
                <Slide.Illustration />
              </div>
              <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight">
                {Slide.title}
              </h1>
              <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-muted-foreground">
                {Slide.desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={next}
          className="mt-8 w-full rounded-[28px] bg-white py-5 text-[17px] font-semibold text-black shadow-premium"
        >
          Continue
        </motion.button>
      </div>
    </div>
  );
}

/* ---------- Illustrations ---------- */

function IllustrationFrame({ children, ring = "emerald" }: { children: React.ReactNode; ring?: string }) {
  const ringColor = ring === "hydration" ? "oklch(0.72 0.15 235 / 0.3)" : "oklch(0.72 0.18 155 / 0.3)";
  return (
    <div className="relative grid h-56 w-56 place-items-center">
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle, ${ringColor}, transparent 70%)` }}
      />
      <div className="glass-strong relative grid h-40 w-40 place-items-center rounded-[40px] shadow-premium">
        {children}
      </div>
    </div>
  );
}

function HeartIllustration() {
  return (
    <IllustrationFrame>
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Heart className="h-20 w-20 fill-emerald text-emerald" />
      </motion.div>
    </IllustrationFrame>
  );
}

function ScanIllustration() {
  return (
    <IllustrationFrame>
      <div className="relative grid h-28 w-28 place-items-center rounded-3xl bg-gradient-to-br from-orange-500 to-red-500">
        <Salad className="h-12 w-12 text-white" />
        <motion.div
          initial={{ top: "10%" }}
          animate={{ top: "90%" }}
          transition={{ duration: 1.6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          className="absolute left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-emerald to-transparent"
          style={{ boxShadow: "0 0 12px oklch(0.72 0.18 155)" }}
        />
      </div>
    </IllustrationFrame>
  );
}

function WaterIllustration() {
  return (
    <IllustrationFrame ring="hydration">
      <div className="relative h-28 w-16 overflow-hidden rounded-[28px] border-2 border-hydration/40 bg-hydration/10">
        <motion.div
          initial={{ height: "20%" }}
          animate={{ height: ["20%", "75%", "20%"] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-hydration to-hydration/60"
        />
        <Droplets className="absolute left-1/2 top-2 h-4 w-4 -translate-x-1/2 text-hydration" />
      </div>
    </IllustrationFrame>
  );
}

function FridgeIllustration() {
  return (
    <IllustrationFrame>
      <div className="grid h-28 w-24 grid-rows-[1fr_1fr] gap-1 rounded-2xl border-2 border-white/20 bg-white/5 p-1.5">
        <div className="rounded-lg bg-gradient-to-br from-emerald/30 to-emerald/10" />
        <div className="rounded-lg bg-gradient-to-br from-orange-500/30 to-orange-500/10" />
      </div>
      <motion.div
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute -bottom-2 right-2"
      >
        <ChefHat className="h-6 w-6 text-emerald" />
      </motion.div>
    </IllustrationFrame>
  );
}

function HubIllustration() {
  const icons = [Camera, Salad, Droplets, ShoppingCart, BarChart3, Bot];
  return (
    <IllustrationFrame>
      <div className="grid grid-cols-3 gap-2">
        {icons.map((Icon, idx) => (
          <motion.div
            key={idx}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: idx * 0.08, type: "spring" }}
            className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10"
          >
            <Icon className="h-4 w-4 text-white" />
          </motion.div>
        ))}
      </div>
    </IllustrationFrame>
  );
}

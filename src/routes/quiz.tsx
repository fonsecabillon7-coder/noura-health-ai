import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import {
  TrendingDown, TrendingUp, Minus, Salad, Sparkles,
  Armchair, Footprints, Bike, Dumbbell, Trophy,
  Check, ChevronLeft, Droplets,
} from "lucide-react";
import { patchOnboarding } from "@/lib/noura";

export const Route = createFileRoute("/quiz")({ component: Quiz });

const goals = [
  { id: "lose", label: "Lose Weight", desc: "Cut fat sustainably", Icon: TrendingDown },
  { id: "gain", label: "Gain Muscle", desc: "Build lean strength", Icon: TrendingUp },
  { id: "maintain", label: "Maintain Weight", desc: "Stay right where you are", Icon: Minus },
  { id: "healthier", label: "Eat Healthier", desc: "Better food, better mood", Icon: Salad },
  { id: "habits", label: "Build Better Habits", desc: "Consistency compounds", Icon: Sparkles },
];

const activities = [
  { id: "sedentary", label: "Mostly sedentary", desc: "Desk work, little movement", Icon: Armchair },
  { id: "light", label: "Lightly active", desc: "1–2 workouts / week", Icon: Footprints },
  { id: "moderate", label: "Moderately active", desc: "3–4 workouts / week", Icon: Bike },
  { id: "very", label: "Very active", desc: "5–6 workouts / week", Icon: Dumbbell },
  { id: "athlete", label: "Athlete", desc: "Daily training", Icon: Trophy },
];

const diets = ["No preference","Vegetarian","Vegan","Keto","Mediterranean","High Protein","Low Carb","Gluten Free","Dairy Free"];
const allergens = ["Peanuts","Eggs","Milk","Soy","Seafood","Tree Nuts","Wheat","Sesame"];
const equipment = ["Air Fryer","Oven","Stove Top","Microwave","Blender","Pressure Cooker","Rice Cooker","Grill","Slow Cooker"];
const cookTimes = ["Under 10 minutes","10–20 minutes","20–40 minutes","40–60 minutes","No preference"];
const motivations = ["Feel healthier","Have more energy","Improve confidence","Athletic performance","Medical recommendation","Build consistent habits"];

const TOTAL = 12;

function Quiz() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, any>>({});
  const nav = useNavigate();

  const set = (k: string, v: any) => setData((d) => ({ ...d, [k]: v }));
  const toggle = (k: string, v: string) =>
    setData((d) => {
      const arr: string[] = d[k] || [];
      return { ...d, [k]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
    });

  const canNext = useMemo(() => {
    switch (step) {
      case 0: return !!data.goal;
      case 1: return !!data.activity;
      case 2: return !!data.age;
      case 3: return !!data.heightCm;
      case 4: return !!data.weightKg;
      case 5: return data.goal === "maintain" || data.goal === "healthier" || data.goal === "habits" || !!data.targetWeightKg;
      case 6: return (data.diets || []).length > 0;
      case 7: return true;
      case 8: return (data.equipment || []).length > 0;
      case 9: return !!data.cookTime;
      case 10: return !!data.water;
      case 11: return !!data.motivation;
      default: return true;
    }
  }, [step, data]);

  const next = () => {
    patchOnboarding(data);
    if (step < TOTAL - 1) setStep(step + 1);
    else nav({ to: "/processing" });
  };
  const back = () => (step === 0 ? nav({ to: "/intro" }) : setStep(step - 1));

  return (
    <div className="relative min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-12 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={back} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 active:bg-white/10">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
            <motion.div
              animate={{ width: `${((step + 1) / TOTAL) * 100}%` }}
              transition={{ type: "spring", damping: 20 }}
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald to-emerald/70"
            />
          </div>
          <div className="w-10 text-right text-xs text-muted-foreground">
            {step + 1}/{TOTAL}
          </div>
        </div>

        {/* Body */}
        <div className="mt-8 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 && <StepChoice title="What's your primary goal?" subtitle="We'll tailor everything around this." options={goals} value={data.goal} onSelect={(v) => set("goal", v)} />}
              {step === 1 && <StepChoice title="How active are you day to day?" subtitle="Be honest — we adjust your calories automatically." options={activities} value={data.activity} onSelect={(v) => set("activity", v)} />}
              {step === 2 && <WheelStep title="How old are you?" subtitle="Used to estimate your metabolic rate." min={13} max={90} defaultVal={28} unit="years" onChange={(v) => set("age", v)} />}
              {step === 3 && <WheelStep title="How tall are you?" subtitle="Metric or Imperial — your call." min={140} max={220} defaultVal={172} unit="cm" onChange={(v) => set("heightCm", v)} />}
              {step === 4 && <WeightStep title="What's your current weight?" heightCm={data.heightCm || 172} onChange={(v) => set("weightKg", v)} />}
              {step === 5 && (
                (data.goal === "maintain" || data.goal === "healthier" || data.goal === "habits")
                  ? <SkipStep title="You're set." subtitle="Since you're not targeting a specific weight, we'll optimize for balance and long-term consistency." />
                  : <TargetStep title="What's your target?" current={data.weightKg || 70} goal={data.goal as "lose" | "gain"} onChange={(v) => set("targetWeightKg", v)} />
              )}
              {step === 6 && <MultiStep title="Dietary preferences" subtitle="Pick anything that applies." options={diets} selected={data.diets || []} onToggle={(v) => toggle("diets", v)} />}
              {step === 7 && <MultiStep title="Any allergies?" subtitle="We'll never suggest these." options={allergens} selected={data.allergies || []} onToggle={(v) => toggle("allergies", v)} allowEmpty />}
              {step === 8 && <MultiStep title="What's in your kitchen?" subtitle="We tailor recipes to what you own." options={equipment} selected={data.equipment || []} onToggle={(v) => toggle("equipment", v)} />}
              {step === 9 && <SingleStep title="How long do you like to cook?" options={cookTimes} value={data.cookTime} onSelect={(v) => set("cookTime", v)} />}
              {step === 10 && <WaterStep title="Daily water intake" subtitle="A rough estimate is perfect." value={data.water || 6} onChange={(v) => set("water", v)} />}
              {step === 11 && <SingleStep title="Why does this matter to you?" subtitle="We'll personalize your encouragement." options={motivations} value={data.motivation} onSelect={(v) => set("motivation", v)} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.button
          whileTap={{ scale: canNext ? 0.97 : 1 }}
          disabled={!canNext}
          onClick={next}
          className={`mt-6 w-full rounded-[28px] py-5 text-[17px] font-semibold transition-all ${
            canNext
              ? "bg-white text-black shadow-premium"
              : "bg-white/8 text-white/30"
          }`}
        >
          {step === TOTAL - 1 ? "Finish" : "Continue"}
        </motion.button>
      </div>
    </div>
  );
}

/* ------ Step components ------ */

function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

interface OptWithIcon { id: string; label: string; desc: string; Icon: React.ComponentType<{ className?: string }> }
function StepChoice({ title, subtitle, options, value, onSelect }: { title: string; subtitle?: string; options: OptWithIcon[]; value?: string; onSelect: (v: string) => void }) {
  return (
    <div>
      <StepHeader title={title} subtitle={subtitle} />
      <div className="space-y-3">
        {options.map((o) => {
          const active = value === o.id;
          return (
            <motion.button
              key={o.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(o.id)}
              className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                active
                  ? "border-emerald/60 bg-emerald/10 shadow-emerald-glow"
                  : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
            >
              <div className={`grid h-11 w-11 place-items-center rounded-xl ${active ? "bg-emerald text-black" : "bg-white/8 text-white"}`}>
                <o.Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{o.label}</div>
                <div className="text-xs text-muted-foreground">{o.desc}</div>
              </div>
              {active && <Check className="h-5 w-5 text-emerald" />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function WheelStep({ title, subtitle, min, max, defaultVal, unit, onChange }: { title: string; subtitle?: string; min: number; max: number; defaultVal: number; unit: string; onChange: (v: number) => void }) {
  const [val, setVal] = useState(defaultVal);
  return (
    <div>
      <StepHeader title={title} subtitle={subtitle} />
      <div className="glass rounded-3xl p-8">
        <div className="text-center">
          <div className="font-display text-7xl font-bold tracking-tight">{val}</div>
          <div className="mt-1 text-sm text-muted-foreground">{unit}</div>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={val}
          onChange={(e) => { const v = +e.target.value; setVal(v); onChange(v); }}
          className="mt-6 w-full accent-emerald"
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{min}</span><span>{max}</span>
        </div>
      </div>
    </div>
  );
}

function WeightStep({ title, heightCm, onChange }: { title: string; heightCm: number; onChange: (v: number) => void }) {
  const [val, setVal] = useState(72);
  const bmi = (val / Math.pow(heightCm / 100, 2)).toFixed(1);
  const bmiLabel = +bmi < 18.5 ? "Under" : +bmi < 25 ? "Healthy" : +bmi < 30 ? "Above" : "High";
  const bmiColor = +bmi < 18.5 ? "text-hydration" : +bmi < 25 ? "text-emerald" : +bmi < 30 ? "text-calorie" : "text-destructive";
  return (
    <div>
      <StepHeader title={title} />
      <div className="glass rounded-3xl p-8">
        <div className="text-center">
          <div className="font-display text-7xl font-bold tracking-tight">{val}</div>
          <div className="mt-1 text-sm text-muted-foreground">kg</div>
        </div>
        <input type="range" min={35} max={200} value={val} onChange={(e) => { const v = +e.target.value; setVal(v); onChange(v); }} className="mt-6 w-full accent-emerald" />
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">Estimated BMI</span>
          <span className={`text-sm font-semibold ${bmiColor}`}>{bmi} · {bmiLabel}</span>
        </div>
      </div>
    </div>
  );
}

function TargetStep({ title, current, goal, onChange }: { title: string; current: number; goal: "lose" | "gain"; onChange: (v: number) => void }) {
  const initial = goal === "lose" ? Math.max(40, current - 6) : current + 6;
  const [val, setVal] = useState(initial);
  const diff = Math.abs(val - current);
  const weeks = Math.ceil(diff / 0.5);
  return (
    <div>
      <StepHeader title={title} subtitle={`You'll get there at a healthy, sustainable pace.`} />
      <div className="glass rounded-3xl p-8">
        <div className="text-center">
          <div className="font-display text-7xl font-bold tracking-tight">{val}</div>
          <div className="mt-1 text-sm text-muted-foreground">kg target</div>
        </div>
        <input type="range" min={35} max={200} value={val} onChange={(e) => { const v = +e.target.value; setVal(v); onChange(v); }} className="mt-6 w-full accent-emerald" />
        <div className="mt-4 flex items-center justify-center gap-2 rounded-full bg-emerald/10 px-3 py-1.5 text-emerald">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">~{weeks} weeks at a healthy pace</span>
        </div>
      </div>
    </div>
  );
}

function MultiStep({ title, subtitle, options, selected, onToggle, allowEmpty }: { title: string; subtitle?: string; options: string[]; selected: string[]; onToggle: (v: string) => void; allowEmpty?: boolean }) {
  return (
    <div>
      <StepHeader title={title} subtitle={subtitle} />
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = selected.includes(o);
          return (
            <motion.button
              key={o}
              whileTap={{ scale: 0.95 }}
              onClick={() => onToggle(o)}
              className={`rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${
                active
                  ? "border-emerald/60 bg-emerald/15 text-emerald"
                  : "border-white/8 bg-white/[0.03] text-white/80"
              }`}
            >
              {o}
            </motion.button>
          );
        })}
      </div>
      {allowEmpty && selected.length === 0 && (
        <p className="mt-4 text-xs text-muted-foreground">No allergies? You can skip this.</p>
      )}
    </div>
  );
}

function SingleStep({ title, subtitle, options, value, onSelect }: { title: string; subtitle?: string; options: string[]; value?: string; onSelect: (v: string) => void }) {
  return (
    <div>
      <StepHeader title={title} subtitle={subtitle} />
      <div className="space-y-2.5">
        {options.map((o) => {
          const active = value === o;
          return (
            <motion.button
              key={o}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(o)}
              className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all ${
                active
                  ? "border-emerald/60 bg-emerald/10"
                  : "border-white/8 bg-white/[0.03]"
              }`}
            >
              <span className="font-medium">{o}</span>
              {active && <Check className="h-5 w-5 text-emerald" />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function WaterStep({ title, subtitle, value, onChange }: { title: string; subtitle?: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <StepHeader title={title} subtitle={subtitle} />
      <div className="glass rounded-3xl p-8">
        <div className="mx-auto grid h-52 w-28 place-items-end overflow-hidden rounded-[32px] border-2 border-hydration/40 bg-hydration/5">
          <motion.div
            animate={{ height: `${Math.min(100, (value / 12) * 100)}%` }}
            transition={{ type: "spring", damping: 22 }}
            className="w-full bg-gradient-to-t from-hydration to-hydration/60"
          />
        </div>
        <div className="mt-6 text-center">
          <div className="font-display text-5xl font-bold">{value}</div>
          <div className="mt-1 text-sm text-muted-foreground">glasses / day</div>
        </div>
        <input type="range" min={1} max={14} value={value} onChange={(e) => onChange(+e.target.value)} className="mt-4 w-full" style={{ accentColor: "oklch(0.72 0.15 235)" }} />
        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-hydration">
          <Droplets className="h-3.5 w-3.5" />
          <span>~{(value * 0.25).toFixed(1)} L</span>
        </div>
      </div>
    </div>
  );
}

function SkipStep({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <StepHeader title={title} subtitle={subtitle} />
      <div className="glass grid place-items-center rounded-3xl p-12">
        <Sparkles className="h-16 w-16 text-emerald" />
      </div>
    </div>
  );
}

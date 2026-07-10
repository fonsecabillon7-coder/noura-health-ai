import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Flame, Droplets, Beef, Wheat, Nut, Sparkles, Plus } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

const days = [
  { d: "Sun", n: 10, done: 0.4 },
  { d: "Mon", n: 11, done: 0.9 },
  { d: "Tue", n: 12, done: 1.0 },
  { d: "Wed", n: 13, done: 0.5, active: true },
  { d: "Thu", n: 14, done: 0 },
  { d: "Fri", n: 15, done: 0 },
  { d: "Sat", n: 16, done: 0 },
];

function Dashboard() {
  const [water, setWater] = useState(4);
  const waterGoal = 8;
  const kcal = 1250, kcalGoal = 2500;

  return (
    <div className="relative min-h-screen pb-4">
      <div className="mx-auto max-w-md px-5 pt-14">
        {/* Greeting */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Wednesday, Jul 10</div>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
              Good morning, <span className="text-gradient-emerald">Sarah</span>
            </h1>
          </div>
          <div className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5">
            <Flame className="h-4 w-4 text-calorie" />
            <span className="text-sm font-semibold">15</span>
          </div>
        </div>

        {/* Week strip */}
        <div className="mt-6 flex items-center justify-between gap-1">
          {days.map((day) => (
            <button
              key={day.n}
              className={`flex flex-col items-center gap-1.5 rounded-2xl px-2 py-2 ${day.active ? "glass" : ""}`}
            >
              <span className={`text-[11px] ${day.active ? "text-white font-semibold" : "text-white/40"}`}>{day.d}</span>
              <div className="relative grid h-9 w-9 place-items-center">
                <svg className="absolute inset-0" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="2.5" />
                  {day.done > 0 && (
                    <circle
                      cx="18" cy="18" r="15" fill="none"
                      stroke={day.done >= 1 ? "oklch(0.72 0.18 155)" : "oklch(0.75 0.17 55)"}
                      strokeWidth="2.5" strokeLinecap="round"
                      strokeDasharray={`${day.done * 94.2} 94.2`}
                      transform="rotate(-90 18 18)"
                    />
                  )}
                </svg>
                <span className={`text-xs font-semibold ${day.active ? "text-white" : "text-white/60"}`}>{day.n}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Calorie ring */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong mt-6 flex items-center justify-between rounded-[28px] p-5 shadow-premium"
        >
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-5xl font-bold tracking-tight">{kcal}</span>
              <span className="text-lg text-muted-foreground">/{kcalGoal}</span>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Calories eaten</div>
          </div>
          <ProgressRing size={92} progress={kcal / kcalGoal} color="oklch(0.75 0.17 55)">
            <Flame className="h-7 w-7 text-calorie" />
          </ProgressRing>
        </motion.div>

        {/* Macros */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <MacroCard label="Protein" value={75} goal={150} unit="g" color="oklch(0.68 0.20 25)" Icon={Beef} />
          <MacroCard label="Carbs" value={138} goal={275} unit="g" color="oklch(0.78 0.15 75)" Icon={Wheat} />
          <MacroCard label="Fat" value={35} goal={70} unit="g" color="oklch(0.7 0.15 235)" Icon={Nut} />
        </div>

        {/* Hydration */}
        <div className="glass-strong mt-4 rounded-[28px] p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-hydration" />
                <span className="text-sm font-semibold">Hydration</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold">{water}</span>
                <span className="text-sm text-muted-foreground">/ {waterGoal} glasses</span>
              </div>
              <div className="text-xs text-hydration">{Math.round((water / waterGoal) * 100)}% complete</div>
            </div>
            <div className="relative h-24 w-14 overflow-hidden rounded-[20px] border-2 border-hydration/40 bg-hydration/5">
              <motion.div
                animate={{ height: `${(water / waterGoal) * 100}%` }}
                transition={{ type: "spring", damping: 22 }}
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-hydration to-hydration/60"
              />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((n) => (
              <motion.button
                key={n}
                whileTap={{ scale: 0.94 }}
                onClick={() => setWater((w) => Math.min(waterGoal, w + n * 0.5))}
                className="flex flex-col items-center gap-1 rounded-2xl bg-white/5 py-2 active:bg-white/10"
              >
                <Droplets className="h-4 w-4 text-hydration" />
                <span className="text-[10px] font-semibold">+{n * 125}ml</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Recently uploaded */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Recently uploaded</h2>
            <button className="text-xs text-muted-foreground">See all</button>
          </div>
          <div className="mt-3 space-y-3">
            <MealCard title="Grilled Salmon" time="12:37 PM" kcal={550} p={35} c={40} f={28} tint="from-orange-500/40 to-red-600/20" />
            <MealCard title="Caesar Salad" time="9:40 AM" kcal={330} p={8} c={20} f={18} tint="from-emerald/40 to-emerald/10" />
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function ProgressRing({ size, progress, color, children }: { size: number; progress: number; color: string; children: React.ReactNode }) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="6" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${progress * c} ${c}` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute">{children}</div>
    </div>
  );
}

function MacroCard({ label, value, goal, unit, color, Icon }: { label: string; value: number; goal: number; unit: string; color: string; Icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="glass-strong rounded-3xl p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-0.5">
        <span className="font-display text-2xl font-bold">{value}</span>
        <span className="text-[10px] text-muted-foreground">/{goal}{unit}</span>
      </div>
      <div className="mt-3 flex justify-center">
        <ProgressRing size={62} progress={value / goal} color={color}>
          <Icon className="h-4 w-4" style={{ color }} />
        </ProgressRing>
      </div>
    </div>
  );
}

function MealCard({ title, time, kcal, p, c, f, tint }: { title: string; time: string; kcal: number; p: number; c: number; f: number; tint: string }) {
  return (
    <motion.div
      whileTap={{ scale: 0.99 }}
      className="glass flex items-center gap-3 rounded-3xl p-3"
    >
      <div className={`grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${tint}`}>
        <Sparkles className="h-6 w-6 text-white/60" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="truncate font-semibold">{title}</h3>
          <span className="text-[11px] text-muted-foreground">{time}</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-calorie" />
          <span className="text-sm font-semibold">{kcal}</span>
          <span className="text-xs text-muted-foreground">kcal</span>
        </div>
        <div className="mt-1.5 flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-protein" />{p}g</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-carbs" />{c}g</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-fat" />{f}g</span>
        </div>
      </div>
    </motion.div>
  );
}

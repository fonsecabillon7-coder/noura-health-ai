import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { loadOnboarding, patchOnboarding, type OnboardingData } from "@/lib/noura";

export const Route = createFileRoute("/quiz")({
  component: Quiz,
  head: () => ({
    meta: [
      { title: "Build your plan — Neura AI" },
      { name: "description", content: "Answer 12 quick questions and Neura AI builds your nutrition, hydration and habit plan." },
      { property: "og:title", content: "Build your plan — Neura AI" },
      { property: "og:description", content: "Answer 12 quick questions and Neura AI builds your nutrition, hydration and habit plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const TOTAL = 13;

function haptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(8);
}

function Quiz() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [d, setD] = useState<OnboardingData>({});

  useEffect(() => {
    setD(loadOnboarding());
  }, []);

  function set(patch: Partial<OnboardingData>) {
    setD((prev) => {
      const next = { ...prev, ...patch };
      patchOnboarding(patch);
      return next;
    });
  }

  function next() {
    haptic();
    if (step === TOTAL) {
      nav({ to: "/processing" });
      return;
    }
    setDir(1);
    setStep((s) => s + 1);
  }

  function back() {
    if (step === 1) {
      nav({ to: "/locale" });
      return;
    }
    setDir(-1);
    setStep((s) => s - 1);
  }

  function pick(patch: Partial<OnboardingData>, auto = true) {
    set(patch);
    haptic();
    if (auto) setTimeout(next, 240);
  }

  const canContinue = (() => {
    switch (step) {
      case 1:
        return !!d.goal;
      case 2:
        return !!d.challenge;
      case 3:
        return !!d.age;
      case 4:
        return !!d.heightCm && !!d.weightKg;
      case 5:
        return !!d.activity;
      case 6:
        return !!d.bodyGoal;
      case 7:
        return !!d.nutritionStyle;
      case 8:
        return !!d.hydration;
      case 11:
        return !!d.cookTime;
      default:
        return true;
    }
  })();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald/15 blur-[130px]"
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-6 pb-8 pt-14">
        {/* header */}
        <div className="flex items-center gap-3">
          <button onClick={back} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/8">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald to-hydration"
              animate={{ width: `${(step / TOTAL) * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
            {step}/{TOTAL}
          </span>
        </div>

        <div className="relative mt-8 flex-1">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="flex h-full flex-col"
            >
              <Step step={step} d={d} set={set} pick={pick} />
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          onClick={next}
          disabled={!canContinue}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-[24px] bg-white py-4 text-[15px] font-semibold text-black transition disabled:opacity-30"
        >
          {step === TOTAL ? t("plan.cta", { defaultValue: t("ob.continue") }) : t("ob.continue")}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------- shared bits ---------- */

function Title({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-[27px] font-bold leading-[1.15] tracking-tight">{title}</h1>
      {sub && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Option({
  active,
  onClick,
  emoji,
  label,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  emoji?: string;
  label: string;
  desc?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.975 }}
      onClick={onClick}
      className={`flex w-full items-center gap-3.5 rounded-[22px] border p-4 text-left transition ${
        active ? "border-emerald/60 bg-emerald/10 shadow-emerald-glow" : "border-white/8 bg-white/[0.03]"
      }`}
    >
      {emoji && <span className="text-2xl">{emoji}</span>}
      <div className="flex-1">
        <div className="text-[15px] font-semibold leading-tight">{label}</div>
        {desc && <div className="mt-1 text-xs leading-snug text-muted-foreground">{desc}</div>}
      </div>
      <div
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
          active ? "border-emerald bg-emerald" : "border-white/20"
        }`}
      >
        {active && <Check className="h-3.5 w-3.5 text-black" />}
      </div>
    </motion.button>
  );
}

function Chips({
  items,
  selected,
  onToggle,
}: {
  items: { key: string; label: string }[];
  selected: string[];
  onToggle: (k: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => {
        const active = selected.includes(it.key);
        return (
          <motion.button
            key={it.key}
            whileTap={{ scale: 0.94 }}
            onClick={() => onToggle(it.key)}
            className={`rounded-full border px-4 py-2.5 text-[13px] font-medium transition ${
              active ? "border-emerald/60 bg-emerald/15 text-emerald" : "border-white/10 bg-white/[0.03]"
            }`}
          >
            {it.label}
          </motion.button>
        );
      })}
    </div>
  );
}

function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [text, setText] = useState("");
  function add() {
    const v = text.trim();
    if (!v) return;
    onChange([...value, v]);
    setText("");
  }
  return (
    <div>
      <div className="glass flex items-center gap-2 rounded-2xl px-4 py-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button onClick={add} className="text-xs font-semibold text-emerald">
          +
        </button>
      </div>
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((v, i) => (
            <button
              key={`${v}-${i}`}
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="rounded-full bg-white/8 px-3 py-1.5 text-xs"
            >
              {v} ✕
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- steps ---------- */

function Step({
  step,
  d,
  set,
  pick,
}: {
  step: number;
  d: OnboardingData;
  set: (p: Partial<OnboardingData>) => void;
  pick: (p: Partial<OnboardingData>) => void;
}) {
  const { t } = useTranslation();
  const toggle = (arr: string[] | undefined, k: string) =>
    (arr ?? []).includes(k) ? (arr ?? []).filter((x) => x !== k) : [...(arr ?? []), k];

  if (step === 1) {
    const opts = [
      { k: "lose", e: "🔥" },
      { k: "gain", e: "💪", i: "muscle" },
      { k: "maintain", e: "⚖️" },
      { k: "healthier", e: "🥗", i: "health" },
      { k: "habits", e: "✨" },
    ] as const;
    return (
      <div>
        <Title title={t("ob.q1.title")} sub={t("ob.q1.sub")} />
        <div className="space-y-2.5">
          {opts.map((o) => {
            const i = (o as any).i ?? o.k;
            return (
              <Option
                key={o.k}
                emoji={o.e}
                active={d.goal === o.k}
                label={t(`ob.q1.${i}`)}
                desc={t(`ob.q1.${i}_d`)}
                onClick={() => pick({ goal: o.k as any })}
              />
            );
          })}
        </div>
      </div>
    );
  }

  if (step === 2) {
    const opts = [
      { k: "a", e: "🤔", label: t("ob.q2.a"), sol: t("ob.q2.a_s") },
      { k: "b", e: "📉", label: t("ob.q2.b"), sol: t("ob.q2.b_s") },
      { k: "c", e: "🔍", label: t("ob.q2.c"), sol: t("ob.q2.c_s") },
      { k: "d", e: "💧", label: t("ob.q2_d"), sol: t("ob.q2.d_s") },
      { k: "e", e: "⏱️", label: t("ob.q2.e"), sol: t("ob.q2.e_s") },
    ];
    const chosen = opts.find((o) => o.k === d.challenge);
    return (
      <div>
        <Title title={t("ob.q2.title")} sub={t("ob.q2.sub")} />
        <div className="space-y-2.5">
          {opts.map((o) => (
            <Option
              key={o.k}
              emoji={o.e}
              active={d.challenge === o.k}
              label={o.label}
              onClick={() => set({ challenge: o.k })}
            />
          ))}
        </div>
        <AnimatePresence>
          {chosen && (
            <motion.div
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="glass-strong rounded-[22px] border border-emerald/25 p-4">
                <div className="flex items-center gap-2 text-emerald">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-semibold uppercase tracking-widest">
                    {t("ob.q2.solution")}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed">{chosen.sol}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (step === 3) {
    const age = d.age ?? 28;
    return (
      <div>
        <Title title={t("ob.q3.title")} sub={t("ob.q3.sub")} />
        <div className="glass-strong mt-6 rounded-[28px] p-7 text-center">
          <motion.div key={age} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="font-display text-6xl font-bold">
            {age}
          </motion.div>
          <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{t("ob.q3.years")}</div>
          <input
            type="range"
            min={13}
            max={90}
            value={age}
            onChange={(e) => set({ age: Number(e.target.value) })}
            className="mt-7 w-full accent-emerald"
          />
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div>
        <Title title={t("ob.q4.title")} sub={t("ob.q4.sub")} />
        <div className="space-y-3">
          <NumberField
            label={t("ob.q4.height")}
            unit="cm"
            value={d.heightCm ?? 172}
            min={120}
            max={220}
            onChange={(v) => set({ heightCm: v })}
          />
          <NumberField
            label={t("ob.q4.weight")}
            unit="kg"
            value={d.weightKg ?? 72}
            min={35}
            max={250}
            onChange={(v) => set({ weightKg: v })}
          />
          <NumberField
            label={t("ob.q4.target")}
            unit="kg"
            value={d.targetWeightKg ?? d.weightKg ?? 68}
            min={35}
            max={250}
            onChange={(v) => set({ targetWeightKg: v })}
          />
        </div>
      </div>
    );
  }

  if (step === 5) {
    const opts = ["sedentary", "light", "moderate", "very", "athlete"] as const;
    const emo: Record<string, string> = {
      sedentary: "🪑",
      light: "🚶",
      moderate: "🏃",
      very: "🏋️",
      athlete: "🥇",
    };
    return (
      <div>
        <Title title={t("ob.q5.title")} sub={t("ob.q5.sub")} />
        <div className="space-y-2.5">
          {opts.map((o) => (
            <Option
              key={o}
              emoji={emo[o]}
              active={d.activity === o}
              label={t(`ob.q5.${o}`)}
              desc={t(`ob.q5.${o}_d`)}
              onClick={() => pick({ activity: o })}
            />
          ))}
        </div>
      </div>
    );
  }

  if (step === 6) {
    const opts = [
      { k: "fat", e: "🔥" },
      { k: "strength", e: "💪" },
      { k: "energy", e: "⚡" },
      { k: "lifestyle", e: "🌿" },
    ];
    return (
      <div>
        <Title title={t("ob.q6.title")} sub={t("ob.q6.sub")} />
        <div className="space-y-2.5">
          {opts.map((o) => (
            <Option
              key={o.k}
              emoji={o.e}
              active={d.bodyGoal === o.k}
              label={t(`ob.q6.${o.k}`)}
              onClick={() => pick({ bodyGoal: o.k })}
            />
          ))}
        </div>
        <p className="mt-5 text-center text-xs italic text-muted-foreground">{t("ob.q6.motivation")}</p>
      </div>
    );
  }

  if (step === 7) {
    const opts = [
      { k: "balanced", e: "🥗" },
      { k: "irregular", e: "🕰️" },
      { k: "fastfood", e: "🍔" },
      { k: "homecooked", e: "🍲" },
      { k: "improving", e: "🌱" },
    ];
    return (
      <div>
        <Title title={t("ob.q7.title")} sub={t("ob.q7.sub")} />
        <div className="space-y-2.5">
          {opts.map((o) => (
            <Option
              key={o.k}
              emoji={o.e}
              active={d.nutritionStyle === o.k}
              label={t(`ob.q7.${o.k}`)}
              onClick={() => pick({ nutritionStyle: o.k })}
            />
          ))}
        </div>
      </div>
    );
  }

  if (step === 8) {
    const opts = [
      { k: "lt1", e: "🥃" },
      { k: "1to2", e: "🚰" },
      { k: "2plus", e: "💧" },
      { k: "unsure", e: "🤷" },
    ];
    return (
      <div>
        <Title title={t("ob.q8.title")} sub={t("ob.q8.sub")} />
        <div className="space-y-2.5">
          {opts.map((o) => (
            <Option
              key={o.k}
              emoji={o.e}
              active={d.hydration === o.k}
              label={t(`ob.q8.${o.k}`)}
              onClick={() => pick({ hydration: o.k })}
            />
          ))}
        </div>
        <div className="glass mt-5 rounded-[22px] p-4 text-xs leading-relaxed text-muted-foreground">
          💧 {t("ob.q8.note")}
        </div>
      </div>
    );
  }

  if (step === 9) {
    const items = ["airfryer", "oven", "stove", "blender", "microwave", "grill", "ricecooker"].map((k) => ({
      key: k,
      label: t(`ob.q9.${k}`),
    }));
    return (
      <div>
        <Title title={t("ob.q9.title")} sub={t("ob.q9.sub")} />
        <p className="mb-3 text-[11px] uppercase tracking-widest text-muted-foreground">{t("ob.selectMultiple")}</p>
        <Chips items={items} selected={d.equipment ?? []} onToggle={(k) => set({ equipment: toggle(d.equipment, k) })} />
      </div>
    );
  }

  if (step === 10) {
    const diets = ["vegan", "vegetarian", "lowcarb", "keto", "highprotein", "mediterranean", "none"].map((k) => ({
      key: k,
      label: t(`ob.q10.${k}`),
    }));
    const allergies = ["gluten", "lactose", "nuts", "seafood", "eggs", "soy"].map((k) => ({
      key: k,
      label: t(`ob.q10.${k}`),
    }));
    return (
      <div className="pb-4">
        <Title title={t("ob.q10.title")} sub={t("ob.q10.sub")} />
        <div className="space-y-5">
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">{t("ob.q10.likes")}</div>
            <TagInput value={d.likes ?? []} onChange={(v) => set({ likes: v })} placeholder={t("ob.q10.likesPh")} />
          </div>
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">{t("ob.q10.avoid")}</div>
            <TagInput value={d.avoids ?? []} onChange={(v) => set({ avoids: v })} placeholder={t("ob.q10.avoidPh")} />
          </div>
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">{t("ob.q10.diets")}</div>
            <Chips items={diets} selected={d.diets ?? []} onToggle={(k) => set({ diets: toggle(d.diets, k) })} />
          </div>
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">{t("ob.q10.allergies")}</div>
            <Chips
              items={allergies}
              selected={d.allergies ?? []}
              onToggle={(k) => set({ allergies: toggle(d.allergies, k) })}
            />
          </div>
        </div>
      </div>
    );
  }

  if (step === 11) {
    const opts = [
      { k: "a", e: "⚡", label: t("ob.q11.a") },
      { k: "b", e: "⏱️", label: t("ob.q11.b") },
      { k: "c", e: "🍳", label: t("ob.q11.c") },
      { k: "d", e: "👨‍🍳", label: t("ob.q11_d") },
    ];
    return (
      <div>
        <Title title={t("ob.q11.title")} sub={t("ob.q11.sub")} />
        <div className="space-y-2.5">
          {opts.map((o) => (
            <Option
              key={o.k}
              emoji={o.e}
              active={d.cookTime === o.k}
              label={o.label}
              onClick={() => pick({ cookTime: o.k })}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Title title={t("ob.q12.title")} sub={t("ob.q12.sub")} />
      <textarea
        value={d.motivation ?? ""}
        onChange={(e) => set({ motivation: e.target.value })}
        rows={6}
        placeholder={t("ob.q12.ph") as string}
        className="glass w-full resize-none rounded-[22px] p-4 text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
      />
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">✨ {t("ob.q12.hint")}</p>
    </div>
  );
}

function NumberField({
  label,
  unit,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="glass-strong rounded-[22px] p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="font-display text-2xl font-bold tabular-nums">
          {value}
          <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-emerald"
      />
    </div>
  );
}

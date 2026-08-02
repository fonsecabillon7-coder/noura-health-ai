// Shared onboarding state (client-side, synced to Supabase at the end of the flow)
export type Goal = "lose" | "gain" | "maintain" | "healthier" | "habits";
export type Activity = "sedentary" | "light" | "moderate" | "very" | "athlete";

export interface OnboardingData {
  // locale
  country?: string;
  language?: string;
  // quiz
  goal?: Goal;
  challenge?: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  targetWeightKg?: number;
  activity?: Activity;
  bodyGoal?: string;
  nutritionStyle?: string;
  hydration?: string;
  equipment?: string[];
  likes?: string[];
  avoids?: string[];
  diets?: string[];
  allergies?: string[];
  cookTime?: string;
  motivation?: string;
  /** How the user discovered Neura AI (acquisition source) */
  source?: string;

}

const KEY = "neura.onboarding";

export function loadOnboarding(): OnboardingData {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveOnboarding(data: OnboardingData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function patchOnboarding(patch: Partial<OnboardingData>) {
  const next = { ...loadOnboarding(), ...patch };
  saveOnboarding(next);
  return next;
}

export function clearOnboarding() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

// ===== Personalized plan =====
export interface NeuraPlan {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  waterMl: number;
  weeklyDelta: number; // kg per week (negative = loss)
  weeks: { week: number; weight: number }[];
  habits: { icon: string; key: string; name: string }[];
}

const ACTIVITY_FACTOR: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  athlete: 1.9,
};

export function buildPlan(d: OnboardingData): NeuraPlan {
  const weight = d.weightKg ?? 72;
  const height = d.heightCm ?? 172;
  const age = d.age ?? 30;
  const activity = ACTIVITY_FACTOR[d.activity ?? "light"] ?? 1.375;

  // Mifflin-St Jeor (sex-neutral average constant)
  const bmr = 10 * weight + 6.25 * height - 5 * age - 78;
  const tdee = bmr * activity;

  let kcal = tdee;
  let weeklyDelta = 0;
  if (d.goal === "lose") {
    kcal = tdee - 500;
    weeklyDelta = -0.45;
  } else if (d.goal === "gain") {
    kcal = tdee + 300;
    weeklyDelta = 0.25;
  }
  kcal = Math.max(1300, Math.round(kcal / 10) * 10);

  const proteinPerKg = d.goal === "gain" ? 2.0 : d.goal === "lose" ? 1.8 : 1.6;
  const protein = Math.round(weight * proteinPerKg);
  const fat = Math.round((kcal * 0.27) / 9);
  const carbs = Math.max(60, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const fiber = Math.round(Math.min(40, Math.max(22, kcal / 70)));

  let waterMl = Math.round((weight * 35) / 50) * 50;
  if (d.activity === "very" || d.activity === "athlete") waterMl += 500;
  if (d.hydration === "lt1") waterMl = Math.min(waterMl, 2200);
  waterMl = Math.max(1500, Math.min(4000, waterMl));

  const start = weight;
  const target = d.targetWeightKg ?? weight;
  const weeks = Array.from({ length: 5 }, (_, i) => {
    let w = start + weeklyDelta * i;
    if (weeklyDelta < 0) w = Math.max(target, w);
    if (weeklyDelta > 0) w = Math.min(target || Infinity, w);
    return { week: i, weight: Math.round(w * 10) / 10 };
  });

  const habits: { icon: string; key: string; name: string }[] = [
    { icon: "💧", key: "water", name: "Hydration" },
    { icon: "🥗", key: "meals", name: "Log every meal" },
  ];
  if (d.goal === "gain" || d.bodyGoal === "strength") habits.push({ icon: "🏋️", key: "workout", name: "Train" });
  if (d.challenge === "e" || d.cookTime === "a") habits.push({ icon: "🍱", key: "prep", name: "Meal prep" });
  if (d.bodyGoal === "energy" || d.nutritionStyle === "irregular") habits.push({ icon: "😴", key: "sleep", name: "Sleep routine" });
  habits.push({ icon: "🚶", key: "walk", name: "Daily walk" });

  return { kcal, protein, carbs, fat, fiber, waterMl, weeklyDelta, weeks, habits: habits.slice(0, 5) };
}

export const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸", lang: "en-US" },
  { code: "BR", name: "Brasil", flag: "🇧🇷", lang: "pt-BR" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", lang: "pt-BR" },
  { code: "ES", name: "España", flag: "🇪🇸", lang: "es-ES" },
  { code: "MX", name: "México", flag: "🇲🇽", lang: "es-ES" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", lang: "es-ES" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", lang: "es-ES" },
  { code: "CL", name: "Chile", flag: "🇨🇱", lang: "es-ES" },
  { code: "FR", name: "France", flag: "🇫🇷", lang: "fr-FR" },
  { code: "BE", name: "Belgique", flag: "🇧🇪", lang: "fr-FR" },
  { code: "CH", name: "Schweiz", flag: "🇨🇭", lang: "de-DE" },
  { code: "DE", name: "Deutschland", flag: "🇩🇪", lang: "de-DE" },
  { code: "AT", name: "Österreich", flag: "🇦🇹", lang: "de-DE" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", lang: "en-US" },
  { code: "IE", name: "Ireland", flag: "🇮🇪", lang: "en-US" },
  { code: "CA", name: "Canada", flag: "🇨🇦", lang: "en-US" },
  { code: "AU", name: "Australia", flag: "🇦🇺", lang: "en-US" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", lang: "en-US" },
  { code: "IT", name: "Italia", flag: "🇮🇹", lang: "en-US" },
  { code: "NL", name: "Nederland", flag: "🇳🇱", lang: "en-US" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", lang: "en-US" },
  { code: "IN", name: "India", flag: "🇮🇳", lang: "en-US" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", lang: "en-US" },
  { code: "JP", name: "日本", flag: "🇯🇵", lang: "en-US" },
] as const;

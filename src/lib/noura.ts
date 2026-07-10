// Shared onboarding state (in-memory client)
export type Goal = "lose" | "gain" | "maintain" | "healthier" | "habits";
export type Activity = "sedentary" | "light" | "moderate" | "very" | "athlete";

export interface OnboardingData {
  goal?: Goal;
  activity?: Activity;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  targetWeightKg?: number;
  diets?: string[];
  allergies?: string[];
  equipment?: string[];
  cookTime?: string;
  water?: number;
  motivation?: string;
}

const KEY = "noura.onboarding";

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

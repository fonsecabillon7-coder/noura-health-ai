import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enUS from "@/locales/en-US.json";
import ptBR from "@/locales/pt-BR.json";
import esES from "@/locales/es-ES.json";
import frFR from "@/locales/fr-FR.json";
import deDE from "@/locales/de-DE.json";

export const SUPPORTED_LNGS = ["en-US", "pt-BR", "es-ES", "fr-FR", "de-DE"] as const;
export const LANG_STORAGE_KEY = "neura.lang";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      "en-US": { translation: enUS },
      "pt-BR": { translation: ptBR },
      "es-ES": { translation: esES },
      "fr-FR": { translation: frFR },
      "de-DE": { translation: deDE },
    },
    // Always start in the same language on server and client so SSR markup
    // matches; the detected/stored language is applied after hydration.
    lng: "en-US",
    fallbackLng: "en-US",
    supportedLngs: SUPPORTED_LNGS as unknown as string[],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

/** Resolve the best language for this device: saved choice → browser → en-US. */
export function detectLanguage(): string {
  if (typeof window === "undefined") return "en-US";
  const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
  if (saved && (SUPPORTED_LNGS as readonly string[]).includes(saved)) return saved;
  const navLangs = [navigator.language, ...(navigator.languages ?? [])];
  for (const l of navLangs) {
    const exact = (SUPPORTED_LNGS as readonly string[]).find((s) => s.toLowerCase() === l.toLowerCase());
    if (exact) return exact;
    const base = (SUPPORTED_LNGS as readonly string[]).find((s) => s.slice(0, 2) === l.slice(0, 2));
    if (base) return base;
  }
  return "en-US";
}

/** Apply (and persist) a language across the whole app. */
export function applyLanguage(code: string) {
  if (!(SUPPORTED_LNGS as readonly string[]).includes(code)) return;
  if (typeof window !== "undefined") window.localStorage.setItem(LANG_STORAGE_KEY, code);
  if (i18n.resolvedLanguage !== code) void i18n.changeLanguage(code);
}

export default i18n;

export const LANGUAGES = [
  { code: "en-US", name: "English (US)", native: "English", flag: "🇺🇸" },
  { code: "pt-BR", name: "Portuguese (Brazil)", native: "Português", flag: "🇧🇷" },
  { code: "es-ES", name: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "fr-FR", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "de-DE", name: "German", native: "Deutsch", flag: "🇩🇪" },
] as const;

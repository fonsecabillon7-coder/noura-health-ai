import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import enUS from "@/locales/en-US.json";
import ptBR from "@/locales/pt-BR.json";
import esES from "@/locales/es-ES.json";
import frFR from "@/locales/fr-FR.json";
import deDE from "@/locales/de-DE.json";

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        "en-US": { translation: enUS },
        "pt-BR": { translation: ptBR },
        "es-ES": { translation: esES },
        "fr-FR": { translation: frFR },
        "de-DE": { translation: deDE },
      },
      fallbackLng: "en-US",
      supportedLngs: ["en-US", "pt-BR", "es-ES", "fr-FR", "de-DE"],
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        lookupLocalStorage: "neura.lang",
        caches: ["localStorage"],
      },
    });
}

export default i18n;

export const LANGUAGES = [
  { code: "en-US", name: "English (US)", native: "English", flag: "🇺🇸" },
  { code: "pt-BR", name: "Portuguese (Brazil)", native: "Português", flag: "🇧🇷" },
  { code: "es-ES", name: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "fr-FR", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "de-DE", name: "German", native: "Deutsch", flag: "🇩🇪" },
] as const;

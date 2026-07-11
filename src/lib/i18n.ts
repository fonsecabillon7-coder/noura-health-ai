import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import enUS from "@/locales/en-US.json";
import ptBR from "@/locales/pt-BR.json";

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        "en-US": { translation: enUS },
        "pt-BR": { translation: ptBR },
      },
      fallbackLng: "en-US",
      supportedLngs: ["en-US", "pt-BR"],
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        lookupLocalStorage: "noura.lang",
        caches: ["localStorage"],
      },
    });
}

export default i18n;

export const LANGUAGES = [
  { code: "en-US", name: "English", native: "English", flag: "🇺🇸" },
  { code: "pt-BR", name: "Portuguese", native: "Português", flag: "🇧🇷" },
] as const;

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { Check, Search, Globe2, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { COUNTRIES, patchOnboarding } from "@/lib/noura";
import { LANGUAGES, applyLanguage } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/locale")({
  component: LocaleStep,
  head: () => ({
    meta: [
      { title: "Country & language — Neura AI" },
      { name: "description", content: "Pick your country and language so Neura AI adapts food, units and recipes to you." },
      { property: "og:title", content: "Country & language — Neura AI" },
      { property: "og:description", content: "Pick your country and language so Neura AI adapts food, units and recipes to you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function LocaleStep() {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const [phase, setPhase] = useState<"country" | "language">("country");
  const [country, setCountry] = useState<string | null>(null);
  const [lang, setLang] = useState<string>(i18n.resolvedLanguage || "en-US");
  const [q, setQ] = useState("");

  const list = useMemo(
    () => COUNTRIES.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase())),
    [q],
  );

  function pickCountry(code: string, suggested: string) {
    setCountry(code);
    setLang(suggested);
    applyLanguage(suggested);
    patchOnboarding({ country: code, language: suggested });
    setTimeout(() => setPhase("language"), 260);
  }

  async function finish() {
    patchOnboarding({ country: country ?? undefined, language: lang });
    applyLanguage(lang);
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await supabase
          .from("profiles")
          .update({ country, language: lang, measurement_system: country === "US" ? "imperial" : "metric" })
          .eq("user_id", data.user.id);
      }
    } catch {
      /* saved locally; synced again after the plan step */
    }
    nav({ to: "/quiz" });
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-hydration/15 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-6 pb-8 pt-14">
        <div className="flex items-center gap-2 text-emerald">
          <Globe2 className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-widest">Neura AI</span>
        </div>

        <AnimatePresence mode="wait">
          {phase === "country" ? (
            <motion.div
              key="country"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <h1 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight">
                {t("ob.loc.title")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{t("ob.loc.sub")}</p>

              <div className="glass mt-5 flex items-center gap-2 rounded-2xl px-4 py-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("ob.loc.search") as string}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>

              <div className="mt-4 flex-1 space-y-2 overflow-y-auto pb-6">
                {list.map((c, i) => (
                  <motion.button
                    key={c.code}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.25) }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => pickCountry(c.code, c.lang)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                      country === c.code
                        ? "border-emerald/60 bg-emerald/10"
                        : "border-white/8 bg-white/[0.03]"
                    }`}
                  >
                    <span className="text-2xl">{c.flag}</span>
                    <span className="flex-1 text-sm font-medium">{c.name}</span>
                    {country === c.code && <Check className="h-5 w-5 text-emerald" />}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="language"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <h1 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight">
                {t("ob.loc.language")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{t("ob.loc.note")}</p>

              <div className="mt-6 flex-1 space-y-2.5 overflow-y-auto">
                {LANGUAGES.map((l, i) => {
                  const active = lang === l.code;
                  return (
                    <motion.button
                      key={l.code}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setLang(l.code);
                        applyLanguage(l.code);
                      }}
                      className={`relative flex w-full items-center gap-3 overflow-hidden rounded-[24px] border p-4 text-left transition ${
                        active
                          ? "border-emerald/60 bg-emerald/10 shadow-emerald-glow"
                          : "border-white/8 bg-white/[0.03]"
                      }`}
                    >
                      <span className="text-2xl">{l.flag}</span>
                      <div className="flex-1">
                        <div className="font-semibold">{l.native}</div>
                        <div className="text-[11px] text-muted-foreground">{l.name}</div>
                      </div>
                      {active && <Check className="h-5 w-5 text-emerald" />}
                    </motion.button>
                  );
                })}
              </div>

              <button
                onClick={finish}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-[24px] bg-white py-4 text-[15px] font-semibold text-black"
              >
                {t("ob.continue")} <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPhase("country")}
                className="mt-2 py-2 text-xs text-muted-foreground"
              >
                {t("ob.back")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

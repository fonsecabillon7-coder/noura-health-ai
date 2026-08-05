import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check } from "lucide-react";
import { useState } from "react";
import { LANGUAGES, applyLanguage } from "@/lib/i18n";

export function LangSwitcher({
  className = "",
  onChange,
}: {
  className?: string;
  onChange?: (code: string) => void;
}) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = i18n.resolvedLanguage || "en-US";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`grid h-10 w-10 place-items-center rounded-full bg-white/8 backdrop-blur-md active:bg-white/15 ${className}`}
        aria-label="Language"
      >
        <Globe className="h-4 w-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-6"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong w-full max-w-sm rounded-[28px] p-5 shadow-premium"
            >
              <h3 className="font-display text-xl font-bold">Language</h3>
              <div className="mt-4 space-y-2">
                {LANGUAGES.map((lng) => {
                  const active = current === lng.code;
                  return (
                    <button
                      key={lng.code}
                      onClick={() => {
                        applyLanguage(lng.code);
                        onChange?.(lng.code);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                        active ? "border-emerald/60 bg-emerald/10" : "border-white/8 bg-white/[0.03]"
                      }`}
                    >
                      <span className="text-2xl">{lng.flag}</span>
                      <div className="flex-1">
                        <div className="font-semibold">{lng.native}</div>
                        <div className="text-xs text-muted-foreground">{lng.name}</div>
                      </div>
                      {active && <Check className="h-5 w-5 text-emerald" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

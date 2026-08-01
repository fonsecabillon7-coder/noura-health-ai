import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Camera, ChefHat, X, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/add")({ component: AddHub });

function AddHub() {
  const nav = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-xl">
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => nav({ to: "/dashboard" })}
        className="absolute inset-0"
        aria-label="Close"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 26 }}
        className="relative rounded-t-[36px] bg-background p-6 pb-10 shadow-premium"
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald">
              <Sparkles className="h-3 w-3" /> Neura AI
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold">
              {t("add.title", { defaultValue: "What do you want to do?" })}
            </h2>
          </div>
          <button onClick={() => nav({ to: "/dashboard" })} className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => nav({ to: "/scan", search: { mode: "food" } as any })}
            className="glass-strong flex items-center gap-4 rounded-[28px] p-5 text-left"
          >
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald to-emerald/40">
              <Camera className="h-6 w-6 text-black" />
            </div>
            <div className="flex-1">
              <div className="font-display text-lg font-bold">
                {t("add.scanFood", { defaultValue: "Scan Food" })}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("add.scanFoodSub", { defaultValue: "Analyze calories and nutrition instantly" })}
              </div>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => nav({ to: "/recipes", search: { scan: "1" } as any })}
            className="glass-strong flex items-center gap-4 rounded-[28px] p-5 text-left"
          >
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500">
              <ChefHat className="h-6 w-6 text-black" />
            </div>
            <div className="flex-1">
              <div className="font-display text-lg font-bold">
                {t("add.recipeGen", { defaultValue: "Recipe Generator" })}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("add.recipeGenSub", { defaultValue: "Create recipes from your ingredients" })}
              </div>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

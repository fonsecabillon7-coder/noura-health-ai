import { Link, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Home, BookOpen, ChefHat, ShoppingCart, User, Plus } from "lucide-react";

const tabs = [
  { to: "/dashboard", label: "Home", Icon: Home },
  { to: "/meals", label: "Meals", Icon: BookOpen },
  { to: "/recipes", label: "Recipes", Icon: ChefHat },
  { to: "/shopping", label: "Shopping", Icon: ShoppingCart },
  { to: "/profile", label: "Profile", Icon: User },
] as const;

export function BottomNav() {
  const loc = useLocation();
  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 pb-[max(env(safe-area-inset-bottom),12px)]">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4">
          <div className="glass-strong flex flex-1 items-center justify-around rounded-[28px] py-2 shadow-premium">
            {tabs.map(({ to, label, Icon }) => {
              const active = loc.pathname === to;
              return (
                <Link key={to} to={to} className="relative flex flex-col items-center gap-0.5 px-2 py-1.5">
                  <motion.div
                    animate={{ scale: active ? 1.1 : 1, y: active ? -2 : 0 }}
                    transition={{ type: "spring", damping: 18 }}
                    className={active ? "text-emerald" : "text-white/50"}
                  >
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                  </motion.div>
                  <span className={`text-[10px] font-medium ${active ? "text-emerald" : "text-white/40"}`}>{label}</span>
                </Link>
              );
            })}
          </div>
          <Link to="/scan" className="grid h-14 w-14 place-items-center rounded-full bg-white text-black shadow-premium">
            <Plus className="h-6 w-6" strokeWidth={2.6} />
          </Link>
        </div>
      </div>
      <div className="h-28" />
    </>
  );
}

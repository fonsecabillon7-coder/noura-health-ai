import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/bottom-nav";
import { Crown, ChevronRight, Target, Droplets, Flame, ChefHat } from "lucide-react";

export const Route = createFileRoute("/profile")({ component: Profile });

function Profile() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-md px-5 pt-14">
        <div className="glass-strong rounded-[28px] p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-emerald to-hydration font-display text-2xl font-bold text-black">S</div>
            <div className="flex-1">
              <div className="font-display text-xl font-bold">Sarah</div>
              <div className="text-xs text-muted-foreground">Goal: Lose weight · 21 day streak</div>
            </div>
          </div>
          <button className="mt-4 flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-gold/25 to-gold/10 p-3">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-gold" />
              <span className="font-semibold text-gold">Upgrade to Premium</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gold" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat Icon={Flame} color="text-calorie" label="Daily kcal" val="2,180" />
          <Stat Icon={Droplets} color="text-hydration" label="Water target" val="2.0 L" />
          <Stat Icon={Target} color="text-emerald" label="Target weight" val="68 kg" />
          <Stat Icon={ChefHat} color="text-gold" label="Kitchen tools" val="6" />
        </div>

        <div className="mt-6 space-y-1">
          {["Account", "Notifications", "Units", "Language", "Appearance", "Privacy", "Data Export", "Help", "About"].map((s) => (
            <button key={s} className="flex w-full items-center justify-between rounded-2xl px-2 py-3.5 text-left hover:bg-white/5">
              <span className="text-sm">{s}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function Stat({ Icon, color, label, val }: { Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string; label: string; val: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <Icon className={`h-5 w-5 ${color}`} />
      <div className="mt-2 font-display text-xl font-bold">{val}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

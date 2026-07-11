import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function ProgressRing({
  size, progress, color, stroke = 6, children,
}: { size: number; progress: number; color: string; stroke?: number; children?: ReactNode }) {
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${p * c} ${c}` }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      {children && <div className="absolute">{children}</div>}
    </div>
  );
}

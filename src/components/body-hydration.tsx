import { motion } from "framer-motion";

/** Animated human silhouette that fills with water from feet to head. */
export function BodyHydration({ progress, height = 220 }: { progress: number; height?: number }) {
  const p = Math.max(0, Math.min(1, progress));
  const fillY = 240 - p * 220; // clip rect y within 20..240

  return (
    <div className="relative" style={{ height }}>
      <svg viewBox="0 0 140 260" className="h-full w-auto" fill="none">
        <defs>
          <linearGradient id="waterFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="oklch(0.85 0.14 220)" />
            <stop offset="1" stopColor="oklch(0.55 0.16 235)" />
          </linearGradient>
          <clipPath id="bodyClip">
            {/* Body silhouette — head, neck, torso, arms, legs */}
            <path d="M70 12c-11 0-19 8-19 19s8 19 19 19 19-8 19-19-8-19-19-19zM55 54c-5 0-8 4-9 9l-6 32c-1 5 3 9 8 9h4l-3 60c0 5 3 9 8 9h4l3 66c0 5 4 8 8 8s8-3 8-8l3-66h4c5 0 8-4 8-9l-3-60h4c5 0 9-4 8-9l-6-32c-1-5-4-9-9-9H55z" />
          </clipPath>
        </defs>

        {/* Body outline */}
        <path
          d="M70 12c-11 0-19 8-19 19s8 19 19 19 19-8 19-19-8-19-19-19zM55 54c-5 0-8 4-9 9l-6 32c-1 5 3 9 8 9h4l-3 60c0 5 3 9 8 9h4l3 66c0 5 4 8 8 8s8-3 8-8l3-66h4c5 0 8-4 8-9l-3-60h4c5 0 9-4 8-9l-6-32c-1-5-4-9-9-9H55z"
          stroke="oklch(0.75 0.05 230 / 0.35)"
          strokeWidth="1.2"
          fill="oklch(1 0 0 / 0.03)"
        />

        {/* Water fill clipped to body */}
        <g clipPath="url(#bodyClip)">
          <motion.rect
            x="0"
            width="140"
            initial={false}
            animate={{ y: fillY }}
            transition={{ type: "spring", damping: 20, stiffness: 90 }}
            height="260"
            fill="url(#waterFill)"
          />
          {/* Wave surface */}
          <motion.g
            initial={false}
            animate={{ y: fillY }}
            transition={{ type: "spring", damping: 20, stiffness: 90 }}
          >
            <motion.path
              animate={{ x: [-20, 0, -20] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              d="M-20 4 Q 15 -4 50 4 T 120 4 T 190 4 V 20 H -20 Z"
              fill="oklch(0.9 0.13 220 / 0.7)"
            />
          </motion.g>
          {/* Bubbles */}
          {[
            { cx: 55, cy: 200, r: 2, d: 2.4 },
            { cx: 82, cy: 220, r: 1.5, d: 3.1 },
            { cx: 70, cy: 180, r: 1.8, d: 2.8 },
          ].map((b, i) => (
            <motion.circle
              key={i}
              cx={b.cx}
              r={b.r}
              fill="white"
              fillOpacity={0.45}
              initial={{ cy: b.cy }}
              animate={{ cy: [b.cy, b.cy - 40, b.cy], opacity: [0, 0.6, 0] }}
              transition={{ duration: b.d, repeat: Infinity, delay: i * 0.6 }}
            />
          ))}
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="rounded-full bg-black/40 px-3 py-1 text-xs font-bold backdrop-blur">
          {Math.round(p * 100)}%
        </div>
      </div>
    </div>
  );
}

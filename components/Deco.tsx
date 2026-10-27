"use client";

import { motion, useReducedMotion, type TargetAndTransition, type Transition } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { POP } from "@/lib/motion";

/** viewBox aspect (height / width) of each illustration in /public/illustrations. */
const ASPECT = {
  burst: 214 / 230,
  "daisy-mint": 1,
  "daisy-pink": 1,
  "daisy-sun": 1,
  "dot-coral": 1,
  "loop-arrow": 220 / 360,
  rainbow: 190 / 300,
  "smiley-laugh": 1,
  "smiley-wavy": 1,
  sparkle: 1,
  star: 1,
} as const;

export type Illustration = keyof typeof ASPECT;
type Idle = "float" | "sway" | "spin" | "none";

interface Props {
  name: Illustration;
  width: number;
  className?: string;
  style?: CSSProperties;
  /** Resting tilt in degrees. */
  tilt?: number;
  flip?: boolean;
  idle?: Idle;
  /** Idle loop length in seconds (4–8). */
  duration?: number;
  delay?: number;
  /** Spring in from nothing on mount. */
  pop?: boolean;
}

function idleMotion(idle: Idle, tilt: number): TargetAndTransition | undefined {
  if (idle === "float") return { y: [0, -6, 0], rotate: tilt };
  if (idle === "sway") return { rotate: [tilt - 5, tilt + 5, tilt - 5] };
  if (idle === "spin") return { rotate: [tilt, tilt + 360] };
  return undefined;
}

/** A decorative illustration: hidden from assistive tech, never catches clicks, gently idles. */
export function Deco({ name, width, className, style, tilt = 0, flip = false, idle = "float", duration = 6, delay = 0, pop = false }: Props) {
  const reduce = useReducedMotion();
  const height = Math.round(width * ASPECT[name]);
  const loop: Transition = {
    duration,
    delay,
    repeat: Infinity,
    ease: idle === "spin" ? "linear" : "easeInOut",
  };

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/illustrations/${name}.svg`}
      alt=""
      width={width}
      height={height}
      draggable={false}
      className="block max-w-none select-none"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    />
  );

  return (
    <motion.div
      aria-hidden="true"
      className={cn("pointer-events-none absolute", className)}
      style={{ width, height, rotate: tilt, ...style }}
      initial={pop ? { scale: 0, rotate: tilt - 30 } : false}
      animate={pop ? { scale: 1, rotate: tilt } : undefined}
      transition={pop ? { ...POP, delay } : undefined}
    >
      {reduce || idle === "none" ? img : <IdleLoop motionTarget={idleMotion(idle, 0)} transition={loop}>{img}</IdleLoop>}
    </motion.div>
  );
}

function IdleLoop({ motionTarget, transition, children }: { motionTarget?: TargetAndTransition; transition: Transition; children: ReactNode }) {
  return (
    <motion.div className="h-full w-full" animate={motionTarget} transition={transition}>
      {children}
    </motion.div>
  );
}

const STICKER_BG = {
  sky: "bg-sky",
  sun: "bg-sun",
  pink: "bg-pink",
  lilac: "bg-lilac",
  mint: "bg-mint",
  coral: "bg-coral",
  white: "bg-white",
} as const;

export type StickerColor = keyof typeof STICKER_BG;

/** Small Space Mono label on a coloured, outlined, slightly tilted pill. */
export function Sticker({ color, tilt = -2, className, children, title }: { color: StickerColor; tilt?: number; className?: string; children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      style={{ transform: `rotate(${tilt}deg)` }}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border-[2.5px] border-ink px-2.5 py-[3px] font-mono text-[12px] leading-tight text-ink shadow-hard-md",
        STICKER_BG[color],
        className,
      )}
    >
      {children}
    </span>
  );
}

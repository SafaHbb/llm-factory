"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { Candidate } from "@/lib/pipeline";
import { cn } from "@/lib/cn";
import { COLORS, EASE, MORPH } from "@/lib/motion";

const LAYERS = 6;

/** The model itself: a sky box whose layers light up while it is working. */
export function ModelBox({ active, sub }: { active: boolean; sub: ReactNode }) {
  return (
    <motion.div
      layoutId="model"
      transition={MORPH}
      style={{ borderRadius: 16 }}
      className="relative z-10 flex items-center gap-4 border-[3px] border-ink bg-sky px-5 py-2.5 text-ink shadow-hard"
    >
      <div className="flex h-6 items-end gap-[3px]">
        {Array.from({ length: LAYERS }, (_, i) => (
          <motion.span
            key={i}
            className="w-2 rounded-full border-[1.5px] border-ink"
            style={{ height: 10 + ((i * 7) % 14) }}
            animate={
              active
                ? { backgroundColor: [COLORS.white, COLORS.coral, COLORS.white] }
                : { backgroundColor: COLORS.white }
            }
            transition={active ? { duration: 0.9, delay: i * 0.1, repeat: Infinity } : { duration: 0.3 }}
          />
        ))}
      </div>
      <motion.div layout="position" className="flex flex-col">
        <span className="text-sm font-bold leading-tight">Language model</span>
        <span className="font-mono text-[10px] leading-tight text-ink/80">{sub}</span>
      </motion.div>
    </motion.div>
  );
}

/** Vertical arrow between parts, with a numbered label and a dot that travels down while active. */
export function Connector({ step, label, active, lit }: { step: number; label: ReactNode; active: boolean; lit: boolean }) {
  return (
    <div className="relative flex h-9 w-full justify-center">
      <div className={cn("relative h-full w-[2.5px] transition-colors duration-500", lit ? "bg-ink" : "bg-ink/20")}>
        {active && (
          <motion.span
            className="absolute -left-[4px] h-[10px] w-[10px] rounded-full border-2 border-ink bg-sun"
            animate={{ top: ["0%", "100%"], opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeIn" }}
          />
        )}
        <span
          className={cn(
            "absolute -bottom-px -left-[4.5px] h-0 w-0 border-x-[5.75px] border-t-[7px] border-x-transparent transition-colors duration-500",
            lit ? "border-t-ink" : "border-t-ink/20",
          )}
        />
      </div>
      <span
        className={cn(
          "absolute left-1/2 top-1/2 ml-4 flex w-[46%] -translate-y-1/2 items-center gap-2 text-[11px] leading-tight transition-colors duration-500",
          lit ? "text-ink" : "text-ink/45",
        )}
      >
        <span
          className={cn(
            "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2 font-mono text-[9px] font-bold transition-colors duration-500",
            lit ? "border-ink bg-coral text-ink" : "border-ink/30 bg-white text-ink/50",
          )}
        >
          {step}
        </span>
        {label}
      </span>
    </div>
  );
}

interface BarsProps {
  cands: Candidate[];
  picked: boolean;
  /** Renders the top candidate's chip; it carries the layoutId that flies into the sentence. */
  renderTop: () => ReactNode;
  others?: number;
  delay?: number;
  compact?: boolean;
}

/** Ranked candidates with probability bars. The top one is the model's pick. */
export function CandidateBars({ cands, picked, renderTop, others, delay = 0, compact = false }: BarsProps) {
  const max = cands[0]?.p ?? 1;
  const rest = Math.max(0, 1 - cands.reduce((a, c) => a + c.p, 0));
  return (
    <div className={cn("flex w-full flex-col", compact ? "gap-1" : "gap-1.5")}>
      {cands.map((c, i) => {
        const top = i === 0;
        return (
          <motion.div
            key={c.text + i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: picked && !top ? 0.3 : 1, y: 0 }}
            transition={{ delay: picked ? 0 : delay + i * 0.08, duration: 0.35 }}
            className={cn("grid items-center gap-3", compact ? "grid-cols-[96px_1fr_40px]" : "grid-cols-[112px_1fr_44px]")}
          >
            <div className="flex justify-end">
              {top ? (
                renderTop()
              ) : (
                <span className="rounded-[12px] border-[2.5px] border-ink bg-white px-2.5 py-1 text-sm font-bold leading-none text-ink shadow-hard-md">{c.text}</span>
              )}
            </div>
            <div className={cn("flex", compact ? "h-3.5" : "h-4")}>
              <motion.div
                className={cn("h-full min-w-[10px] rounded-full border-[2.5px] border-ink", top ? "bg-coral shadow-hard-sm" : "bg-white")}
                initial={{ width: 0 }}
                animate={{ width: `${(c.p / max) * 100}%` }}
                transition={{ delay: delay + 0.15 + i * 0.08, duration: 0.6, ease: EASE }}
              />
            </div>
            <span className={cn("font-mono text-xs text-ink", top && "font-bold")}>
              {(c.p * 100).toFixed(0)}%
            </span>
          </motion.div>
        );
      })}
      {others !== undefined && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: picked ? 0.3 : 1 }}
          transition={{ delay: picked ? 0 : delay + cands.length * 0.08 + 0.2, duration: 0.35 }}
          className="grid grid-cols-[112px_1fr_44px] items-center gap-3"
        >
          <span className="justify-self-end font-mono text-[11px] text-ink/80">+{others.toLocaleString()} more</span>
          <span className="text-[11px] text-ink/70">all other tokens share the rest</span>
          <span className="font-mono text-xs text-ink/80">{(rest * 100).toFixed(0)}%</span>
        </motion.div>
      )}
    </div>
  );
}

/** Empty outline left behind when the picked chip flies away. */
export function Ghost({ text }: { text: string }) {
  return (
    <span className="rounded-[12px] border-[2.5px] border-dashed border-ink/50 px-2.5 py-1.5 text-sm font-bold leading-none text-transparent">
      {text}
    </span>
  );
}

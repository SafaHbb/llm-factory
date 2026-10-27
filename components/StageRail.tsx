"use client";

import { motion } from "framer-motion";
import { STAGES } from "@/lib/stages";
import { cn } from "@/lib/cn";
import { EASE } from "@/lib/motion";

export function StageRail({ stage, onSelect }: { stage: number; onSelect: (i: number) => void }) {
  const last = STAGES.length - 1;
  return (
    <nav aria-label="Pipeline stages" className="-mx-4 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:px-0">
      <ol className="relative grid min-w-[720px] grid-cols-10">
        <div className="absolute left-[5%] right-[5%] top-[13px] h-px bg-line" />
        <motion.div
          className="absolute left-[5%] top-[13px] h-px w-[90%] origin-left bg-ink"
          initial={false}
          animate={{ scaleX: stage / last }}
          transition={{ duration: 0.8, ease: EASE }}
        />
        {STAGES.map((s, i) => {
          const active = i === stage;
          const passed = i < stage;
          return (
            <li key={s.short} className="relative flex justify-center">
              <button
                onClick={() => onSelect(i)}
                className="group flex flex-col items-center gap-2 rounded-lg px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-steel/40"
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={cn(
                    "relative grid h-[27px] w-[27px] place-items-center rounded-full border font-mono text-[10px] transition-colors",
                    active ? "border-ink text-white" : passed ? "border-ink bg-ink text-white" : "border-line bg-paper text-muted group-hover:border-ink/40",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="rail-active"
                      className="absolute -inset-[5px] rounded-full border border-accent/50"
                      transition={{ duration: 0.6, ease: EASE }}
                    />
                  )}
                  {active && <span className="absolute inset-0 rounded-full bg-accent" />}
                  <span className="relative">{String(i + 1).padStart(2, "0")}</span>
                </span>
                <span className={cn("text-xs transition-colors", active ? "font-medium text-ink" : "text-muted group-hover:text-ink")}>
                  {s.short}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

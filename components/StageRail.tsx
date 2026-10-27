"use client";

import { motion } from "framer-motion";
import { STAGES } from "@/lib/stages";
import { cn } from "@/lib/cn";
import { EASE } from "@/lib/motion";
import { Deco } from "./Deco";

export function StageRail({ stage, onSelect }: { stage: number; onSelect: (i: number) => void }) {
  const last = STAGES.length - 1;
  return (
    <nav aria-label="Pipeline stages" className="-mx-4 shrink-0 overflow-x-auto px-4 pb-0.5 pt-2 sm:mx-0 sm:px-0">
      <ol className="relative grid min-w-[720px] grid-cols-10">
        <div className="absolute left-[5%] right-[5%] top-[15px] h-[3px] rounded-full bg-ink/15" />
        <motion.div
          className="absolute left-[5%] top-[15px] h-[3px] w-[90%] origin-left rounded-full bg-ink"
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
                className="group flex flex-col items-center gap-1 rounded-lg px-1 py-0.5 outline-none focus-visible:ring-[3px] focus-visible:ring-sky"
                aria-current={active ? "step" : undefined}
              >
                <motion.span
                  initial={false}
                  animate={{ scale: active ? 1.18 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  className={cn(
                    "relative grid h-[33px] w-[33px] place-items-center rounded-full border-[2.5px] border-ink font-mono text-[11px] font-bold transition-colors",
                    active ? "bg-coral text-ink shadow-hard-sm" : passed ? "bg-ink text-white" : "bg-white text-ink group-hover:bg-sun",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                  {/* remounts in the new circle on every stage change, so it pops */}
                  {active && <Deco name="sparkle" width={17} pop idle="none" className="-right-[11px] -top-[11px]" />}
                </motion.span>
                <span className={cn("flex items-center gap-1 text-xs leading-none text-ink", active ? "font-bold" : "group-hover:underline")}>
                  {active && (
                    <motion.span
                      layoutId="rail-active"
                      aria-hidden="true"
                      className="pointer-events-none block"
                      transition={{ duration: 0.6, ease: EASE }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/illustrations/dot-coral.svg" alt="" width={9} height={9} className="block" />
                    </motion.span>
                  )}
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

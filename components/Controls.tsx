"use client";

import { motion } from "framer-motion";
import { PauseIcon, PlayIcon, PrevIcon, NextIcon, ReplayIcon } from "./icons";

interface Props {
  stage: number;
  total: number;
  playing: boolean;
  duration: number;
  onPrev: () => void;
  onNext: () => void;
  onToggle: () => void;
  onReplay: () => void;
}

const PRESS =
  "border-[2.5px] border-ink shadow-hard transition hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_0_#1A1A1A] active:translate-x-[3px] active:translate-y-[3px] active:shadow-hard-sm";

export function Controls({ stage, total, playing, duration, onPrev, onNext, onToggle, onReplay }: Props) {
  return (
    <div className="relative border-t-[3px] border-ink">
      {/* autoplay progress */}
      <div className="absolute inset-x-0 top-0 h-[5px] overflow-hidden">
        {playing && (
          <motion.div
            key={stage}
            className="h-full bg-coral"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: duration / 1000, ease: "linear" }}
          />
        )}
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <IconBtn label="Previous stage" onClick={onPrev} disabled={stage === 0}><PrevIcon /></IconBtn>
          <button
            onClick={onToggle}
            aria-label={playing ? "Pause" : "Play"}
            className={`grid h-11 w-11 place-items-center rounded-full bg-sun text-ink ${PRESS}`}
          >
            {playing ? <PauseIcon /> : <PlayIcon className="translate-x-[1px]" />}
          </button>
          <IconBtn label="Next stage" onClick={onNext} disabled={stage === total - 1}><NextIcon /></IconBtn>
        </div>
        <span className="whitespace-nowrap rounded-full border-2 border-ink bg-cream px-2.5 py-0.5 font-mono text-[12px] font-bold text-ink">
          {String(stage + 1).padStart(2, "0")} / {total}
        </span>
        <button
          onClick={onReplay}
          className={`flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[15px] font-bold text-ink ${PRESS}`}
        >
          <ReplayIcon className="h-4 w-4" />
          Replay
        </button>
      </div>
    </div>
  );
}

function IconBtn({ children, label, onClick, disabled }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`grid h-10 w-10 place-items-center rounded-full bg-white text-ink ${PRESS} disabled:pointer-events-none disabled:opacity-35 disabled:shadow-none`}
    >
      {children}
    </button>
  );
}

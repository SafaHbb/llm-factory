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

export function Controls({ stage, total, playing, duration, onPrev, onNext, onToggle, onReplay }: Props) {
  return (
    <div className="relative border-t border-line">
      {/* autoplay progress */}
      <div className="absolute inset-x-0 -top-px h-px overflow-hidden">
        {playing && (
          <motion.div
            key={stage}
            className="h-full bg-accent"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: duration / 1000, ease: "linear" }}
          />
        )}
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-1.5">
          <IconBtn label="Previous stage" onClick={onPrev} disabled={stage === 0}><PrevIcon /></IconBtn>
          <button
            onClick={onToggle}
            aria-label={playing ? "Pause" : "Play"}
            className="grid h-10 w-10 place-items-center rounded-full bg-ink text-white shadow-[0_8px_20px_-8px_rgba(28,27,25,0.6)] transition hover:scale-[1.04] active:scale-95"
          >
            {playing ? <PauseIcon /> : <PlayIcon className="translate-x-[1px]" />}
          </button>
          <IconBtn label="Next stage" onClick={onNext} disabled={stage === total - 1}><NextIcon /></IconBtn>
        </div>
        <span className="font-mono text-[11px] text-muted">{String(stage + 1).padStart(2, "0")} / {total}</span>
        <button
          onClick={onReplay}
          className="flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-sm text-ink transition hover:border-ink/30"
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
      className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-ink transition hover:border-ink/30 disabled:opacity-35 disabled:hover:border-line"
    >
      {children}
    </button>
  );
}

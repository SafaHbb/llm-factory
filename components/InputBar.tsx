"use client";

import { MAX_CHARS } from "@/lib/pipeline";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onRun: (v: string) => void;
}

export function InputBar({ value, onChange, onRun }: Props) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-2 lg:max-w-[440px] lg:flex-1">
      <form
        onSubmit={(e) => { e.preventDefault(); onRun(value); }}
        className="flex w-full items-center gap-2 rounded-full border-[3px] border-ink bg-white p-1.5 pl-2 shadow-hard transition-shadow focus-within:shadow-[6px_6px_0_0_#1A1A1A]"
      >
        <input
          value={value}
          maxLength={MAX_CHARS}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type a short sentence"
          aria-label="Sentence to process"
          className="min-w-0 flex-1 bg-transparent px-3 py-1.5 text-[16px] text-ink outline-none placeholder:text-ink/50"
        />
        <span className="hidden font-mono text-[11px] text-ink/70 sm:block">{value.length}/{MAX_CHARS}</span>
        <button
          type="submit"
          disabled={!value.trim()}
          className="rounded-full border-[2.5px] border-ink bg-sun px-5 py-1.5 text-[15px] font-bold text-ink shadow-hard-sm transition hover:-translate-x-px hover:-translate-y-px hover:shadow-hard-md active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:shadow-none"
        >
          Run
        </button>
      </form>
    </div>
  );
}

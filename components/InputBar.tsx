"use client";

import { MAX_CHARS } from "@/lib/pipeline";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onRun: (v: string) => void;
}

export function InputBar({ value, onChange, onRun }: Props) {
  return (
    <div className="flex w-full flex-col gap-2 lg:w-auto lg:items-end">
      <form
        onSubmit={(e) => { e.preventDefault(); onRun(value); }}
        className="flex w-full items-center gap-2 rounded-2xl border border-line bg-white p-1.5 lg:w-[460px] shadow-[0_1px_2px_rgba(28,27,25,0.04),0_16px_36px_-24px_rgba(28,27,25,0.3)] focus-within:border-ink/30"
      >
        <input
          value={value}
          maxLength={MAX_CHARS}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type a short sentence"
          aria-label="Sentence to process"
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[15px] text-ink outline-none placeholder:text-muted/60"
        />
        <span className="hidden font-mono text-[11px] text-muted sm:block">{value.length}/{MAX_CHARS}</span>
        <button
          type="submit"
          disabled={!value.trim()}
          className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink/85 disabled:opacity-40"
        >
          Run
        </button>
      </form>
    </div>
  );
}

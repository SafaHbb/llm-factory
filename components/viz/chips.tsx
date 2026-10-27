"use client";

import { motion } from "framer-motion";
import type { Token, TokenKind } from "@/lib/pipeline";
import { cn } from "@/lib/cn";
import { MORPH } from "@/lib/motion";

export const KIND_STYLE: Record<TokenKind, string> = {
  word: "bg-white border-line",
  subword: "bg-accent-soft border-accent-line",
  punct: "bg-stone-100 border-stone-300 border-dashed",
};

/** Compact token used in the context row of the prediction and generation stages. */
export function ContextChip({ token }: { token: Token }) {
  return (
    <motion.div
      layoutId={`tok-${token.index}`}
      transition={MORPH}
      style={{ borderRadius: 10 }}
      className={cn("border px-2.5 py-1.5", KIND_STYLE[token.kind])}
    >
      <motion.span layout="position" transition={MORPH} className="block whitespace-nowrap text-sm font-medium leading-none text-ink">
        {token.text}
      </motion.span>
    </motion.div>
  );
}

/** A generated token. Shares its layoutId from the prediction panel to the final text. */
export function GenChip({ text, k, fresh = false, latest = true }: { text: string; k: number; fresh?: boolean; latest?: boolean }) {
  return (
    <motion.div
      layoutId={`gen-${k}`}
      transition={MORPH}
      initial={fresh ? { opacity: 0, scale: 0.6, y: -12 } : false}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        backgroundColor: latest ? "#D4622A" : "#FBEDE4",
        borderColor: latest ? "#D4622A" : "#F0C7B0",
        color: latest ? "#FFFFFF" : "#B54E1C",
        boxShadow: latest ? "0 6px 16px -8px rgba(212,98,42,0.8)" : "0 0px 0px 0px rgba(212,98,42,0)",
      }}
      style={{ borderRadius: 10 }}
      className="border px-2.5 py-1.5"
    >
      <motion.span layout="position" transition={MORPH} className="block whitespace-nowrap text-sm font-medium leading-none">
        {text}
      </motion.span>
    </motion.div>
  );
}

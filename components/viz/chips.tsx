"use client";

import { motion } from "framer-motion";
import type { Token, TokenKind } from "@/lib/pipeline";
import { cn } from "@/lib/cn";
import { COLORS, HARD, MORPH } from "@/lib/motion";

/** Whole words white, word pieces pink, punctuation sun. */
export const KIND_STYLE: Record<TokenKind, string> = {
  word: "bg-white border-ink",
  subword: "bg-pink border-ink",
  punct: "bg-sun border-ink",
};

/** Compact token used in the context row of the prediction and generation stages. */
export function ContextChip({ token }: { token: Token }) {
  return (
    <motion.div
      layoutId={`tok-${token.index}`}
      transition={MORPH}
      style={{ borderRadius: 12 }}
      className={cn("border-[2.5px] px-2.5 py-1.5 shadow-hard-md", KIND_STYLE[token.kind])}
    >
      <motion.span layout="position" transition={MORPH} className="block whitespace-nowrap text-sm font-bold leading-none text-ink">
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
        backgroundColor: latest ? COLORS.lilac : COLORS.lilacSoft,
        boxShadow: latest ? HARD.base : HARD.md,
      }}
      style={{ borderRadius: 12 }}
      className="border-[2.5px] border-ink px-2.5 py-1.5 text-ink"
    >
      <motion.span layout="position" transition={MORPH} className="block whitespace-nowrap text-sm font-bold leading-none">
        {text}
      </motion.span>
    </motion.div>
  );
}

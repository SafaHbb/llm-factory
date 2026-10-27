"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import type { Pipeline } from "@/lib/pipeline";
import { spaceBefore } from "@/lib/pipeline";
import { EASE, MORPH } from "@/lib/motion";

export function FinalStage({ pipeline }: { pipeline: Pipeline }) {
  const { tokens, generated } = pipeline;
  return (
    <motion.div
      initial={{ backgroundColor: "rgba(255,255,255,0)", borderColor: "rgba(227,224,216,0)", boxShadow: "0 0px 0px -0px rgba(28,27,25,0)" }}
      animate={{ backgroundColor: "rgba(255,255,255,1)", borderColor: "rgba(227,224,216,1)", boxShadow: "0 28px 56px -28px rgba(28,27,25,0.3)" }}
      transition={{ delay: 0.35, duration: 0.8, ease: EASE }}
      className="w-full max-w-3xl rounded-[28px] border px-8 py-9 sm:px-12 sm:py-12"
    >
      <p className="text-2xl font-medium leading-[1.45] tracking-tight text-ink sm:text-[34px]">
        {tokens.map((t) => (
          <Fragment key={t.index}>
            {spaceBefore(t, tokens) && " "}
            <motion.span layoutId={`tok-${t.index}`} transition={MORPH} className="inline-block text-ink/45">
              {t.text}
            </motion.span>
          </Fragment>
        ))}
        {generated.map((g, k) => (
          <Fragment key={`g${k}`}>
            {g.space && " "}
            <motion.span layoutId={`gen-${k}`} transition={MORPH} className="inline-block text-accent">
              {g.text}
            </motion.span>
          </Fragment>
        ))}
      </p>
    </motion.div>
  );
}

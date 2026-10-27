"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import type { Pipeline } from "@/lib/pipeline";
import { spaceBefore } from "@/lib/pipeline";
import { EASE, HARD, MORPH } from "@/lib/motion";
import { Deco } from "../Deco";

export function FinalStage({ pipeline }: { pipeline: Pipeline }) {
  const { tokens, generated } = pipeline;
  return (
    <motion.div
      initial={{ backgroundColor: "rgba(255,255,255,0)", borderColor: "rgba(26,26,26,0)", boxShadow: HARD.none }}
      animate={{ backgroundColor: "rgba(255,255,255,1)", borderColor: "rgba(26,26,26,1)", boxShadow: HARD.lg }}
      transition={{ delay: 0.35, duration: 0.8, ease: EASE }}
      className="relative w-full max-w-3xl rounded-[24px] border-[3px] px-8 py-9 sm:px-12 sm:py-11"
    >
      {/* celebration */}
      <Deco name="smiley-wavy" width={64} tilt={-10} pop delay={0.9} idle="sway" duration={5} className="-left-7 -top-8 z-10" />
      <Deco name="daisy-sun" width={46} tilt={12} pop delay={1.05} idle="sway" duration={6} className="-bottom-6 -right-5 z-10" />
      <Deco name="sparkle" width={26} pop delay={1.2} idle="float" duration={4} className="-right-3 -top-4 z-10" />
      <Deco name="sparkle" width={18} tilt={15} pop delay={1.32} idle="float" duration={5} className="right-8 -top-6 z-10" />
      <Deco name="sparkle" width={20} tilt={-10} pop delay={1.44} idle="float" duration={4.5} className="-bottom-4 left-10 z-10" />

      <p className="text-2xl font-bold leading-[1.45] tracking-tight text-ink sm:text-[34px]">
        {tokens.map((t) => (
          <Fragment key={t.index}>
            {spaceBefore(t, tokens) && " "}
            <motion.span layoutId={`tok-${t.index}`} transition={MORPH} className="inline-block text-ink">
              {t.text}
            </motion.span>
          </Fragment>
        ))}
        {generated.map((g, k) => (
          <Fragment key={`g${k}`}>
            {g.space && " "}
            <motion.span layoutId={`gen-${k}`} transition={MORPH} className="inline-block text-coral">
              {g.text}
            </motion.span>
          </Fragment>
        ))}
      </p>
    </motion.div>
  );
}

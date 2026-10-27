"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Pipeline } from "@/lib/pipeline";
import { genStepMs } from "@/lib/stages";
import { ContextChip, GenChip } from "./chips";
import { CandidateBars, Connector, ModelBox } from "./ModelParts";
import { COLORS } from "@/lib/motion";

const PICK_AT = 0.6; // fraction of a step spent scoring before the pick

export function GenerationStage({ pipeline }: { pipeline: Pipeline }) {
  const gen = pipeline.generated;
  const n = gen.length;
  const stepMs = genStepMs(n);
  // count = tokens already added; the model is predicting gen[count]
  const [count, setCount] = useState(1);
  const [picked, setPicked] = useState(false);

  useEffect(() => {
    if (count >= n) return;
    const lead = count === 1 ? 400 : 0;
    const a = setTimeout(() => setPicked(true), lead + stepMs * PICK_AT);
    const b = setTimeout(() => { setPicked(false); setCount((c) => c + 1); }, lead + stepMs);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [count, n, stepMs]);

  const done = count >= n;
  const step = gen[count];

  return (
    <div className="flex w-full max-w-xl flex-col items-center">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {pipeline.tokens.map((t) => <ContextChip key={t.index} token={t} />)}
        {gen.slice(0, count).map((g, k) => (
          <GenChip key={k} k={k} text={g.text} latest={!done && k === count - 1} />
        ))}
        {!done && (
          <motion.span
            className="mx-1 h-6 w-[3px] rounded-full bg-coral"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.9, repeat: Infinity }}
          />
        )}
      </div>

      <Connector
        step={1}
        lit={!done}
        active={!done && !picked}
        label={done ? "finished" : <>the whole text, now {pipeline.tokens.length + count} tokens, goes back in</>}
      />
      <ModelBox
        active={!done && !picked}
        sub={done ? `stopped after ${n} new tokens` : `step ${count + 1} of ${n}`}
      />
      <Connector step={2} lit={!done} active={false} label={done ? "end of sentence" : "next token is scored and picked"} />

      <div className="h-[104px] w-full">
        {step && (
          <CandidateBars
            key={count}
            compact
            cands={step.candidates.slice(0, 3)}
            picked={picked}
            renderTop={() => <GenChip k={count} text={step.text} fresh latest={picked} />}
          />
        )}
      </div>

      <div className="mt-2 flex gap-1.5">
        {gen.map((_, k) => (
          <motion.span
            key={k}
            className="h-2.5 w-6 rounded-full border-2 border-ink"
            animate={{ backgroundColor: k < count ? COLORS.coral : COLORS.white }}
            transition={{ duration: 0.4 }}
          />
        ))}
      </div>
    </div>
  );
}

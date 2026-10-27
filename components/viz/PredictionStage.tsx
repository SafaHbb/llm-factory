"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Pipeline } from "@/lib/pipeline";
import { VOCAB_SIZE } from "@/lib/pipeline";
import { ContextChip, GenChip } from "./chips";
import { CandidateBars, Connector, Ghost, ModelBox } from "./ModelParts";

// read -> think -> score -> pick
const PHASE_AT = [900, 1700, 3100];

export function PredictionStage({ pipeline }: { pipeline: Pipeline }) {
  const cands = pipeline.generated[0]?.candidates.slice(0, 4) ?? [];
  const top = cands[0];
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const ts = PHASE_AT.map((ms, i) => setTimeout(() => setPhase(i + 1), ms));
    return () => ts.forEach(clearTimeout);
  }, []);

  const picked = phase >= 3;

  return (
    <div className="flex w-full max-w-xl flex-col items-center">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {pipeline.tokens.map((t) => <ContextChip key={t.index} token={t} />)}
        {picked && top ? (
          <GenChip k={0} text={top.text} />
        ) : (
          <motion.div
            className="grid h-[30px] min-w-[44px] place-items-center rounded-[10px] border border-dashed border-accent bg-accent-soft/60 px-2 font-mono text-sm text-accent"
            animate={{ opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            ?
          </motion.div>
        )}
      </div>

      <Connector step={1} lit active={phase === 0} label={<>reads all {pipeline.tokens.length} tokens</>} />
      <ModelBox active={phase === 1} sub={phase < 1 ? "waiting" : phase === 1 ? "thinking…" : "done"} />
      <Connector
        step={2}
        lit={phase >= 2}
        active={phase === 2}
        label={<>gives every token it knows a score ({VOCAB_SIZE.toLocaleString()})</>}
      />

      <motion.div
        className="w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 2 ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {phase >= 2 && (
          <CandidateBars
            cands={cands}
            picked={picked}
            others={VOCAB_SIZE - cands.length}
            renderTop={() => (picked ? <Ghost text={top.text} /> : <GenChip k={0} text={top.text} latest={false} />)}
          />
        )}
      </motion.div>

      <motion.p
        className="mt-4 flex items-center gap-2 text-[11px] text-ink"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: picked ? 1 : 0, y: picked ? 0 : 4 }}
        transition={{ duration: 0.35 }}
      >
        <span className="grid h-4 w-4 place-items-center rounded-full bg-accent font-mono text-[9px] font-medium text-white">3</span>
        the highest score wins and fills the blank
      </motion.p>
    </div>
  );
}

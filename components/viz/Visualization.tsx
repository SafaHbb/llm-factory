"use client";

import { LayoutGroup } from "framer-motion";
import type { Pipeline } from "@/lib/pipeline";
import { TokenStage } from "./TokenStage";
import { PredictionStage } from "./PredictionStage";
import { GenerationStage } from "./GenerationStage";
import { FinalStage } from "./FinalStage";

interface Props {
  pipeline: Pipeline;
  stage: number;
  focus: number;
  onFocus: (i: number) => void;
}

/** All stages live under one LayoutGroup so tokens keep their identity as they morph. */
export function Visualization({ pipeline, stage, focus, onFocus }: Props) {
  return (
    <LayoutGroup>
      {stage <= 6 && <TokenStage pipeline={pipeline} stage={stage} focus={focus} onFocus={onFocus} />}
      {stage === 7 && <PredictionStage pipeline={pipeline} />}
      {stage === 8 && <GenerationStage pipeline={pipeline} />}
      {stage === 9 && <FinalStage pipeline={pipeline} />}
    </LayoutGroup>
  );
}

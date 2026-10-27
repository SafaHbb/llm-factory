"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useRef } from "react";
import type { Pipeline, Token } from "@/lib/pipeline";
import { cn } from "@/lib/cn";
import { COLORS, HARD, MORPH } from "@/lib/motion";
import { CountUp } from "./CountUp";
import { AttentionArcs } from "./AttentionArcs";
import { EmbedMap } from "./EmbedMap";
import { KIND_STYLE } from "./chips";

interface Props {
  pipeline: Pipeline;
  stage: number; // 0..6
  focus: number;
  onFocus: (i: number) => void;
}

export function TokenStage(props: Props) {
  if (props.stage === 4 || props.stage === 5) return <EmbedMap pipeline={props.pipeline} stage={props.stage} />;
  return <TokenRow {...props} />;
}

const SHELL_ON = {
  backgroundColor: "rgba(255,255,255,1)",
  borderColor: "rgba(26,26,26,1)",
  boxShadow: HARD.lg,
};
const SHELL_OFF = {
  backgroundColor: "rgba(255,255,255,0)",
  borderColor: "rgba(26,26,26,0)",
  boxShadow: HARD.none,
};

function groupLook(stage: number) {
  if (stage === 1)
    return {
      backgroundColor: "rgba(255,255,255,1)",
      borderColor: "rgba(26,26,26,1)",
      boxShadow: HARD.base,
    };
  if (stage === 2)
    return {
      backgroundColor: "rgba(255,255,255,0)",
      borderColor: "rgba(26,26,26,0.45)",
      boxShadow: HARD.none,
    };
  return {
    backgroundColor: "rgba(255,255,255,0)",
    borderColor: "rgba(26,26,26,0)",
    boxShadow: HARD.none,
  };
}

function TokenRow({ pipeline, stage, focus, onFocus }: Props) {
  const { words, tokens } = pipeline;
  const shellRef = useRef<HTMLDivElement>(null);
  const tokenRefs = useRef(new Map<number, HTMLElement>());
  const setRef = useCallback(
    (i: number) => (el: HTMLElement | null) => {
      if (el) tokenRefs.current.set(i, el);
      else tokenRefs.current.delete(i);
    },
    [],
  );

  const rowGap =
    stage === 0 ? "gap-x-[10px] gap-y-1 sm:gap-x-[13px]"
    : stage === 1 ? "gap-3 sm:gap-4"
    : "gap-x-3 gap-y-10 sm:gap-x-4";

  return (
    <div className={cn("flex w-full flex-col items-center", stage === 6 && "pt-20")}>
      <motion.div
        layoutId="shell"
        ref={shellRef}
        transition={MORPH}
        style={{ borderRadius: 24 }}
        className={cn("relative z-10 max-w-full border-[3px]", stage === 0 ? "px-8 py-8 sm:px-12 sm:py-10" : "p-0")}
        animate={stage === 0 ? SHELL_ON : SHELL_OFF}
      >
        <div className={cn("flex flex-wrap items-center justify-center", rowGap)}>
          {words.map((w) => (
            <motion.div
              key={w.index}
              layoutId={`word-${w.index}`}
              transition={MORPH}
              style={{ borderRadius: stage === 2 ? 14 : 16 }}
              animate={groupLook(stage)}
              className={cn(
                "flex items-center border-[2.5px]",
                stage === 1 && "px-5 py-3",
                stage === 2 && "gap-1.5 border-dashed p-1.5",
                stage >= 3 && "gap-1.5",
              )}
            >
              {stage <= 1 ? (
                <motion.span
                  layoutId={`tok-${w.tokens[0]}`}
                  transition={MORPH}
                  className={cn(
                    "inline-block whitespace-nowrap font-bold leading-none tracking-tight text-ink",
                    stage === 0 ? "text-3xl sm:text-[40px]" : "text-2xl sm:text-[28px]",
                  )}
                >
                  {w.text}
                </motion.span>
              ) : (
                w.tokens.map((ti, k) => (
                  <TokenCard
                    key={ti}
                    token={tokens[ti]}
                    stage={stage}
                    firstInWord={k === 0}
                    focus={focus}
                    onFocus={onFocus}
                    refCb={setRef(ti)}
                  />
                ))
              )}
            </motion.div>
          ))}
        </div>

        {stage === 6 && (
          <AttentionArcs
            containerRef={shellRef}
            tokenRefs={tokenRefs}
            count={tokens.length}
            focus={focus}
            weights={pipeline.attention[focus] ?? []}
          />
        )}
      </motion.div>

      {/* raw characters strip */}
      <AnimatePresence>
        {stage === 0 && (
          <motion.div
            key="chars"
            className="mt-8 flex max-w-full flex-wrap justify-center gap-1"
            exit={{ opacity: 0, y: 6, transition: { duration: 0.25 } }}
          >
            {pipeline.input.split("").map((ch, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.018, duration: 0.3 }}
                className="grid h-6 w-[18px] place-items-center rounded-[5px] border-2 border-ink bg-white font-mono text-[10px] text-ink shadow-hard-sm"
              >
                {ch === " " ? "·" : ch}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface CardProps {
  token: Token;
  stage: number;
  firstInWord: boolean;
  focus: number;
  onFocus: (i: number) => void;
  refCb: (el: HTMLElement | null) => void;
}

function TokenCard({ token: t, stage, firstInWord, focus, onFocus, refCb }: CardProps) {
  const isAttn = stage === 6;
  const isFocus = isAttn && t.index === focus;
  const future = isAttn && t.index > focus;

  return (
    <motion.div
      layoutId={`tok-${t.index}`}
      ref={refCb}
      transition={MORPH}
      initial={firstInWord || stage !== 2 ? false : { opacity: 0, x: -14 }}
      animate={{
        opacity: future ? 0.3 : 1,
        x: 0,
        y: isFocus ? -3 : 0,
        boxShadow: isFocus
          ? `0 0 0 3px ${COLORS.coral}, 6px 6px 0 3px ${COLORS.ink}`
          : `0 0 0 0px rgba(242,123,91,0), 4px 4px 0 0px ${COLORS.ink}`,
      }}
      onClick={isAttn ? () => onFocus(t.index) : undefined}
      style={{ borderRadius: 12 }}
      className={cn(
        "relative flex flex-col items-center border-[2.5px] px-3.5 py-2",
        KIND_STYLE[t.kind],
        isAttn && "cursor-pointer",
      )}
    >
      <motion.span layout="position" transition={MORPH} className="whitespace-nowrap text-lg font-bold leading-none text-ink">
        {t.text}
      </motion.span>

      {stage === 3 && (
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 + t.index * 0.06, duration: 0.4 }}
          className="mt-2 border-t-2 border-dashed border-ink pt-1 font-mono text-xs text-ink"
        >
          <CountUp to={t.id} delay={0.4 + t.index * 0.06} />
        </motion.span>
      )}
    </motion.div>
  );
}

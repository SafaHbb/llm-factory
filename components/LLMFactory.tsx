"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildPipeline, DEFAULT_TEXT, withGeneration, type Pipeline, type RawStep } from "@/lib/pipeline";
import { STAGES, stageDuration } from "@/lib/stages";
import { cn } from "@/lib/cn";
import { EASE } from "@/lib/motion";
import { Deco, Sticker, type StickerColor } from "./Deco";
import { InputBar } from "./InputBar";
import { StageRail } from "./StageRail";
import { Controls } from "./Controls";
import { Visualization } from "./viz/Visualization";

const LAST = STAGES.length - 1;

interface ModelStatus {
  state: "checking" | "ready" | "thinking" | "offline";
  model?: string;
  real?: boolean;
  error?: string;
}

export default function LLMFactory() {
  const [draft, setDraft] = useState(DEFAULT_TEXT);
  const [pipeline, setPipeline] = useState(() => buildPipeline(DEFAULT_TEXT));
  const [runId, setRunId] = useState(0);
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [focus, setFocus] = useState(pipeline.defaultFocus);
  const [moving, setMoving] = useState(false);
  const [model, setModel] = useState<ModelStatus>({ state: "checking" });
  const request = useRef(0);

  // Ask the local model to continue the sentence; keep the simulated text if it is unavailable.
  const generate = useCallback(async (p: Pipeline) => {
    const id = ++request.current;
    setModel((m) => ({ ...m, state: "thinking" }));
    try {
      const res = await fetch("/api/generate", { method: "POST", body: JSON.stringify({ text: p.input }) });
      const data: { model?: string; real?: boolean; steps?: RawStep[]; error?: string } = await res.json();
      if (!res.ok || !data.steps) throw new Error(data.error ?? "no output");
      if (id !== request.current) return;
      setPipeline((cur) => (cur.input === p.input ? withGeneration(cur, data.steps!) : cur));
      setModel({ state: "ready", model: data.model, real: data.real });
    } catch (e) {
      if (id === request.current) setModel((m) => ({ ...m, state: "offline", error: String(e) }));
    }
  }, []);

  useEffect(() => {
    fetch("/api/generate")
      .then((r) => r.json())
      .then((d: { ok: boolean; model: string; error?: string }) => {
        setModel(d.ok ? { state: "ready", model: d.model } : { state: "offline", model: d.model, error: d.error });
        if (d.ok) generate(buildPipeline(DEFAULT_TEXT));
      })
      .catch(() => setModel({ state: "offline", error: "API route unavailable" }));
  }, [generate]);

  const duration = useMemo(() => stageDuration(stage, pipeline.generated.length, pipeline.tokens.length), [stage, pipeline]);

  // autoplay
  useEffect(() => {
    if (!playing) return;
    if (stage >= LAST) { setPlaying(false); return; }
    const t = setTimeout(() => setStage((s) => Math.min(s + 1, LAST)), duration);
    return () => clearTimeout(t);
  }, [playing, stage, duration]);

  // conveyor belt runs briefly on every stage change
  useEffect(() => {
    setMoving(true);
    const t = setTimeout(() => setMoving(false), 1200);
    return () => clearTimeout(t);
  }, [stage, runId]);

  const run = useCallback((text: string) => {
    const p = buildPipeline(text);
    if (!p.tokens.length) return;
    setPipeline(p);
    setFocus(p.defaultFocus);
    setRunId((r) => r + 1);
    setStage(0);
    setPlaying(true);
    generate(p);
  }, [generate]);

  const go = useCallback((i: number) => {
    setPlaying(false);
    setStage(Math.max(0, Math.min(LAST, i)));
  }, []);

  const toggle = useCallback(() => {
    setPlaying((p) => {
      if (!p && stage >= LAST) { setStage(0); setRunId((r) => r + 1); }
      return !p;
    });
  }, [stage]);

  const replay = useCallback(() => {
    setRunId((r) => r + 1);
    setFocus(pipeline.defaultFocus);
    setStage(0);
    setPlaying(true);
  }, [pipeline]);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") go(stage + 1);
      else if (e.key === "ArrowLeft") go(stage - 1);
      else if (e.key === " ") { e.preventDefault(); toggle(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, go, toggle]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex h-[100dvh] min-h-[660px] flex-col overflow-hidden bg-cream">
        <div className="h-2 shrink-0 border-b-[3px] border-ink bg-pink" />

        {/* header band */}
        <header className="relative shrink-0 border-b-[3px] border-ink bg-sky">
          <div className="relative mx-auto flex max-w-[1100px] items-center gap-8 px-4 py-4 sm:px-6 lg:py-[clamp(10px,1.8vh,24px)]">
            <div className="relative min-w-0 flex-1">
              <Deco name="daisy-pink" width={42} tilt={10} idle="sway" duration={7} className="-top-[18px] left-[150px] z-10 hidden sm:block lg:left-[clamp(130px,19vh,175px)]" />
              <h1 className="display-title relative text-[40px] leading-[0.9] tracking-[1px] [word-spacing:0.1em] lg:text-[clamp(44px,7vh,70px)]">
                <span className="text-pink">Safa&apos;s</span> <span className="text-sun">LLM</span> <span className="text-white">Factory</span>
              </h1>
              <div className="mt-3 flex flex-col gap-3 lg:mt-[clamp(8px,1.4vh,14px)] lg:flex-row lg:items-center lg:gap-5">
                <div className="flex shrink-0 items-center gap-3">
                  <Sticker color="pink" tilt={-3}>watch a sentence think</Sticker>
                  <ModelPill status={model} />
                </div>
                <InputBar value={draft} onChange={setDraft} onRun={run} />
              </div>
            </div>

            {/* header illustrations */}
            <div className="relative hidden h-[clamp(96px,14vh,130px)] w-[270px] shrink-0 xl:block">
              <Deco name="rainbow" width={170} idle="float" duration={7} className="right-[18px] top-[calc(50%-54px)]" />
              <Deco name="smiley-laugh" width={62} tilt={-12} idle="sway" duration={5} className="-top-1 left-0" />
              <Deco name="sparkle" width={30} idle="sway" duration={4} delay={0.6} className="bottom-0 left-[16px]" />
              <Deco name="star" width={22} idle="spin" duration={8} className="-right-2 bottom-1" />
            </div>
          </div>
        </header>

        {/* page */}
        <div className="relative mx-auto flex min-h-0 w-full max-w-[1100px] flex-1 flex-col gap-2 px-4 pb-5 pt-2 sm:px-6 lg:gap-[clamp(8px,1.4vh,16px)] lg:pt-[clamp(8px,1.4vh,16px)]">
          <StageRail stage={stage} onSelect={go} />

          {/* canvas */}
          <section className="relative flex min-h-0 flex-1 flex-col rounded-[24px] border-[3px] border-ink bg-white shadow-hard-lg">
            <Deco name="dot-coral" width={26} idle="none" className="-right-[13px] -top-[13px] z-30" />
            <div className="hidden xl:block">
              <Deco name="daisy-sun" width={56} tilt={-15} idle="sway" duration={6} className="-right-[84px] top-[30%]" />
              <Deco name="loop-arrow" width={104} flip tilt={-8} idle="float" duration={5} className="-right-[112px] bottom-[110px]" />
              <Deco name="daisy-mint" width={50} idle="sway" duration={7} delay={0.4} className="-left-[78px] bottom-0" />
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[21px]">
              <div className="flex items-center gap-3 px-5 pt-3 sm:px-6">
                <span
                  className={cn(
                    "h-3 w-3 shrink-0 rounded-full border-2 border-ink transition-colors",
                    moving ? "animate-pulse bg-coral" : "bg-mint",
                  )}
                />
                <AnimatePresence mode="wait">
                  <motion.p
                    key={stage}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="flex min-w-0 items-center gap-3 text-[15px] leading-snug text-ink"
                  >
                    <Sticker color={STICKER_CYCLE[stage % STICKER_CYCLE.length]} tilt={stage % 2 ? 2 : -2} className="shrink-0">
                      {String(stage + 1).padStart(2, "0")} · {STAGES[stage].title.toLowerCase()}
                    </Sticker>
                    <span className="min-w-0">{STAGES[stage].line}</span>
                  </motion.p>
                </AnimatePresence>
              </div>

              <div className="canvas-grid relative flex min-h-0 flex-1 items-center justify-center px-4 py-3 sm:px-8">
                <Visualization key={runId} pipeline={pipeline} stage={stage} focus={focus} onFocus={setFocus} />
              </div>

              <div className="flex items-center gap-2 px-5 pb-2 sm:px-6">
                <Roller moving={moving} />
                <div className="relative h-3 flex-1 overflow-hidden rounded-full border-2 border-ink bg-sun">
                  <div className={cn("belt absolute inset-0 opacity-80", moving && "belt-moving")} />
                </div>
                <Roller moving={moving} />
              </div>

              <Controls
                stage={stage}
                total={STAGES.length}
                playing={playing}
                duration={duration}
                onPrev={() => go(stage - 1)}
                onNext={() => go(stage + 1)}
                onToggle={toggle}
                onReplay={replay}
              />
            </div>
          </section>
        </div>

        <Deco name="burst" width={92} tilt={8} idle="spin" duration={8} className="bottom-3 right-3 hidden xl:block" />
      </div>
    </MotionConfig>
  );
}

const STICKER_CYCLE: StickerColor[] = ["sky", "sun", "pink", "lilac", "mint", "coral"];

function ModelPill({ status }: { status: ModelStatus }) {
  const { state, model, real, error } = status;
  const name = model?.replace(/:latest$/, "") ?? "model";
  const label = state === "offline" ? "Ollama offline" : "Ollama";
  return (
    <Sticker
      color={state === "ready" ? "mint" : state === "offline" ? "white" : "sun"}
      tilt={2}
      title={state === "offline" ? error : `${name}${state === "thinking" ? " is writing…" : real === false ? " · simulated scores" : ""}`}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full border-[1.5px] border-ink",
          state === "ready" ? "bg-white" : state === "offline" ? "bg-ink" : "animate-pulse bg-coral",
        )}
      />
      {label}
    </Sticker>
  );
}

function Roller({ moving }: { moving: boolean }) {
  return (
    <motion.span
      className="grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 border-ink bg-white"
      animate={moving ? { rotate: 360 } : { rotate: 0 }}
      transition={moving ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
    >
      <span className="h-[6px] w-[2px] bg-ink" />
    </motion.span>
  );
}

"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildPipeline, EXAMPLES, withGeneration, type Pipeline, type RawStep } from "@/lib/pipeline";
import { STAGES, stageDuration } from "@/lib/stages";
import { cn } from "@/lib/cn";
import { EASE } from "@/lib/motion";
import { LogoMark } from "./icons";
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
  const [draft, setDraft] = useState(EXAMPLES[0]);
  const [pipeline, setPipeline] = useState(() => buildPipeline(EXAMPLES[0]));
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
        if (d.ok) generate(buildPipeline(EXAMPLES[0]));
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
      <div className="mx-auto flex h-[100dvh] min-h-[660px] max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        {/* top bar */}
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <LogoMark />
            <span className="text-[15px] font-semibold tracking-tight text-ink">LLM Factory</span>
            <ModelPill status={model} />
          </div>
          <InputBar value={draft} current={pipeline.input} onChange={setDraft} onRun={run} />
        </header>

        <StageRail stage={stage} onSelect={go} />

        {/* canvas */}
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-line bg-panel shadow-[0_1px_2px_rgba(28,27,25,0.04),0_40px_80px_-48px_rgba(28,27,25,0.35)]">
          <div className="flex items-center gap-3 px-5 pt-4 sm:px-6">
            <span className={cn("h-2 w-2 shrink-0 rounded-full transition-colors", moving ? "animate-pulse bg-accent" : "bg-emerald-500/70")} />
            <AnimatePresence mode="wait">
              <motion.p
                key={stage}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="text-sm"
              >
                <span className="font-medium text-ink">{STAGES[stage].title}</span>
                <span className="text-muted"> · {STAGES[stage].line}</span>
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="canvas-grid relative flex min-h-0 flex-1 items-center justify-center px-4 py-6 sm:px-8">
            <Visualization key={runId} pipeline={pipeline} stage={stage} focus={focus} onFocus={setFocus} />
          </div>

          <div className="flex items-center gap-2 px-5 pb-3 sm:px-6">
            <Roller moving={moving} />
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-line/70">
              <div className={cn("belt absolute inset-0", moving && "belt-moving")} />
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
        </section>
      </div>
    </MotionConfig>
  );
}

function ModelPill({ status }: { status: ModelStatus }) {
  const { state, model, real, error } = status;
  const name = model?.replace(/:latest$/, "") ?? "model";
  const label =
    state === "checking" ? "connecting to Ollama…"
    : state === "thinking" ? `${name} is writing…`
    : state === "ready" ? (real === false ? `${name} · live text, simulated scores` : `${name} · live`)
    : "simulated (Ollama offline)";
  return (
    <span
      title={state === "offline" ? error : undefined}
      className="flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-[11px] text-muted"
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          state === "ready" ? "bg-emerald-500" : state === "offline" ? "bg-stone-400" : "animate-pulse bg-accent",
        )}
      />
      {label}
    </span>
  );
}

function Roller({ moving }: { moving: boolean }) {
  return (
    <motion.span
      className="grid h-4 w-4 place-items-center rounded-full border border-ink/20 bg-white"
      animate={moving ? { rotate: 360 } : { rotate: 0 }}
      transition={moving ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
    >
      <span className="h-[6px] w-px bg-ink/40" />
    </motion.span>
  );
}

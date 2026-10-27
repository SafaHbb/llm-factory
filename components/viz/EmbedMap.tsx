"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Pipeline, Token } from "@/lib/pipeline";
import { STOP } from "@/lib/pipeline";
import { cn } from "@/lib/cn";
import { COLORS, EASE, HARD, MORPH } from "@/lib/motion";
import { KIND_STYLE } from "./chips";

type Cluster = "content" | "small" | "piece" | "punct";

// Each cluster lives in one quadrant of the "meaning map".
const CLUSTERS: Record<Cluster, { x: number; y: number; label: string; fill: string; blob: string; corner: string }> = {
  content: { x: 27, y: 38, label: "meaning words", fill: COLORS.mint, blob: "58% 42% 55% 45% / 52% 60% 40% 48%", corner: "left-5 top-4" },
  small: { x: 73, y: 38, label: "small words", fill: COLORS.sky, blob: "45% 55% 40% 60% / 60% 45% 55% 40%", corner: "right-5 top-4 text-right" },
  piece: { x: 27, y: 74, label: "word pieces", fill: COLORS.lilac, blob: "52% 48% 62% 38% / 45% 55% 45% 55%", corner: "left-5 bottom-4" },
  punct: { x: 73, y: 74, label: "punctuation", fill: COLORS.mint, blob: "40% 60% 48% 52% / 55% 42% 58% 45%", corner: "right-5 bottom-4 text-right" },
};

function clusterOf(t: Token): Cluster {
  if (t.kind === "punct") return "punct";
  if (t.kind === "subword") return "piece";
  return STOP.has(t.text.toLowerCase()) ? "small" : "content";
}

interface Placed {
  token: Token;
  x: number; // %
  y: number; // %
  dup: number; // how many identical tokens came before (stacked)
  cluster: Cluster;
}

/** Same word, same place: identical tokens share a spot on the map. */
function place(tokens: Token[]): Placed[] {
  const slots = new Map<string, { x: number; y: number; count: number }>();
  const perCluster: Record<Cluster, number> = { content: 0, small: 0, piece: 0, punct: 0 };
  return tokens.map((t) => {
    const c = clusterOf(t);
    const key = t.text.toLowerCase();
    let slot = slots.get(key);
    if (!slot) {
      const k = perCluster[c]++;
      const angle = k * 2.4 + 0.6;
      const r = k === 0 ? 0 : 8 + 4 * Math.sqrt(k);
      const base = CLUSTERS[c];
      slot = {
        x: Math.max(10, Math.min(90, base.x + Math.cos(angle) * r * 1.1)),
        y: Math.max(14, Math.min(88, base.y + Math.sin(angle) * r * 1.5)),
        count: 0,
      };
      slots.set(key, slot);
    }
    const dup = slot.count++;
    return { token: t, x: slot.x, y: slot.y, dup, cluster: c };
  });
}

export function EmbedMap({ pipeline, stage }: { pipeline: Pipeline; stage: number }) {
  const placed = place(pipeline.tokens);
  const showOrder = stage === 5;
  const used = new Set(placed.map((p) => p.cluster));
  // Curved hops between consecutive tokens, bowed sideways so they skirt other chips.
  const route = placed
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const a = placed[i - 1];
      const dx = p.x - a.x;
      const dy = p.y - a.y;
      const bow = i % 2 === 0 ? 0.12 : -0.12;
      const cx = (a.x + p.x) / 2 - dy * bow;
      const cy = (a.y + p.y) / 2 + dx * bow;
      return `Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${p.x} ${p.y}`;
    })
    .join(" ");

  return (
    <motion.div
      initial={{ backgroundColor: "rgba(255,255,255,0)", borderColor: "rgba(26,26,26,0)", boxShadow: HARD.none }}
      animate={{ backgroundColor: "rgba(255,255,255,1)", borderColor: "rgba(26,26,26,1)", boxShadow: HARD.base }}
      transition={{ duration: 0.6, ease: EASE }}
      className="relative h-[min(340px,100%)] min-h-[260px] w-full max-w-[720px] rounded-[24px] border-[3px]"
    >
      {/* axes */}
      <div className="pointer-events-none absolute inset-x-8 top-1/2 border-t-2 border-dashed border-ink/25" />
      <div className="pointer-events-none absolute inset-y-8 left-1/2 border-l-2 border-dashed border-ink/25" />

      {/* cluster blobs and labels */}
      {(Object.keys(CLUSTERS) as Cluster[]).map((c) => {
        const cl = CLUSTERS[c];
        const active = used.has(c);
        return (
          <div key={c}>
            <motion.div
              className="pointer-events-none absolute h-0 w-0"
              style={{ left: `${cl.x}%`, top: `${cl.y}%` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: active ? (showOrder ? 0.5 : 1) : 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <div
                className="absolute -left-[100px] -top-[50px] h-[100px] w-[200px] border-[2.5px] border-ink"
                style={{ background: cl.fill, borderRadius: cl.blob }}
              />
            </motion.div>
            <motion.span
              className={cn("absolute font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink", cl.corner)}
              initial={{ opacity: 0 }}
              animate={{ opacity: active ? 1 : 0.35 }}
              transition={{ delay: 0.5 }}
            >
              {cl.label}
            </motion.span>
          </div>
        );
      })}

      {/* order route */}
      <AnimatePresence>
        {showOrder && (
          <motion.svg
            key="route"
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            exit={{ opacity: 0 }}
          >
            <motion.path
              d={route}
              fill="none"
              stroke={COLORS.ink}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeOpacity={0.85}
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.25, duration: 0.15 * placed.length + 0.3, ease: "easeInOut" }}
            />
          </motion.svg>
        )}
      </AnimatePresence>

      {/* tokens */}
      {placed.map(({ token: t, x, y, dup }) => (
        <div
          key={t.index}
          className="absolute flex h-0 w-0 items-center justify-center"
          style={{ left: `calc(${x}% + ${dup * 10}px)`, top: `calc(${y}% + ${dup * 10}px)`, zIndex: 10 + dup }}
        >
          <motion.div
            layoutId={`tok-${t.index}`}
            transition={MORPH}
            style={{ borderRadius: 12 }}
            className={cn(
              "relative shrink-0 border-[2.5px] px-2.5 py-1.5 shadow-hard-md",
              KIND_STYLE[t.kind],
            )}
          >
            <motion.span layout="position" transition={MORPH} className="block whitespace-nowrap text-sm font-bold leading-none text-ink">
              {t.text}
            </motion.span>
            <AnimatePresence>
              {showOrder && (
                <motion.span
                  key="n"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ delay: 0.3 + t.index * 0.15, duration: 0.3, ease: EASE }}
                  className="absolute -left-3 -top-3 grid h-[22px] min-w-[22px] place-items-center rounded-full border-2 border-ink bg-coral px-1 font-mono text-[10px] font-bold text-ink"
                >
                  {t.index + 1}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      ))}
    </motion.div>
  );
}

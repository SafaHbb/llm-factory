"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { COLORS, EASE } from "@/lib/motion";

interface Pt { x: number; y: number }

interface Props {
  containerRef: RefObject<HTMLDivElement | null>;
  tokenRefs: RefObject<Map<number, HTMLElement>>;
  count: number;
  focus: number;
  weights: number[];
}

/**
 * Draws weighted arcs from the focus token back to every earlier token.
 * Positions are measured after the layout morph has settled.
 */
export function AttentionArcs({ containerRef, tokenRefs, count, focus, weights }: Props) {
  const [pts, setPts] = useState<Pt[] | null>(null);
  const ready = useRef(false);

  const measure = useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    const cr = c.getBoundingClientRect();
    const next: Pt[] = [];
    for (let i = 0; i < count; i++) {
      const el = tokenRefs.current?.get(i);
      if (!el) { next.push({ x: 0, y: 0 }); continue; }
      const r = el.getBoundingClientRect();
      next.push({ x: r.left - cr.left + r.width / 2, y: r.top - cr.top });
    }
    setPts(next);
  }, [containerRef, tokenRefs, count]);

  useEffect(() => {
    const t = setTimeout(() => { ready.current = true; measure(); }, 650);
    const ro = new ResizeObserver(() => { if (ready.current) measure(); });
    if (containerRef.current) ro.observe(containerRef.current);
    const onResize = () => ready.current && measure();
    window.addEventListener("resize", onResize);
    return () => { clearTimeout(t); ro.disconnect(); window.removeEventListener("resize", onResize); };
  }, [measure, containerRef]);

  if (!pts || !pts[focus]) return null;

  const f = pts[focus];
  const visible = weights.slice(0, focus + 1);
  const arcs = visible.map((w, j) => ({ w, j })).filter((a) => a.j !== focus);
  const max = Math.max(...arcs.map((a) => a.w), 0.0001);
  const strongest = [...arcs].sort((a, b) => b.w - a.w).slice(0, 3).map((a) => a.j);

  return (
    <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible">
      {arcs.map(({ w, j }, k) => {
        const p = pts[j];
        const dx = Math.abs(f.x - p.x);
        const lift = 30 + Math.min(110, dx * 0.32);
        const mx = (f.x + p.x) / 2;
        const my = Math.min(f.y, p.y) - lift;
        const d = `M ${f.x} ${f.y - 4} Q ${mx} ${my} ${p.x} ${p.y - 4}`;
        const rel = w / max;
        return (
          <g key={`${focus}-${j}`}>
            <motion.path
              d={d}
              fill="none"
              stroke={COLORS.ink}
              strokeLinecap="round"
              strokeWidth={1.5 + rel * 5.5}
              strokeOpacity={0.3 + rel * 0.7}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, delay: 0.04 * k, ease: EASE }}
            />
            {strongest.includes(j) && (
              <circle r={3.5 + rel * 1.5} fill={COLORS.sun} stroke={COLORS.ink} strokeWidth={1.5}>
                <animateMotion
                  dur={`${1.5 + k * 0.08}s`}
                  repeatCount="indefinite"
                  path={d}
                  keyPoints="1;0"
                  keyTimes="0;1"
                  calcMode="linear"
                />
              </circle>
            )}
            <motion.circle
              cx={p.x}
              cy={p.y - 4}
              r={3}
              fill={COLORS.ink}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 + rel * 0.6 }}
              transition={{ delay: 0.6 + 0.04 * k }}
            />
          </g>
        );
      })}
      <motion.circle
        key={`f-${focus}`}
        cx={f.x}
        cy={f.y - 4}
        fill={COLORS.coral}
        stroke={COLORS.ink}
        strokeWidth={2}
        initial={{ r: 0 }}
        animate={{ r: 6 }}
        transition={{ duration: 0.4, ease: EASE }}
      />
    </svg>
  );
}

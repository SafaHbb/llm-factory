import type { Transition } from "framer-motion";

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Shared transition for every element that morphs between stages. */
export const MORPH: Transition = {
  layout: { duration: 0.6, ease: EASE },
  duration: 0.35,
  ease: EASE,
};

export const COLORS = {
  ink: "#1C1B19",
  line: "#E3E0D8",
  accent: "#D4622A",
  steel: "#3A6B8C",
};

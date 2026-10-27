import type { Transition } from "framer-motion";

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Shared transition for every element that morphs between stages. */
export const MORPH: Transition = {
  layout: { duration: 0.6, ease: EASE },
  duration: 0.35,
  ease: EASE,
};

/** Bouncy pop for decorative stickers. */
export const POP: Transition = { type: "spring", stiffness: 420, damping: 14 };

export const COLORS = {
  ink: "#1A1A1A",
  cream: "#F4F2EE",
  sky: "#8ED1EE",
  sun: "#FFD84D",
  pink: "#F7A8D8",
  lilac: "#A88BEB",
  lilacSoft: "#E3D9FA",
  mint: "#9EE493",
  coral: "#F27B5B",
  white: "#FFFFFF",
};

/** Hard offset shadows; framer animates between them, so they share one shape. */
export const HARD = {
  none: "0px 0px 0px 0px rgba(26,26,26,0)",
  sm: "2px 2px 0px 0px #1A1A1A",
  md: "3px 3px 0px 0px #1A1A1A",
  base: "4px 4px 0px 0px #1A1A1A",
  lg: "8px 8px 0px 0px #1A1A1A",
};

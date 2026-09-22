import type { Variants } from "framer-motion";

/*
 * Pen-plotter motion vocabulary (DESIGN.md §8): directional, precise,
 * never bouncy. One curve, 200ms standard, 400ms entrances. Kept in a
 * lib file so component files stay fast-refresh friendly.
 */

export const EASE_PLOTTER: [number, number, number, number] = [0.4, 0, 0.2, 1];

/* Enter/exit for micro-interactions and overlays. */
export const popIn: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: EASE_PLOTTER },
  },
  exit: {
    opacity: 0,
    y: 4,
    transition: { duration: 0.15, ease: EASE_PLOTTER },
  },
};

/* Staggered section entrance — rows settle with a 4px rise + fade. */
export const staggerIn: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_PLOTTER } },
};

/* Pen-plotter draw-in: rules and card edges draw from the left. */
export const drawInX: Variants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.4, ease: EASE_PLOTTER } },
};

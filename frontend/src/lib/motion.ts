import type { Variants } from "framer-motion";

/*
 * Wise motion vocabulary (DESIGN.md §9 + spec §9): strong ease-out
 * entrances (0.25s), iOS-like drawer curve, hover stays CSS-side at
 * 150ms. Reduced-motion collapse handled globally in index.css.
 */

export const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
export const EASE_DRAWER: [number, number, number, number] = [0.32, 0.72, 0, 1];

/** @deprecated Wise world — use EASE_OUT. Kept until Task 9 migrates consumers. */
export const EASE_PLOTTER = EASE_OUT;

/* Enter/exit for micro-interactions and overlays. */
export const popIn: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    y: 4,
    transition: { duration: 0.15, ease: EASE_OUT },
  },
};

/* Staggered section entrance — rows settle with a rise + fade. */
export const staggerIn: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE_OUT } },
};

/* Card-edge draw-in, kept as the chart "drawing itself" gesture. */
export const drawInX: Variants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.4, ease: EASE_OUT } },
};

/* Drawer sheet — iOS-like curve, exit reverses the path. */
export const drawerVariants: Variants = {
  hidden: { x: "100%" },
  visible: { x: 0, transition: { duration: 0.28, ease: EASE_DRAWER } },
  exit: { x: "100%", transition: { duration: 0.24, ease: EASE_DRAWER } },
};

export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

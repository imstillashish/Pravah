import React, { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cx } from "../lib/cn";

/**
 * Sparkline variants for the Sea-Glass world (DESIGN.md §5): forecast
 * Glass-400, actual Sea-700, negative Coral-500 — differentiated by
 * lightness + weight, never hue alone.
 */
export type ChartVariant = "actual" | "forecast" | "negative";

export interface AnimatedSvgChartProps {
  variant?: ChartVariant;
  height?: number | string;
  className?: string;
  linePath?: string;
  areaPath?: string;
}

interface VariantConfig {
  stroke: string;
  strokeWidth: number;
  gradientColor: string;
  gradientOpacity: number;
  defaultLinePath: string;
  defaultAreaPath: string;
}

/* Area washes are Glass/Coral tints fading to transparent. */
const VARIANT_CONFIGS: Record<ChartVariant, VariantConfig> = {
  /* Actual — benchmark/steady series */
  actual: {
    stroke: "#0a5c49", // Sea-700 — 7.95:1 on card
    strokeWidth: 1.5,
    gradientColor: "#dcf3ea", // Glass-100 wash
    gradientOpacity: 0.3,
    defaultLinePath:
      "M0,180 C80,150 165,190 260,130 C345,75 430,165 520,110 C580,75 620,130 653,85",
    defaultAreaPath:
      "M0,180 C80,150 165,190 260,130 C345,75 430,165 520,110 C580,75 620,130 653,85 L653,240 L0,240 Z",
  },
  /* Forecast — optimistic series (BDI, forward curve).
     Glass-400 is a graphic-only tone. */
  forecast: {
    stroke: "#63d1ab", // Glass-400
    strokeWidth: 2,
    gradientColor: "#dcf3ea", // Glass-100 wash
    gradientOpacity: 0.26,
    defaultLinePath:
      "M0,140 C95,110 180,185 270,160 C360,135 445,190 535,120 C585,80 625,95 653,65",
    defaultAreaPath:
      "M0,140 C95,110 180,185 270,160 C360,135 445,190 535,120 C585,80 625,95 653,65 L653,240 L0,240 Z",
  },
  /* Negative — drawdown, Coral-500 graphics tone */
  negative: {
    stroke: "#e85c3a", // Coral-500 — graphics only
    strokeWidth: 2,
    gradientColor: "#fdeae4", // Coral-100 wash
    gradientOpacity: 0.3,
    defaultLinePath:
      "M0,110 C90,140 170,85 250,100 C330,115 415,185 500,170 C570,160 615,205 653,200",
    defaultAreaPath:
      "M0,110 C90,140 170,85 250,100 C330,115 415,185 500,170 C570,160 615,205 653,200 L653,240 L0,240 Z",
  },
};

export const AnimatedSvgChart: React.FC<AnimatedSvgChartProps> = ({
  variant = "actual",
  height = 80,
  className = "",
  linePath,
  areaPath,
}) => {
  const rawId = useId();
  const cleanId = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const gradientId = `chart-gradient-${variant}-${cleanId}`;
  const shouldReduceMotion = useReducedMotion();

  const config = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.actual;
  const finalLinePath = linePath || config.defaultLinePath;
  const finalAreaPath = areaPath || config.defaultAreaPath;

  const heightStyle = typeof height === "number" ? `${height}px` : height;

  return (
    <svg
      viewBox="0 0 653 240"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="presentation"
      className={cx("w-full overflow-hidden block", className)}
      style={{ height: heightStyle }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={config.gradientColor}
            stopOpacity={config.gradientOpacity}
          />
          <stop offset="100%" stopColor={config.gradientColor} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Depth-sounding grid — dotted Shoal hairlines */}
      <g stroke="#d8e2dc" strokeWidth="1" strokeDasharray="2 6" opacity="0.9">
        <line x1="0" y1="200" x2="653" y2="200" />
        <line x1="0" y1="120" x2="653" y2="120" />
        <line x1="0" y1="40" x2="653" y2="40" />
      </g>

      {/* Area wash */}
      <motion.path
        d={finalAreaPath}
        fill={`url(#${gradientId})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.5,
          ease: [0.4, 0, 0.2, 1],
        }}
      />

      {/* Sounding line — pen-plotter draw, left to right */}
      <motion.path
        d={finalLinePath}
        fill="none"
        stroke={config.stroke}
        strokeWidth={config.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.7,
          ease: [0.4, 0, 0.2, 1],
        }}
      />

      {/* Sounding terminal — square nib marker, plotter-style */}
      <motion.rect
        x="649"
        y={
          Number(finalLinePath.split(" ").pop()?.split(",")[1] ?? "85") - 4
        }
        width="8"
        height="8"
        rx="1"
        fill={config.stroke}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          delay: shouldReduceMotion ? 0 : 0.7,
          duration: shouldReduceMotion ? 0 : 0.2,
          ease: [0.4, 0, 0.2, 1],
        }}
      />
    </svg>
  );
};

export default AnimatedSvgChart;

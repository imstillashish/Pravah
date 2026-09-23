import React, { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cx } from "../lib/cn";
import { EASE_OUT } from "../lib/motion";

/**
 * Sparkline variants for the Wise world (spec §7): actual = Forest Ink
 * solid, forecast = Charcoal dashed, negative = Alarm Red. Series
 * differentiate by weight + dash, never hue alone. Lime never appears
 * in a chart (1.47:1 on Paper — the binding Lime trap).
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
  dasharray?: string;
  gradientColor: string;
  gradientOpacity: number;
  defaultLinePath: string;
  defaultAreaPath: string;
}

/* Area washes are Wise tints fading to transparent. */
const VARIANT_CONFIGS: Record<ChartVariant, VariantConfig> = {
  /* Actual — benchmark/steady series: Forest Ink solid. */
  actual: {
    stroke: "#163300", // Forest Ink
    strokeWidth: 2,
    gradientColor: "#e2f6d5", // Linen Mist wash
    gradientOpacity: 0.4,
    defaultLinePath:
      "M0,180 C80,150 165,190 260,130 C345,75 430,165 520,110 C580,75 620,130 653,85",
    defaultAreaPath:
      "M0,180 C80,150 165,190 260,130 C345,75 430,165 520,110 C580,75 620,130 653,85 L653,240 L0,240 Z",
  },
  /* Forecast — optimistic series: Charcoal dashed (differentiation by dash). */
  forecast: {
    stroke: "#454745", // Charcoal
    strokeWidth: 2,
    dasharray: "6 4",
    gradientColor: "#e2f6d5", // Linen Mist wash
    gradientOpacity: 0.4,
    defaultLinePath:
      "M0,140 C95,110 180,185 270,160 C360,135 445,190 535,120 C585,80 625,95 653,65",
    defaultAreaPath:
      "M0,140 C95,110 180,185 270,160 C360,135 445,190 535,120 C585,80 625,95 653,65 L653,240 L0,240 Z",
  },
  /* Negative — drawdown: Alarm Red solid. */
  negative: {
    stroke: "#cb272f", // Alarm Red
    strokeWidth: 2,
    gradientColor: "#cb272f", // Alarm Red wash
    gradientOpacity: 0.12,
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

      {/* Grid — dotted Pebble hairlines */}
      <g stroke="#868685" strokeWidth="1" strokeDasharray="2 6" opacity="0.7">
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
          ease: EASE_OUT,
        }}
      />

      {/* Series line — Wise draw, left to right */}
      <motion.path
        d={finalLinePath}
        fill="none"
        stroke={config.stroke}
        strokeWidth={config.strokeWidth}
        strokeDasharray={config.dasharray}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.7,
          ease: EASE_OUT,
        }}
      />

      {/* Terminal — square nib marker, Wise-style */}
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
          ease: EASE_OUT,
        }}
      />
    </svg>
  );
};

export default AnimatedSvgChart;

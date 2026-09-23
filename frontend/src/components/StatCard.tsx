import React, { useId, useMemo, useRef, useState } from "react";
import type { MotionValue } from "framer-motion";
import { useReducedMotion, useTransform } from "framer-motion";
import { motion } from "framer-motion";
import { Card } from "./ui";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useSpringNumber } from "../lib/useSpringNumber";
import { cx } from "../lib/cn";

/*
 * Wise-dressed StatCard (spec §5.1): real series sparkline, pointer +
 * keyboard scrub, spring rolling headline. The spark region is an
 * operable role="slider" scrubber (a11y: focusable + aria-hidden is a
 * violation; focusable + slider semantics is the correct pattern).
 * Semantic colors read the THEME tokens (good/bad direction) so the
 * card follows whatever visual world is active — the ▲/▼ glyph is
 * always paired with the delta color so hue is never the sole signal.
 * NOTE: bad-direction TEXT on fog sits at the theme's alarm-red; if a
 * theme's alarm fails 4.5:1 as text on its fog, darken the token — the
 * stroke remains legal at ≥3:1 regardless.
 */

const UP = "var(--color-emerald-profit, #047857)";   // good-direction stroke/text (psychological reward green)
const DOWN = "var(--color-alarm-red, #be123c)"; // bad-direction stroke/text (caution alert red)

/** Smooth monotone cubic path (no overshoot on the drawn line). */
function monotonePath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  const d: string[] = [`M${points[0].x},${points[0].y}`];
  const slope = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    (b.y - a.y) / Math.max(1e-6, b.x - a.x);
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const m1 = p0.x === p1.x ? 0 : slope(p0, p2) * 0.5 + slope(p0, p1);
    const m2 = p2.x === p3.x ? 0 : slope(p1, p3) * 0.5 + slope(p1, p2);
    d.push(
      `C${p1.x + (p2.x - p1.x) / 3},${p1.y + (m1 * (p2.x - p1.x)) / 3}` +
        `,${p2.x - (p2.x - p1.x) / 3},${p2.y - (m2 * (p2.x - p1.x)) / 3}` +
        `,${p2.x},${p2.y}`,
    );
  }
  return d.join("");
}

/** Keyboard scrub: ←/→ step, Home/End jump, Escape clears. */
function handleScrubKeys(count: number) {
  return (
    e: React.KeyboardEvent,
    setter: React.Dispatch<React.SetStateAction<number | null>>,
  ) => {
    if (count < 2) return;
    const key = e.key;
    if (
      key === "ArrowLeft" ||
      key === "ArrowRight" ||
      key === "Home" ||
      key === "End" ||
      key === "Escape"
    ) {
      e.preventDefault();
    }
    setter((prev) => {
      switch (key) {
        case "ArrowLeft":
          return Math.max(0, (prev ?? 0) - 1);
        case "ArrowRight":
          return Math.min(count - 1, (prev ?? -1) + 1);
        case "Home":
          return 0;
        case "End":
        case "Escape":
          return null;
        default:
          return prev;
      }
    });
  };
}

export interface StatCardProps {
  label: string;
  series: number[];
  format: (v: number) => string;
  goodWhen?: "up" | "down";
  deltaLabel?: string;
  caption?: string;
  delta?: number | null;
  index?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  series,
  format,
  goodWhen = "up",
  deltaLabel = "vs 30 days ago",
  caption,
  delta = null,
  index = 0,
}) => {
  const reduce = useReducedMotion() ?? false;
  const [hover, setHover] = useState<number | null>(null);
  const sparkRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const gradientId = useId().replace(/:/g, "");

  const n = series.length;
  const headline = series[n - 1] ?? 0;
  const shown = hover != null ? (series[hover] ?? headline) : headline;

  const spring = useSpringNumber(shown, !reduce);
  const displayValue: MotionValue<string> = useTransform(spring, (v) => format(v));

  const base = series[0] ?? headline;
  const computedDelta =
    delta ?? (n > 1 && base ? ((headline - base) / base) * 100 : null);
  const rising = (computedDelta ?? 0) >= 0;
  const good = goodWhen === "up" ? rising : !rising;
  const color = good ? UP : DOWN;

  React.useEffect(() => {
    const node = sparkRef.current;
    if (!node) return;
    const ro = new ResizeObserver(([entry]) =>
      setBox({ w: entry.contentRect.width, h: entry.contentRect.height }),
    );
    ro.observe(node);
    const rect = node.getBoundingClientRect();
    setBox({ w: rect.width, h: rect.height });
    return () => ro.disconnect();
  }, []);

  const spark = useMemo(() => {
    if (n < 2 || box.w <= 0 || box.h <= 0) return null;
    let lo = Infinity;
    let hi = -Infinity;
    for (const v of series) {
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
    const span = hi - lo || 1;
    const points = series.map((v, i) => ({
      x: 3 + (i / (n - 1)) * (box.w - 6),
      y: 7 + (1 - (v - lo) / span) * (box.h - 16),
    }));
    const line = monotonePath(points);
    const extremes: number[] = [];
    for (let i = 1; i < n - 1; i++) {
      if ((series[i] - series[i - 1]) * (series[i + 1] - series[i]) < 0)
        extremes.push(i);
    }
    return {
      line,
      area: `${line}L${points[n - 1].x},${box.h}L${points[0].x},${box.h}Z`,
      points,
      extremes: extremes.slice(0, 5),
    };
  }, [series, n, box]);

  const onMove = (clientX: number) => {
    const node = sparkRef.current;
    if (!node || n < 2) return;
    const rect = node.getBoundingClientRect();
    const t = (clientX - rect.left) / Math.max(1, rect.width);
    setHover(Math.max(0, Math.min(n - 1, Math.round(t * (n - 1)))));
  };

  const scrubDot = hover != null && spark ? spark.points[hover] : null;
  const ariaSummary =
    `${label}: ${format(headline)}` +
    (computedDelta != null
      ? `, ${rising ? "up" : "down"} ${Math.abs(computedDelta).toFixed(1)} percent ${deltaLabel}`
      : caption
        ? `, ${caption}`
        : "");

  return (
    <Card
      tone="fog"
      role="group"
      aria-label={ariaSummary}
      className="flex items-stretch justify-between gap-5 p-4"
    >
      <div className="flex min-w-0 flex-col justify-between">
        <p className="truncate text-[13px] text-charcoal">{label}</p>
        <motion.span
          className="mt-1.5 block font-mono text-[26px] font-semibold leading-none tracking-tight text-forest-ink tabular-nums"
        >
          {displayValue}
        </motion.span>
        <p className="mt-2 h-[17px] overflow-hidden whitespace-nowrap font-mono text-[12.5px] font-medium leading-none tabular-nums">
          {hover != null ? (
            <span className="text-charcoal">
              day {hover + 1} of {n}
            </span>
          ) : computedDelta != null ? (
            <span style={{ color }} className="inline-flex items-center gap-0.5">
              {rising ? (
                <ArrowUp className="size-3.5 stroke-[2.5]" aria-hidden="true" />
              ) : (
                <ArrowDown className="size-3.5 stroke-[2.5]" aria-hidden="true" />
              )}
              <span>{Math.abs(computedDelta).toFixed(1)}% {deltaLabel}</span>
            </span>
          ) : (
            <span className="text-charcoal">{caption ?? ""}</span>
          )}
        </p>
      </div>

      {n >= 2 && (
        <div
          ref={sparkRef}
          role="slider"
          aria-label={`${label} trend — scrub values`}
          aria-orientation="horizontal"
          aria-valuemin={1}
          aria-valuemax={n}
          aria-valuenow={hover != null ? hover + 1 : n}
          aria-valuetext={
            hover != null
              ? `day ${hover + 1} of ${n}: ${format(series[hover] ?? headline)}`
              : `latest: ${format(headline)}`
          }
          tabIndex={0}
          className={cx(
            "relative w-[44%] max-w-52 shrink-0 cursor-crosshair touch-pan-y self-stretch",
            "outline-offset-[-2px]",
          )}
          style={{ minHeight: 58 }}
          onKeyDown={(e) => handleScrubKeys(n)(e, setHover)}
          onBlur={() => setHover(null)}
          onPointerMove={(e) => onMove(e.clientX)}
          onPointerDown={(e) => onMove(e.clientX)}
          onPointerLeave={() => setHover(null)}
        >
          {spark && (
          <svg
            width={box.w}
            height={box.h}
            viewBox={`0 0 ${box.w} ${box.h}`}
            className="block h-full w-full overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <path
              d={spark.area}
              fill={`url(#${gradientId}-fill)`}
              style={reduce ? undefined : { animation: `sweep-fade 620ms ease-out ${index * 70 + 180}ms both` }}
            />
            <path
              d={spark.line}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              style={
                reduce
                  ? undefined
                  : { strokeDasharray: 1, animation: `sweep-draw 700ms cubic-bezier(0.23,1,0.32,1) ${index * 70}ms both` }
              }
            />
            {spark.extremes.map((i) => (
              <circle
                key={i}
                cx={spark.points[i].x}
                cy={spark.points[i].y}
                r={2.5}
                fill={color}
                style={reduce ? undefined : { animation: `sweep-fade 300ms ease-out ${index * 70 + 500}ms both` }}
              />
            ))}
            {scrubDot && (
              <circle
                cx={scrubDot.x}
                cy={scrubDot.y}
                r={4.5}
                className="fill-paper"
                stroke={color}
                strokeWidth={2}
              />
            )}
          </svg>
          )}
        </div>
      )}
    </Card>
  );
};

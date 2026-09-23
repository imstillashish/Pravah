import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "../lib/cn";

/*
 * Wise primitives (DESIGN.md v5 + spec §6). The lime pill + Forest Ink
 * ink is the signature (9.45:1). Semantic tints carry glyphs from the
 * caller — hue is never the sole signal. Lime is fill-only on light
 * surfaces; Slate text is Paper-only (4.40 on Fog fails AA).
 */

type ButtonBaseProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
};

/** Primary action: full-round Lime Voltage pill, Forest Ink ink (9.45:1). */
export function PrimaryButton({ className, children, ...props }: ButtonBaseProps) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full bg-lime-voltage",
        "px-5 py-2.5 text-sm font-medium text-forest-ink transition duration-150",
        "hover:brightness-95 active:scale-[0.98]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-ink",
        "disabled:cursor-not-allowed disabled:bg-fog disabled:text-slate disabled:active:scale-100",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Secondary action: outlined pill — Paper fill, Forest Ink border. */
export function SecondaryButton({ className, children, ...props }: ButtonBaseProps) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full border border-forest-ink bg-paper",
        "px-4 py-2.5 text-sm font-medium text-forest-ink transition-colors duration-150",
        "hover:bg-fog focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-ink",
        "active:bg-fog disabled:cursor-not-allowed disabled:border-pebble disabled:text-slate",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Text-style tertiary action — underlined Forest Ink (Wise text-link button). */
export function TextButton({ className, children, ...props }: ButtonBaseProps) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-forest-ink underline underline-offset-2",
        "transition-colors duration-150 hover:text-charcoal",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-ink",
        "disabled:cursor-not-allowed disabled:text-slate",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

type CardProps = HTMLAttributes<HTMLDivElement> & { children?: ReactNode };

/** Base surface: white card, 10px radius, Pebble hairline. No shadow. */
export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cx(
        "rounded-card border border-pebble bg-paper transition-colors duration-150",
        "hover:border-charcoal",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type PillProps = HTMLAttributes<HTMLSpanElement> & {
  children?: ReactNode;
  /**
   * Semantic tone — Wise recipes from spec §3:
   * positive = approved/live (Linen Mist + Forest Ink 12.19),
   * pending = info/pending (Linen Mist + Signal Blue 8.02),
   * negative = danger (Fog + Alarm Red 4.51, weight 600),
   * muted = quiet meta (Paper + Slate 5.30 — Slate never on Fog).
   */
  tone?: "default" | "positive" | "pending" | "negative" | "muted";
};

const PILL_TONES = {
  default: "border border-pebble bg-fog font-medium text-charcoal",
  positive: "bg-linen-mist font-medium text-forest-ink",
  pending: "bg-linen-mist font-medium text-signal-blue",
  negative: "bg-fog font-semibold text-alarm-red",
  muted: "border border-pebble bg-paper font-medium text-slate",
} as const;

/** Status pill: 9999px, tinted fill, mono 12px label. */
export function Pill({ className, children, tone = "default", ...props }: PillProps) {
  return (
    <span
      className={cx(
        "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5",
        "font-mono text-xs",
        PILL_TONES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/** Verified marker — Forest Ink dot, paired with a text label by the caller. */
export function VerifiedDot({ className }: { className?: string }) {
  return <span aria-hidden className={cx("inline-block size-1.5 rounded-full bg-forest-ink", className)} />;
}

/** Section title: 20px Inter 600 Forest Ink. */
export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="text-xl font-semibold leading-tight text-forest-ink">{title}</h2>
      {action}
    </div>
  );
}

/** Mono eyebrow: 10px uppercase, letter-spaced, Slate ink (Paper surfaces). */
export function Eyebrow({ className, children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cx("font-mono text-[10px] uppercase tracking-[0.08em] text-slate", className)} {...props}>
      {children}
    </span>
  );
}

/**
 * Loading skeleton: Fog block with an authored sweep — a light band
 * glides across, never a lazy opacity pulse (workspace rule: anti-slop).
 * Global reduced-motion query stops it.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div aria-hidden className={cx("relative overflow-hidden rounded-card bg-fog", className)} {...props}>
      <span className="absolute inset-y-0 w-1/3 bg-paper/70 [animation:skeleton-sweep_1.8s_ease-in-out_infinite]" />
    </div>
  );
}

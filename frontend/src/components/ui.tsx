import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "../lib/cn";

/*
 * Admiralty Chart primitives (DESIGN.md v3). Elevation is ruled
 * hairlines — never a shadow. The filled Abyss button is the primary
 * action; Deep is reserved for live/verified/info signals. No second
 * hue anywhere.
 */

type ButtonBaseProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
};

/** Primary action: filled Abyss, Foam text. Hover deepens to Deep Sea. */
export function PrimaryButton({ className, children, ...props }: ButtonBaseProps) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-sm bg-abyss",
        "px-4 py-2.5 text-sm font-medium text-foam transition-colors duration-150",
        "hover:bg-deepsea focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep",
        "active:bg-abyss disabled:cursor-not-allowed disabled:bg-shoal disabled:text-channel",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Secondary action: medium-rule outline, Abyss text. Hover washes Shoal. */
export function SecondaryButton({ className, children, ...props }: ButtonBaseProps) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-sm border border-shallow/45 bg-transparent",
        "px-4 py-2.5 text-sm font-medium text-abyss transition-colors duration-150",
        "hover:bg-shoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-abyss",
        "active:bg-shallow/30 disabled:cursor-not-allowed disabled:border-shallow/20 disabled:text-channel",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Text-style tertiary action (Slate ink, like links — Deep fails AA at UI sizes). */
export function TextButton({ className, children, ...props }: ButtonBaseProps) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center gap-1 rounded-sm px-2 py-1 text-sm font-medium text-slate-ink underline-offset-2 hover:underline",
        "transition-colors duration-150 hover:text-abyss",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-abyss",
        "disabled:cursor-not-allowed disabled:text-channel",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

type CardProps = HTMLAttributes<HTMLDivElement> & { children?: ReactNode };

/**
 * Base surface: Foam fill + 1px hairline ring. Elevation is the rule
 * itself — hover deepens hairline → medium rule, never a shadow.
 */
export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cx(
        "rounded-md border border-shallow/15 bg-foam transition-colors duration-150",
        "hover:border-shallow/45",
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
   * Semantic tone. positive/negative carry ▲/▼ glyphs from the caller —
   * hue is never the signal (DESIGN.md §7).
   */
  tone?: "default" | "positive" | "negative" | "muted";
};

const PILL_TONES = {
  default: "border-shallow/45 text-deepsea",
  /* Deep #2196f3 is 3.5:1 on Foam — legal only for graphics/large text.
     UI-scale live text signals use Slate 500 (5.03:1) with a Deep border. */
  positive: "border-deep/60 font-medium text-slate-ink",
  negative: "border-abyss/40 font-semibold text-abyss",
  muted: "border-shallow/30 text-slate-ink",
} as const;

/** Status pill: 3px radius, ruled outline, mono-friendly 12px label. */
export function Pill({ className, children, tone = "default", ...props }: PillProps) {
  return (
    <span
      className={cx(
        "inline-flex h-7 items-center gap-1.5 rounded-sm border px-2.5",
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

/** 4px live/verified dot — Deep is the informational accent. */
export function VerifiedDot({ className }: { className?: string }) {
  return <span aria-hidden className={cx("inline-block size-1 rounded-sm bg-deep", className)} />;
}

/** Chart-caption section title: 20px weight-400 Abyss. */
export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="text-xl font-normal leading-tight text-abyss">{title}</h2>
      {action}
    </div>
  );
}

/** Mono eyebrow: 10px uppercase, letter-spaced, Slate ink. */
export function Eyebrow({ className, children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cx(
        "font-mono text-[10px] uppercase tracking-[0.08em] text-slate-ink",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Loading skeleton: Shoal block with a dotted Slate rule sweeping
 * across — the chart "drawing in" (DESIGN.md §7a). Reduced motion
 * collapses the sweep via the global media query.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cx("relative overflow-hidden rounded-sm bg-shoal", className)}
      {...props}
    >
      <span className="absolute inset-x-0 top-1/2 w-1/2 -translate-y-1/2 border-t border-dotted border-slate-ink/50 [animation:rule-sweep_1.6s_ease-in-out_infinite]" />
    </div>
  );
}

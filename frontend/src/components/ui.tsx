import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "../lib/cn";

/*
 * Sea-Glass primitives (DESIGN.md v4). The mint pill + Sea-900 ink is the
 * signature. Semantic tints carry glyphs — hue is never the sole signal.
 */

type ButtonBaseProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
};

/** Primary action: full-round Mint-500 pill, Sea-900 ink text. */
export function PrimaryButton({ className, children, ...props }: ButtonBaseProps) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full bg-mint-500",
        "px-5 py-2.5 text-sm font-medium text-sea-900 transition-colors duration-150",
        "hover:bg-mint-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sea-600",
        "active:bg-mint-500 disabled:cursor-not-allowed disabled:bg-glass-200 disabled:text-faint",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Secondary action: line-strong outline, Sea-800 text; hover washes. */
export function SecondaryButton({ className, children, ...props }: ButtonBaseProps) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-md border border-line-strong bg-transparent",
        "px-4 py-2.5 text-sm font-medium text-sea-800 transition-colors duration-150",
        "hover:bg-wash focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sea-600",
        "active:bg-wash disabled:cursor-not-allowed disabled:border-line disabled:text-faint",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Text-style tertiary action (Sea-600, link-legal 5.28:1). */
export function TextButton({ className, children, ...props }: ButtonBaseProps) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center gap-1 rounded-sm px-2 py-1 text-sm font-medium text-sea-600 underline-offset-2",
        "transition-colors duration-150 hover:text-sea-800 hover:underline",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sea-600",
        "disabled:cursor-not-allowed disabled:text-faint",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

type CardProps = HTMLAttributes<HTMLDivElement> & { children?: ReactNode };

/** Base surface: white card + hairline line border. No shadow. */
export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cx(
        "rounded-md border border-line bg-card transition-colors duration-150",
        "hover:border-line-strong",
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
   * Semantic tone — filled tints with glyphs from the caller (DESIGN.md §4):
   * positive = approved/live, pending = caution, negative = rejected/danger.
   */
  tone?: "default" | "positive" | "pending" | "negative" | "muted";
};

const PILL_TONES = {
  default: "border-line bg-well text-body",
  positive: "border-glass-200 bg-glass-100 font-medium text-sea-800",
  pending: "border-amber-300 bg-amber-100 font-medium text-amber-700",
  negative: "border-coral-500/40 bg-coral-100 font-semibold text-coral-700",
  muted: "border-line bg-well text-muted",
} as const;

/** Status pill: 4px chip, tinted fill, mono 12px label. */
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

/** Live/verified dot — Sea-600 is the informational accent. */
export function VerifiedDot({ className }: { className?: string }) {
  return <span aria-hidden className={cx("inline-block size-1 rounded-sm bg-sea-600", className)} />;
}

/** Section title: 20px Inter 600 Sea-900. */
export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="text-xl font-semibold leading-tight text-sea-900">{title}</h2>
      {action}
    </div>
  );
}

/** Mono eyebrow: 10px uppercase, letter-spaced, Muted ink. */
export function Eyebrow({ className, children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cx("font-mono text-[10px] uppercase tracking-[0.08em] text-muted", className)} {...props}>
      {children}
    </span>
  );
}

/**
 * Loading skeleton: Glass-100 block with an authored sweep — a light
 * band glides across (chart "drawing in"), never a lazy opacity pulse
 * (workspace rule: anti-slop). Global reduced-motion query stops it.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div aria-hidden className={cx("relative overflow-hidden rounded-sm bg-glass-100", className)} {...props}>
      <span className="absolute inset-y-0 w-1/3 bg-card/70 [animation:skeleton-sweep_1.8s_ease-in-out_infinite]" />
    </div>
  );
}

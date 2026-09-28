import { CheckCircle2, RefreshCw, Timer } from "lucide-react";
import { cx } from "../../lib/cn";
import type { Verdict } from "../../lib/verdict";

const CHIP_STYLES: Record<Verdict, string> = {
  book: "border-emerald-profit/20 bg-emerald-wash text-emerald-profit",
  wait: "border-amber-warning/20 bg-amber-wash text-amber-warning",
  alternative: "border-signal-blue/20 bg-linen-mist text-signal-blue",
};

const CHIP_LABELS: Record<Verdict, string> = {
  book: "Book now",
  wait: "Wait",
  alternative: "Alternative",
};

const CHIP_ICONS: Record<Verdict, typeof CheckCircle2> = {
  book: CheckCircle2,
  wait: Timer,
  alternative: RefreshCw,
};

/** Compact verdict for tables and lists — icon + word, never colour alone. */
export function VerdictChip({ verdict, className }: { verdict: Verdict; className?: string }) {
  const Icon = CHIP_ICONS[verdict];
  return (
    <span
      className={cx(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 font-mono text-xs font-semibold",
        CHIP_STYLES[verdict],
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {CHIP_LABELS[verdict]}
    </span>
  );
}

export default VerdictChip;

import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, RefreshCw, Timer } from "lucide-react";
import { cx } from "../../lib/cn";
import type { Verdict, VerdictResult } from "../../lib/verdict";
import { Pill } from "../ui";

const VERDICT_STYLES: Record<Verdict, { border: string; wash: string; ink: string }> = {
  book: { border: "border-emerald-profit/40", wash: "bg-emerald-wash", ink: "text-emerald-profit" },
  wait: { border: "border-amber-warning/40", wash: "bg-amber-wash", ink: "text-amber-warning" },
  alternative: { border: "border-signal-blue/40", wash: "bg-linen-mist", ink: "text-signal-blue" },
};

const VERDICT_ICONS: Record<Verdict, typeof CheckCircle2> = {
  book: CheckCircle2,
  wait: Timer,
  alternative: RefreshCw,
};

/**
 * The one-screen answer. Reads top-down: verdict → why → confidence → actions.
 * The verdict word always accompanies the colour, so colour is never the only signal.
 */
export function VerdictCard({
  result,
  primaryAction,
  secondaryAction,
  footnote,
}: {
  result: VerdictResult;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  footnote?: string;
}) {
  const style = VERDICT_STYLES[result.verdict];
  const Icon = VERDICT_ICONS[result.verdict];

  return (
    <section
      aria-labelledby="verdict-headline"
      className={cx("rounded-card border-2 p-5 sm:p-6", style.border, style.wash)}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Icon aria-hidden="true" className={cx("mt-0.5 size-7 shrink-0", style.ink)} />
          <div>
            <h2
              id="verdict-headline"
              className={cx("font-mono text-2xl font-bold tracking-tight sm:text-3xl", style.ink)}
            >
              {result.headline}
            </h2>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-charcoal">{result.reason}</p>
          </div>
        </div>
        <Pill tone={result.verdict === "book" ? "positive" : "pending"}>Confidence: {result.confidence}</Pill>
      </div>

      {(primaryAction || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {primaryAction}
          {secondaryAction}
        </div>
      )}

      {footnote && <p className="mt-3 text-xs text-charcoal">{footnote}</p>}
    </section>
  );
}

/** Convenience: the standard "go book it" action wired to the hash router. */
export function BookNowAction({ analysisId }: { analysisId: number | string }) {
  return (
    <button
      type="button"
      onClick={() => {
        window.location.hash = `#booking-${analysisId}`;
      }}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-lime-voltage px-5 py-2.5 text-sm font-medium text-forest-ink transition duration-150 hover:brightness-95 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-ink"
    >
      Book this shipment
      <ArrowRight aria-hidden="true" className="size-4" />
    </button>
  );
}

export function CompareOptionsAction({ onCompare }: { onCompare: () => void }) {
  return (
    <button
      type="button"
      onClick={onCompare}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-forest-ink bg-paper px-4 py-2.5 text-sm font-medium text-forest-ink transition-colors duration-150 hover:bg-fog focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-ink"
    >
      Compare options
    </button>
  );
}

export default VerdictCard;

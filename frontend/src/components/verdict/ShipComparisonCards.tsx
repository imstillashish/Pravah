import { Ship } from "lucide-react";
import { cx } from "../../lib/cn";
import type { ShipPick } from "../../lib/verdict";
import { Pill } from "../ui";
import { ExpertDisclosure } from "./ExpertDisclosure";

/**
 * Ranked ship options in plain words. Expert specs (scores, fit checks) stay
 * behind the shared disclosure so the plain layer reads cleanly.
 */
export function ShipComparisonCards({ picks }: { picks: ShipPick[] }) {
  if (!picks.length) {
    return (
      <section className="rounded-card border border-pebble bg-paper p-5">
        <h2 className="text-base font-semibold text-forest-ink">Which ship to use</h2>
        <p className="mt-2 text-sm text-charcoal">
          No ship options were computed for this analysis — re-run it to get vessel recommendations.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="ship-picks-heading" className="rounded-card border border-pebble bg-paper p-5">
      <h2 id="ship-picks-heading" className="text-base font-semibold text-forest-ink">
        Which ship to use
      </h2>
      <p className="mt-1 text-sm text-charcoal">
        Ranked by cost, reliability and whether the vessel actually fits the berths on this route.
      </p>

      <ol className="mt-4 grid gap-3 sm:grid-cols-2">
        {picks.map((pick, index) => (
          <li
            key={`${pick.vesselClass}-${pick.portName}-${index}`}
            className={cx(
              "rounded-card border p-4 transition-colors duration-150",
              pick.isCheapest ? "border-forest-ink/40 bg-linen-mist/40" : "border-pebble bg-fog",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Ship aria-hidden="true" className="size-4 text-forest-ink" />
                <span className="text-sm font-semibold text-obsidian">
                  {index + 1}. {pick.vesselClass}
                </span>
              </div>
              {pick.isCheapest && <Pill tone="positive">Cheapest</Pill>}
            </div>
            <p className="mt-2 font-mono text-lg font-bold tabular-nums text-forest-ink">{pick.plainCost}</p>
            <p className="mt-1 text-xs leading-relaxed text-charcoal">{pick.why}</p>

            <ExpertDisclosure label="Show ship specs" className="mt-3 bg-paper">
              <dl className="grid grid-cols-2 gap-2 font-mono text-xs text-charcoal">
                <dt className="text-slate">Discharge port</dt>
                <dd>{pick.portName}</dd>
                <dt className="text-slate">Overall score</dt>
                <dd className="tabular-nums">{Math.round(pick.totalScore * 100)}/100</dd>
              </dl>
            </ExpertDisclosure>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default ShipComparisonCards;

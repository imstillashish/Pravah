import React from "react";
import { Activity, Anchor, Clock, Fuel, Ship, TrendingDown } from "lucide-react";
import { cx } from "../lib/cn";

/**
 * Right sidebar (320px, independently scrollable) — Admiralty Chart
 * feed. Mono tabular values, hairline dividers, Shoal hover wash.
 * Hazards are marked with a dotted rule + "!" glyph — never a second
 * hue (DESIGN.md §7). Desk-aware so both roles get operational signal.
 */

type Row = {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  iconClass?: string;
  label: string;
  sub: string;
  value: string;
  delta?: string;
  deltaTone?: "up" | "down";
  hazard?: boolean;
};

const PLANNER_ROWS: Row[] = [
  {
    icon: Activity,
    iconClass: "text-sea-600",
    label: "BDI Composite",
    sub: "Baltic Dry Index",
    value: "1,842",
    delta: "2.4%",
    deltaTone: "up",
  },
  {
    icon: TrendingDown,
    iconClass: "text-muted",
    label: "Route Benchmark",
    sub: "Australia → Paradip",
    value: "$14.85/MT",
    delta: "6.8%",
    deltaTone: "down",
  },
  {
    icon: Fuel,
    iconClass: "text-muted",
    label: "VLSFO Singapore",
    sub: "Bunker fuel",
    value: "$612.50/MT",
  },
  {
    icon: Ship,
    iconClass: "text-muted",
    label: "Capesize 5TC",
    sub: "Daily timecharter",
    value: "$22,450/d",
    delta: "1.1%",
    deltaTone: "up",
  },
];

const OPERATOR_ROWS: Row[] = [
  {
    icon: Anchor,
    iconClass: "text-sea-600",
    label: "Paradip MCB I–II",
    sub: "Mechanized coal berth",
    value: "OPEN",
  },
  {
    icon: Anchor,
    iconClass: "text-sea-600",
    label: "Vizag Outer Harbor",
    sub: "Discharge berth",
    value: "OPEN",
  },
  {
    icon: Anchor,
    label: "Sagar-Sandheads",
    sub: "Draft advisory · 14.5m max",
    value: "14.5m",
    hazard: true,
  },
  {
    icon: Clock,
    iconClass: "text-muted",
    label: "Avg Turnaround",
    sub: "Port fleet, 7d",
    value: "41.8h",
    delta: "6.4h",
    deltaTone: "down",
  },
];

function RailRow({ row }: { row: Row }) {
  const Icon = row.icon;

  if (row.hazard) {
    /* Advisory row: dotted Slate rule + "!" glyph + 600 weight. */
    return (
      <div className="m-1 flex items-center gap-2.5 rounded-sm border border-dashed border-amber-300 bg-amber-100 px-2 py-2.5">
        <span
          aria-hidden="true"
          className="flex size-5 shrink-0 items-center justify-center rounded-sm border border-amber-500/60 font-mono text-xs font-semibold text-amber-700"
        >
          !
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-semibold text-amber-700">{row.label}</div>
          <div className="truncate text-xs text-muted">{row.sub}</div>
        </div>
        <div className="shrink-0 text-right leading-tight">
          <div className="font-mono text-sm font-semibold tabular-nums text-amber-700">
            {row.value}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 rounded-sm px-2 py-2.5 transition-colors duration-150 hover:bg-wash">
      <span className={cx("shrink-0", row.iconClass ?? "text-muted")}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate text-sm font-medium text-sea-900">{row.label}</div>
        <div className="truncate text-xs text-muted">{row.sub}</div>
      </div>
      <div className="shrink-0 text-right leading-tight">
        <div className="font-mono text-sm tabular-nums text-sea-900">{row.value}</div>
        {row.delta && (
          <div
            className={cx(
              "flex items-center justify-end gap-0.5 font-mono text-[10px] tabular-nums",
              row.deltaTone === "up" ? "font-medium text-sea-800" : "font-semibold text-coral-700",
            )}
          >
            <span aria-hidden="true" className="text-[8px] leading-none">
              {row.deltaTone === "up" ? "▲" : "▼"}
            </span>
            {row.delta}
          </div>
        )}
      </div>
    </div>
  );
}

export const RightRail: React.FC<{ desk: "planner" | "operator" }> = ({ desk }) => {
  const rows = desk === "planner" ? PLANNER_ROWS : OPERATOR_ROWS;

  return (
    <aside
      aria-label={desk === "planner" ? "Live market rail" : "Live operations rail"}
      className="sticky top-12 hidden h-[calc(100vh-3rem)] w-80 shrink-0 overflow-y-auto border-l border-line bg-card p-3 xl:block"
    >
      <div className="mb-2 flex items-center justify-between px-2">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
          {desk === "planner" ? "Market Feed" : "Port Feed"}
          {/* Static live marker — no ping/pulse animation (workspace rule: anti-slop). */}
          <span className="relative flex size-1.5">
            <span className="relative inline-flex size-1.5 rounded-full bg-sea-600" />
          </span>
        </span>
        <span className="font-mono text-[10px] text-muted">LIVE</span>
      </div>
      <div className="divide-y divide-line">
        {rows.map((row) => (
          <RailRow key={row.label} row={row} />
        ))}
      </div>
      <p className="mt-3 px-2 font-mono text-[10px] leading-relaxed text-muted">
        Simulated chart feed for demonstration. Values refresh with the analysis service.
      </p>
    </aside>
  );
};

export default RightRail;

import React from "react";
import { Anchor, Clock } from "lucide-react";
import { Pulse, GasPump, Boat, TrendDown } from "@phosphor-icons/react";
import { cx } from "../lib/cn";

/**
 * Right sidebar (320px, independently scrollable) — Wise feed.
 * Mono tabular values, Pebble dividers, Fog hover wash. Hazards use
 * the Signal Blue info recipe (Linen Mist tint) — spec §3. Desk-aware
 * so both roles get operational signal.
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
    icon: Pulse,
    iconClass: "text-forest-ink",
    label: "BDI Composite",
    sub: "Baltic Dry Index",
    value: "1,842",
    delta: "2.4%",
    deltaTone: "up",
  },
  {
    icon: TrendDown,
    iconClass: "text-slate",
    label: "Route Benchmark",
    sub: "Australia → Paradip",
    value: "$14.85/MT",
    delta: "6.8%",
    deltaTone: "down",
  },
  {
    icon: GasPump,
    iconClass: "text-slate",
    label: "VLSFO Singapore",
    sub: "Bunker fuel",
    value: "$612.50/MT",
  },
  {
    icon: Boat,
    iconClass: "text-slate",
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
    iconClass: "text-forest-ink",
    label: "Paradip MCB I–II",
    sub: "Mechanized coal berth",
    value: "OPEN",
  },
  {
    icon: Anchor,
    iconClass: "text-forest-ink",
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
    iconClass: "text-slate",
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
    /* Advisory row: Linen Mist info tint + "!" glyph (spec §3 pending/info). */
    return (
      <div className="m-1 flex items-center gap-2.5 rounded-card bg-linen-mist px-2 py-2.5">
        <span
          aria-hidden="true"
          className="flex size-5 shrink-0 items-center justify-center rounded-full bg-paper font-mono text-xs font-semibold text-signal-blue"
        >
          !
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-semibold text-signal-blue">{row.label}</div>
          <div className="truncate text-xs text-charcoal">{row.sub}</div>
        </div>
        <div className="shrink-0 text-right leading-tight">
          <div className="font-mono text-sm font-semibold tabular-nums text-signal-blue">
            {row.value}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 rounded-card px-2 py-2.5 transition-colors duration-150 hover:bg-fog">
      <span className={cx("shrink-0", row.iconClass ?? "text-slate")}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate text-sm font-medium text-forest-ink">{row.label}</div>
        <div className="truncate text-xs text-charcoal">{row.sub}</div>
      </div>
      <div className="shrink-0 text-right leading-tight">
        <div className="font-mono text-sm tabular-nums text-forest-ink">{row.value}</div>
        {row.delta && (
          <div
            className={cx(
              "flex items-center justify-end gap-0.5 font-mono text-[10px] tabular-nums",
              row.deltaTone === "up" ? "font-medium text-spruce" : "font-semibold text-alarm-red",
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
      className="sticky top-12 hidden h-[calc(100vh-3rem)] w-80 shrink-0 overflow-y-auto border-l border-pebble bg-paper p-3 xl:block"
    >
      <div className="mb-2 flex items-center justify-between px-2">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-slate">
          {desk === "planner" ? "Market Feed" : "Port Feed"}
        </span>
        {/* Live marker: mini lime pill — a lime DOT on paper is 1.47:1 (invisible);
            the pill keeps the lime signal at 9.45:1. Static — anti-slop rule. */}
        <span className="rounded-full bg-lime-voltage px-2 py-0.5 font-mono text-[10px] font-semibold text-forest-ink">
          LIVE
        </span>
      </div>
      <div className="divide-y divide-pebble">
        {rows.map((row) => (
          <RailRow key={row.label} row={row} />
        ))}
      </div>
      <p className="mt-3 px-2 font-mono text-[10px] leading-relaxed text-slate">
        Simulated chart feed for demonstration. Values refresh with the analysis service.
      </p>
    </aside>
  );
};

export default RightRail;

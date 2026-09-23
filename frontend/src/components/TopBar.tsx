import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Compass,
  Search,
  ArrowLeftRight,
  Anchor,
  TrendingUp,
  Loader2,
  ChevronDown,
} from "lucide-react";

/**
 * Top nav band (48px, Paper + Pebble rule below) — Wise shell.
 * Pill search on a Fog fill; the workspace desk presented as a Wise
 * segmented pill with mono desk code and lime active segment.
 */
export const TopBar: React.FC = () => {
  const { user, switchRole } = useAuth();
  const [switching, setSwitching] = useState(false);

  if (!user) return null;

  const isPlanner = user.role === "logistics_planner";
  const deskCode = isPlanner ? "FR8-PLN" : "PRT-OPS";
  const targetRole = isPlanner ? "port_operator" : "logistics_planner";

  const handleSwitch = async () => {
    setSwitching(true);
    await switchRole(targetRole);
    setSwitching(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-pebble bg-paper/95 backdrop-blur">
      <div className="flex h-12 items-center gap-3 px-3 md:pl-[72px] md:pr-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-forest-ink text-lime-voltage">
            <Compass className="size-4" aria-hidden="true" />
          </span>
          <span className="hidden text-sm font-medium text-forest-ink sm:inline">
            Intelligent Freight Portal
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.08em] text-slate lg:inline">
            SAIL Bulk Chartering
          </span>
        </div>

        {/* Search — Wise pill search on Fog fill */}
        <div className="ml-2 flex h-8 max-w-md flex-1 items-center gap-2 rounded-full border border-transparent bg-fog px-3.5 transition-colors duration-150 focus-within:border-forest-ink focus-within:bg-paper">
          <Search className="size-4 text-slate" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search routes, vessels, analyses"
            aria-label="Search routes, vessels, analyses"
            className="h-full w-full bg-transparent text-sm text-charcoal placeholder:text-slate focus:outline-none"
          />
          <kbd className="hidden rounded-full border border-pebble bg-paper px-1.5 font-mono text-[10px] text-slate sm:inline">
            /
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Desk pill — Wise segmented style, mono desk code */}
          <div className="hidden h-8 items-center gap-2.5 rounded-full border border-pebble bg-fog px-3 md:flex">
            <div className="leading-tight">
              <div className="font-mono text-[11px] font-semibold tabular-nums text-forest-ink">{deskCode}</div>
              <div className="max-w-[160px] truncate text-[10px] text-charcoal">
                {user.full_name}
              </div>
            </div>
            <button
              type="button"
              onClick={handleSwitch}
              disabled={switching}
              aria-label={
                isPlanner
                  ? "Switch to Vessel and Port Operations"
                  : "Switch to Freight and Chartering Desk"
              }
              className="ml-1 flex items-center gap-1 rounded-full bg-lime-voltage px-2 py-0.5 font-mono text-[10px] font-semibold text-forest-ink transition duration-150 hover:brightness-95 disabled:opacity-40"
            >
              {switching ? (
                <Loader2 className="size-3 animate-spin" aria-hidden="true" />
              ) : (
                <ArrowLeftRight className="size-3" aria-hidden="true" />
              )}
              <span className="hidden xl:inline">{isPlanner ? "OPS" : "FRT"}</span>
            </button>
          </div>

          {/* Mobile fallback: compact switch chip with mono desk code */}
          <button
            type="button"
            onClick={handleSwitch}
            disabled={switching}
            aria-label={
              isPlanner
                ? "Switch to Vessel and Port Operations"
                : "Switch to Freight and Chartering Desk"
            }
            className="flex h-8 items-center gap-1.5 rounded-full border border-pebble bg-paper px-2 text-forest-ink transition-colors duration-150 hover:border-forest-ink md:hidden"
          >
            {isPlanner ? (
              <TrendingUp className="size-4 text-forest-ink" aria-hidden="true" />
            ) : (
              <Anchor className="size-4 text-forest-ink" aria-hidden="true" />
            )}
            <span className="font-mono text-[11px] tabular-nums">{deskCode}</span>
            <ChevronDown className="size-3 text-slate" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;

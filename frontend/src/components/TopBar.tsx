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
 * Top nav band (48px, Foam + medium rule below) — Admiralty Chart
 * shell. Brand in Abyss ink; search well recessed on a Shoal wash;
 * the workspace desk presented as a chart-legend pill with mono desk
 * code and a Deep live dot.
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
    <header className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur">
      <div className="flex h-12 items-center gap-3 px-3 md:pl-[72px] md:pr-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-sm bg-mint-500 text-sea-900">
            <Compass className="size-4" aria-hidden="true" />
          </span>
          <span className="hidden text-sm font-medium text-sea-900 sm:inline">
            Intelligent Freight Portal
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.08em] text-muted lg:inline">
            SAIL Bulk Chartering
          </span>
        </div>

        {/* Search well — recessed Foam on Shoal wash */}
        <div className="ml-2 flex h-8 max-w-md flex-1 items-center gap-2 rounded-sm border border-line bg-well px-3 transition-colors duration-150 focus-within:border-sea-600">
          <Search className="size-4 text-muted" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search routes, vessels, analyses"
            aria-label="Search routes, vessels, analyses"
            className="h-full w-full bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
          />
          <kbd className="hidden rounded-sm border border-line px-1.5 font-mono text-[10px] text-muted sm:inline">
            /
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Desk pill — chart-legend style */}
          <div className="hidden h-8 items-center gap-2.5 rounded-sm border border-line bg-glass-100 px-3 md:flex">
            <span className="size-2 rounded-full bg-sea-600" aria-hidden="true" />
            <div className="leading-tight">
              <div className="font-mono text-[11px] tabular-nums text-sea-800">{deskCode}</div>
              <div className="max-w-[160px] truncate text-[10px] text-muted">
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
              className="ml-1 flex items-center gap-1 rounded-sm border border-line px-1.5 py-0.5 font-mono text-[10px] text-muted transition-colors duration-150 hover:border-sea-600 hover:text-sea-600 disabled:opacity-40"
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
            className="flex h-8 items-center gap-1.5 rounded-sm border border-line bg-card px-2 text-sea-900 transition-colors duration-150 hover:border-sea-600 md:hidden"
          >
            {isPlanner ? (
              <TrendingUp className="size-4 text-sea-600" aria-hidden="true" />
            ) : (
              <Anchor className="size-4 text-sea-600" aria-hidden="true" />
            )}
            <span className="font-mono text-[11px] tabular-nums">{deskCode}</span>
            <ChevronDown className="size-3 text-muted" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;

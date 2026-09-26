import React, { useEffect, useState, useCallback } from "react";
import { Layers, ArrowUp, ArrowRight } from "lucide-react";
import { ArrowClockwise } from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../api";
import { Card, Pill, SecondaryButton, SectionHeader, LoadingSkeleton, EmptyState } from "./ui";
import type { AnalysisObject } from "../types/analysis";

/**
 * Recent analyses — the simulation log. Mono tabular numerals,
 * Oceanic header band, 1px hairline row rules, Fog hover wash.
 * Savings carry the ▲ glyph in Emerald Profit; overridden status is a hazard
 * (Alarm Red + "!") — never a second hue (DESIGN.md §7).
 */
export interface RecentAnalysesTableProps {
  analyses?: AnalysisObject[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export const RecentAnalysesTable: React.FC<RecentAnalysesTableProps> = ({
  analyses: propAnalyses,
  isLoading: propIsLoading,
  onRefresh,
}) => {
  const { token } = useAuth();
  const [internalAnalyses, setInternalAnalyses] = useState<AnalysisObject[]>([]);
  const [internalLoading, setInternalLoading] = useState<boolean>(true);

  const fetchInternal = useCallback(async () => {
    if (!token) {
      setInternalLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/analyses/recent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: AnalysisObject[] = await res.json();
        setInternalAnalyses(data);
      } else {
        console.warn("RecentAnalysesTable: server responded with", res.status);
      }
    } catch (err) {
      console.error("RecentAnalysesTable: failed to fetch analyses", err);
    } finally {
      setInternalLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (propAnalyses === undefined) {
      fetchInternal();
    }
  }, [propAnalyses, fetchInternal]);

  const analyses = propAnalyses ?? internalAnalyses;
  const isLoading = propIsLoading !== undefined ? propIsLoading : internalLoading;

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      setInternalLoading(true);
      fetchInternal();
    }
  };

  const renderStatusBadge = (status: AnalysisObject["status"]) => {
    switch (status) {
      case "finalized":
        return (
          <Pill tone="positive">
            <ArrowUp className="size-3 stroke-[2.5]" aria-hidden="true" />
            <span>Finalized</span>
          </Pill>
        );
      case "draft":
        return (
          <Pill tone="muted">
            <span>Draft</span>
          </Pill>
        );
      case "overridden":
        return (
          <Pill tone="negative">
            <span aria-hidden="true" className="text-[8px] leading-none">
              !
            </span>
            <span>Overridden</span>
          </Pill>
        );
      default:
        return (
          <Pill tone="default">
            <span>{status}</span>
          </Pill>
        );
    }
  };

  return (
    <section aria-labelledby="recent-analyses-heading">
      <SectionHeader title="Recent Procurement & Freight Forecasts" />
      <p className="mt-1 text-sm text-charcoal">
        Historical voyage simulations, vessel parcel allocations, and realized cost savings. Click any row to review full decision details.
      </p>

      <Card className="mt-4 overflow-hidden rounded-card border border-pebble bg-paper p-0">
        <div className="flex items-center justify-between border-b border-pebble bg-paper px-4 py-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate">
            SIMULATION LOG · {analyses.length} ENTRIES
          </span>
          <SecondaryButton
            onClick={handleRefresh}
            aria-label="Refresh recent analyses"
            className="px-2.5 py-1.5 text-xs"
          >
            <ArrowClockwise
              className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            <span>Refresh</span>
          </SecondaryButton>
        </div>

        <div
          role="region"
          aria-label="Recent analyses table, scrollable horizontally"
          tabIndex={0}
          className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-forest-ink"
        >
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-pebble bg-fog font-mono text-[10px] uppercase tracking-[0.08em] text-charcoal">
                <th scope="col" className="py-2.5 pl-4 pr-3 font-semibold">Trade Route</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Cargo &amp; Parcel</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Vessel</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Forecast vs. Spot</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Savings</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Status</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Run Time</th>
                <th scope="col" className="py-2.5 pl-3 pr-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pebble bg-paper text-sm">
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b border-pebble">
                    <td className="py-3.5 pl-4 pr-3">
                      <LoadingSkeleton className="h-4 w-32" />
                      <LoadingSkeleton className="mt-1 h-3 w-16" />
                    </td>
                    <td className="px-3 py-3.5">
                      <LoadingSkeleton className="h-4 w-24" />
                      <LoadingSkeleton className="mt-1 h-3 w-16" />
                    </td>
                    <td className="px-3 py-3.5"><LoadingSkeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-3 py-3.5">
                      <LoadingSkeleton className="h-4 w-24" />
                      <LoadingSkeleton className="mt-1 h-3 w-20" />
                    </td>
                    <td className="px-3 py-3.5"><LoadingSkeleton className="h-5 w-24" /></td>
                    <td className="px-3 py-3.5"><LoadingSkeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="px-3 py-3.5"><LoadingSkeleton className="h-4 w-20" /></td>
                    <td className="py-3.5 pl-3 pr-4"><LoadingSkeleton className="ml-auto h-6 w-16 rounded-full" /></td>
                  </tr>
                ))
              ) : analyses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8">
                    <EmptyState
                      icon={<Layers className="size-8" aria-hidden="true" />}
                      title="No recent analyses recorded"
                      description="Run a new simulation to evaluate voyage charter savings, vessel parcel allocation, and route economics."
                    />
                  </td>
                </tr>
              ) : (
                analyses.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      window.location.hash = `#analysis-${item.id}`;
                    }}
                    className="group cursor-pointer transition-colors duration-150 hover:bg-fog/60"
                  >
                    {/* Trade route */}
                    <td className="py-3.5 pl-4 pr-3">
                      <div className="flex items-center gap-1.5 font-semibold text-forest-ink">
                        <span className="truncate">{item.origin_port}</span>
                        <span aria-hidden="true" className="font-mono text-slate">→</span>
                        <span className="truncate">{item.destination_port}</span>
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate">
                        {item.origin_country}
                      </div>
                    </td>

                    {/* Cargo */}
                    <td className="px-3 py-3.5">
                      <div className="font-mono font-medium tabular-nums text-forest-ink">
                        {item.parcel_tonnage.toLocaleString()} <span className="font-sans text-xs text-slate">MT</span>
                      </div>
                      <div className="text-xs text-charcoal">{item.commodity}</div>
                    </td>

                    {/* Vessel */}
                    <td className="px-3 py-3.5">
                      <Pill tone="muted">{item.recommended_vessel}</Pill>
                    </td>

                    {/* Forecast vs spot */}
                    <td className="px-3 py-3.5">
                      <div className="font-mono font-medium tabular-nums text-forest-ink">
                        ${item.predicted_rate_pmt.toFixed(2)}
                        <span className="font-sans text-xs text-slate">/MT</span>
                      </div>
                      <div className="font-mono text-xs tabular-nums text-slate">
                        Spot: ${item.benchmark_spot_pmt.toFixed(2)}/MT
                      </div>
                    </td>

                    {/* Savings — High psychological reward Emerald Green with clean ArrowUp */}
                    <td className="px-3 py-3.5">
                      <span className="inline-flex items-center gap-1 font-mono font-semibold tabular-nums text-emerald-profit">
                        <ArrowUp className="size-3.5 stroke-[2.5]" aria-hidden="true" />
                        <span>+${Math.round(item.estimated_savings_usd).toLocaleString()}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3.5">{renderStatusBadge(item.status)}</td>

                    {/* Time */}
                    <td className="px-3 py-3.5 font-mono text-xs tabular-nums text-slate">
                      {formatDate(item.created_at)}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 pl-3 pr-4 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-forest-ink/10 px-2.5 py-1 text-xs font-semibold text-forest-ink group-hover:bg-forest-ink group-hover:text-paper transition-all">
                        <span>Open</span>
                        <ArrowRight className="size-3" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
};

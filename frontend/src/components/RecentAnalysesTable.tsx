import React, { useEffect, useState, useCallback } from "react";
import { RefreshCw, Layers } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../api";
import { Card, Pill, SecondaryButton, SectionHeader, Skeleton } from "./ui";
import type { AnalysisObject } from "../types/analysis";

/**
 * Recent analyses — the simulation log. Mono tabular numerals,
 * Shoal header band, 1px hairline row rules, Shoal hover wash.
 * Savings carry the ▲ glyph in Deep; overridden status is a hazard
 * (Abyss 600 + "!") — never a second hue (DESIGN.md §7).
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <span aria-hidden="true" className="text-[8px] leading-none">
              ▲
            </span>
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
      <p className="mt-1 text-sm text-deepsea">
        Historical voyage simulations, vessel parcel allocations, and realized cost savings.
      </p>

      <Card className="mt-4 overflow-hidden rounded-none p-0">
        <div className="flex items-center justify-between border-b border-shallow/45 bg-shoal/60 px-4 py-3">
          {/* On washed bands, eyebrow ink steps up to Deep Sea (Slate = 4.45:1 here) */}
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-deepsea">
            SIMULATION LOG · {analyses.length} ENTRIES
          </span>
          <SecondaryButton
            onClick={handleRefresh}
            aria-label="Refresh recent analyses"
            className="px-2.5 py-1.5 text-xs"
          >
            <RefreshCw
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
          className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-abyss"
        >
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-shallow/45 font-mono text-[10px] uppercase tracking-[0.08em] text-slate-ink">
                <th scope="col" className="py-2.5 pl-4 pr-3 font-medium">Trade Route</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Cargo &amp; Parcel</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Vessel</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Forecast vs. Spot</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Savings</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
                <th scope="col" className="py-2.5 pl-3 pr-4 text-right font-medium">Run Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-shallow/15 text-sm">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td className="py-3.5 pl-4 pr-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-3 py-3.5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-3 py-3.5"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-3 py-3.5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-3 py-3.5"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-3 py-3.5"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-3.5 pl-3 pr-4"><Skeleton className="ml-auto h-4 w-16" /></td>
                  </tr>
                ))
              ) : analyses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6">
                    <div className="rounded-sm border border-dashed border-slate-ink/60 px-6 py-8 text-center">
                      <Layers className="mx-auto mb-2 size-8 text-channel" aria-hidden="true" />
                      <p className="font-mono text-sm font-medium text-abyss">
                        No recent analyses recorded
                      </p>
                      <p className="mt-1 font-mono text-xs text-slate-ink">
                        Run a new scenario to evaluate voyage charter savings.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                analyses.map((item) => (
                  <tr key={item.id} className="transition-colors duration-150 hover:bg-shoal/60">
                    {/* Trade route */}
                    <td className="py-3.5 pl-4 pr-3">
                      <div className="flex items-center gap-1.5 font-medium text-abyss">
                        <span className="truncate">{item.origin_port}</span>
                        <span aria-hidden="true" className="text-slate-ink">→</span>
                        <span className="truncate">{item.destination_port}</span>
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-ink">
                        {item.origin_country}
                      </div>
                    </td>

                    {/* Cargo */}
                    <td className="px-3 py-3.5">
                      <div className="font-mono tabular-nums text-abyss">
                        {item.parcel_tonnage.toLocaleString()} <span className="text-slate-ink">MT</span>
                      </div>
                      <div className="text-xs text-deepsea">{item.commodity}</div>
                    </td>

                    {/* Vessel */}
                    <td className="px-3 py-3.5">
                      <Pill tone="muted">{item.recommended_vessel}</Pill>
                    </td>

                    {/* Forecast vs spot */}
                    <td className="px-3 py-3.5">
                      <div className="font-mono tabular-nums text-abyss">
                        ${item.predicted_rate_pmt.toFixed(2)}
                        <span className="text-slate-ink"> / MT</span>
                      </div>
                      <div className="font-mono text-xs tabular-nums text-slate-ink">
                        Spot: ${item.benchmark_spot_pmt.toFixed(2)}
                      </div>
                    </td>

                    {/* Savings — Slate ink: Deep is 3.5:1, below AA at 14px */}
                    <td className="px-3 py-3.5">
                      <span className="font-mono font-medium tabular-nums text-slate-ink">
                        <span aria-hidden="true" className="mr-0.5 text-[8px]">▲</span>
                        +${Math.round(item.estimated_savings_usd).toLocaleString()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3.5">{renderStatusBadge(item.status)}</td>

                    {/* Time */}
                    <td className="py-3.5 pl-3 pr-4 text-right font-mono text-xs tabular-nums text-slate-ink">
                      {formatDate(item.created_at)}
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

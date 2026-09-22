import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  TrendingUp,
  Anchor,
  Calendar,
  Compass,
  ShieldAlert,
  Clock,
  Plus,
  RefreshCw,
} from "lucide-react";
import { GlobalMetricsStrip } from "../components/GlobalMetricsStrip";
import { RecentAnalysesTable } from "../components/RecentAnalysesTable";
import { NewAnalysisDrawer } from "../components/NewAnalysisDrawer";
import { API_BASE } from "../api";
import { PrimaryButton, Card, VerifiedDot } from "../components/ui";
import type { AnalysisObject } from "../types/analysis";

/* Shared indicator tile: Foam fill + hairline ring; mono 600 value. */
const METRIC_CARD = "p-4";

export const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisObject[]>([]);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const isPlanner = user?.role === "logistics_planner";

  const fetchAnalyses = useCallback(async () => {
    if (!token) {
      setIsLoadingAnalyses(false);
      return;
    }
    setIsLoadingAnalyses(true);
    setFetchError(null);
    try {
      const res = await fetch(`${API_BASE}/analyses/recent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: AnalysisObject[] = await res.json();
        setAnalyses(data);
      } else {
        setFetchError(`Couldn't load recent analyses (server responded ${res.status}).`);
      }
    } catch {
      setFetchError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsLoadingAnalyses(false);
    }
  }, [token]);

  useEffect(() => {
    if (isPlanner) {
      fetchAnalyses();
    }
  }, [isPlanner, fetchAnalyses]);

  if (!user) return null;

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      {/* Desk header — 32px weight-400 chart-caption voice */}
      <section aria-labelledby="page-title" className="pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-slate-ink">
              <VerifiedDot />
              {isPlanner ? "FR8-PLN / FREIGHT DESK" : "PRT-OPS / OPERATIONS DESK"}
            </div>
            <h1 id="page-title" className="text-[32px] font-normal leading-tight text-abyss">
              {isPlanner ? "Freight & Bulk Chartering Desk" : "Vessel & Port Operations Panel"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-deepsea">
              {isPlanner
                ? "Forecast freight volatility across major coal trade lanes, identify optimal charter contract entry windows, and optimize vessel parcel sizes for Indian East Coast terminals."
                : "Monitor berth readiness, tidal draft clearance, LOA compliance, and vessel turnaround schedules across Paradip, Vizag, Gangavaram, and Haldia."}
            </p>
          </div>
          {isPlanner && (
            <div className="shrink-0">
              <PrimaryButton onClick={() => setIsDrawerOpen(true)}>
                <Plus className="size-4" aria-hidden="true" />
                <span>Run New Analysis</span>
              </PrimaryButton>
            </div>
          )}
        </div>
      </section>

      {/* Global freight metrics */}
      {isPlanner && (
        <div className="mb-8">
          <GlobalMetricsStrip />
        </div>
      )}

      {/* Fetch failure surface — a hazard, marked like a chart hazard */}
      {fetchError && (
        <div
          role="alert"
          className="mb-8 flex flex-col gap-3 rounded-sm border border-dotted border-slate-ink/60 p-4 sm:flex-row sm:items-center"
        >
          <span
            aria-hidden="true"
            className="flex size-6 shrink-0 items-center justify-center rounded-sm border border-abyss/50 font-mono text-sm font-semibold text-abyss"
          >
            !
          </span>
          <p className="flex-1 text-sm font-semibold text-abyss">{fetchError}</p>
          <button
            type="button"
            onClick={fetchAnalyses}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-shallow/45 px-3.5 py-2 font-mono text-xs font-medium text-abyss transition-colors duration-150 hover:bg-shoal"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Primary indicator row — dense 3-up tiles */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {isPlanner ? (
          <>
            <Card className={METRIC_CARD}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-ink">
                  SPOT VS PERIOD GAP
                </span>
                <TrendingUp className="size-4 text-deep" aria-hidden="true" />
              </div>
              <div className="font-mono text-2xl font-semibold tabular-nums text-abyss">
                -14.2%
              </div>
              <p className="mt-2 text-xs leading-relaxed text-deepsea">
                Short-term voyage contracts currently show significant cost advantage over daily
                spot market exploration.
              </p>
            </Card>

            <Card className={METRIC_CARD}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-ink">
                  FORECASTED WINDOW
                </span>
                <Calendar className="size-4 text-deep" aria-hidden="true" />
              </div>
              <div className="font-mono text-2xl font-semibold tabular-nums text-abyss">
                OCT 05–18
              </div>
              <p className="mt-2 text-xs leading-relaxed text-deepsea">
                Capesize rates on Hay Point / Gladstone to Paradip route expected to dip to 90-day
                low.
              </p>
            </Card>

            <Card className={METRIC_CARD}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-ink">
                  VESSEL PARCEL PAIRING
                </span>
                <Compass className="size-4 text-deep" aria-hidden="true" />
              </div>
              <div className="font-mono text-2xl font-semibold tabular-nums text-abyss">
                PMX 75K
              </div>
              <p className="mt-2 text-xs leading-relaxed text-deepsea">
                Complies with current 14.5m draft constraints at Haldia Lock Gate and Paradip Berth
                #2.
              </p>
            </Card>
          </>
        ) : (
          <>
            <Card className={METRIC_CARD}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-ink">
                  BERTH AVAILABILITY
                </span>
                <Anchor className="size-4 text-deep" aria-hidden="true" />
              </div>
              <div className="font-mono text-2xl font-semibold tabular-nums text-abyss">
                3 READY
              </div>
              <p className="mt-2 text-xs leading-relaxed text-deepsea">
                Mechanized Coal Berths at Paradip &amp; Vizag Outer Harbor open for immediate
                discharge.
              </p>
            </Card>

            <Card className={METRIC_CARD}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-ink">
                  DRAFT ADVISORY
                </span>
                <ShieldAlert className="size-4 text-fathom" aria-hidden="true" />
              </div>
              <div className="font-mono text-2xl font-semibold tabular-nums text-abyss">
                14.5M MAX
              </div>
              <p className="mt-2 text-xs leading-relaxed text-deepsea">
                Sagar-Sandheads transshipment advisory active for incoming Capesize bulk carriers.
              </p>
            </Card>

            <Card className={METRIC_CARD}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-ink">
                  AVG TURNAROUND
                </span>
                <Clock className="size-4 text-deep" aria-hidden="true" />
              </div>
              <div className="font-mono text-2xl font-semibold tabular-nums text-abyss">41.8H</div>
              <p className="mt-2 text-xs leading-relaxed text-deepsea">
                Idle waiting time reduced by 6.4 hours with automated tender pre-dispatch.
              </p>
            </Card>
          </>
        )}
      </div>

      {/* Recent analyses feed (Freight Desk) */}
      {isPlanner && (
        <div className="mt-12">
          <RecentAnalysesTable
            analyses={analyses}
            isLoading={isLoadingAnalyses}
            onRefresh={fetchAnalyses}
          />
        </div>
      )}

      {/* Interactive simulation drawer */}
      <NewAnalysisDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onAnalysisCreated={fetchAnalyses}
      />
    </main>
  );
};

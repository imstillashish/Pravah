import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Anchor,
  ShieldAlert,
  Clock,
  Plus,
  RefreshCw,
  Globe,
} from "lucide-react";
import { GlobalMetricsStrip } from "../components/GlobalMetricsStrip";
import { RecentAnalysesTable } from "../components/RecentAnalysesTable";
import { NewAnalysisDrawer } from "../components/NewAnalysisDrawer";
import { MaritimeGlobe } from "../components/MaritimeGlobe";
import { API_BASE } from "../api";
import { PrimaryButton, Card } from "../components/ui";
import type { AnalysisObject } from "../types/analysis";

/* Shared indicator tile padding. */
const METRIC_CARD = "p-4";

export const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisObject[]>([]);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [showGlobe, setShowGlobe] = useState<boolean>(true);

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

  const hour = new Date().getHours();
  const daypart =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName =
    user.full_name?.split(" ")[0] ?? user.email?.split("@")[0] ?? "operator";
  const dateLabel = new Date()
    .toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })
    .toUpperCase();
  const deskCode = isPlanner ? "FR8-PLN" : "PRT-OPS";

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      {/* Greeting band — mono eyebrow + 36px Inter 700 greeting (spec §7) */}
      <section aria-labelledby="page-title" className="pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.08em] text-slate">
              {deskCode} · {dateLabel}
            </div>
            <h1 id="page-title" className="text-4xl font-bold tracking-tight text-obsidian">
              {daypart}, {firstName}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-charcoal">
              {isPlanner
                ? "Forecast freight volatility across major coal trade lanes, identify optimal charter contract entry windows, and optimize vessel parcel sizes for Indian East Coast terminals."
                : "Monitor berth readiness, tidal draft clearance, LOA compliance, and vessel turnaround schedules across Paradip, Vizag, Gangavaram, and Haldia."}
            </p>
          </div>
          {isPlanner && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowGlobe(!showGlobe)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-pebble bg-paper px-3.5 py-2 text-xs font-semibold text-charcoal shadow-sm transition hover:border-forest-ink hover:text-forest-ink"
                title="Toggle 3D Global Trade Lane Radar"
              >
                <Globe className="size-3.5 text-lime-voltage" />
                <span>{showGlobe ? "Hide 3D Radar" : "Show 3D Radar"}</span>
              </button>
              <PrimaryButton onClick={() => setIsDrawerOpen(true)}>
                <Plus className="size-4" aria-hidden="true" />
                <span>Run New Analysis</span>
              </PrimaryButton>
            </div>
          )}
        </div>
      </section>

      {/* 3D Maritime Global Trade Radar Banner */}
      {showGlobe && (
        <section aria-label="3D Maritime Trade Route Radar" className="mb-8">
          <div className="relative overflow-hidden rounded-2xl border border-pebble bg-forest-ink p-6 text-paper shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="z-10 max-w-lg">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="flex size-2 rounded-full bg-lime-voltage" />
                  <span className="font-mono text-[11px] font-semibold tracking-wider text-lime-voltage uppercase">
                    Live Indian Ocean Vessel Radar
                  </span>
                </div>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-paper">
                  Real-Time Trade Lanes & Corridors
                </h2>
                <p className="mt-1 text-sm text-paper/80 leading-relaxed">
                  Interactive spatial telemetry tracking Capesize & Panamax bulk carrier transits across Australia (Gladstone/Hay Point), Indonesia (Taboneo), and South Africa (Richards Bay) to Indian East Coast terminals.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-mono">
                  <span className="rounded bg-paper/10 px-2.5 py-1 text-lime-voltage">
                    ● Paradip · 14.5m Draft
                  </span>
                  <span className="rounded bg-paper/10 px-2.5 py-1 text-lime-voltage">
                    ● Vizag · 16.5m Draft
                  </span>
                  <span className="rounded bg-paper/10 px-2.5 py-1 text-lime-voltage">
                    ● Haldia · 8.2m Draft
                  </span>
                  <span className="rounded bg-paper/10 px-2.5 py-1 text-amber-300">
                    7 Active Corridors
                  </span>
                </div>
                <div className="mt-3 text-[11px] text-paper/50">
                  Tip: Click and drag the sphere to rotate viewing angle
                </div>
              </div>

              {/* 3D Canvas */}
              <div className="relative mx-auto lg:mx-0 h-[220px] w-[260px] sm:h-[240px] sm:w-[300px]">
                <MaritimeGlobe className="h-full w-full" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Global freight metrics */}
      {isPlanner && (
        <div className="mb-8">
          <GlobalMetricsStrip />
        </div>
      )}

      {/* Fetch failure surface — Wise danger recipe: Fog fill + Alarm Red (spec §3) */}
      {fetchError && (
        <div
          role="alert"
          className="mb-8 flex flex-col gap-3 rounded-card border border-pebble bg-fog p-4 sm:flex-row sm:items-center"
        >
          <span
            aria-hidden="true"
            className="flex size-6 shrink-0 items-center justify-center rounded-full border border-alarm-red/40 bg-paper font-mono text-sm font-semibold text-alarm-red"
          >
            !
          </span>
          <p className="flex-1 text-sm font-semibold text-alarm-red">{fetchError}</p>
          <button
            type="button"
            onClick={fetchAnalyses}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-alarm-red/40 bg-paper px-3.5 py-2 font-mono text-xs font-semibold text-alarm-red transition-colors duration-150 hover:brightness-95"
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
            <Card tone="fog" className={METRIC_CARD}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate">
                  SPOT VS PERIOD GAP
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-emerald-wash px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-profit">
                  SAVINGS OPPORTUNITY
                </span>
              </div>
              <div className="font-mono text-2xl font-bold tabular-nums text-emerald-profit">
                -14.2%
              </div>
              <p className="mt-2 text-xs leading-relaxed text-charcoal">
                Short-term voyage contracts currently show significant cost advantage over daily
                spot market exploration.
              </p>
            </Card>

            <Card tone="fog" className={METRIC_CARD}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate">
                  FORECASTED WINDOW
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-linen-mist px-2 py-0.5 font-mono text-[10px] font-semibold text-signal-blue">
                  AI RECOMMENDATION
                </span>
              </div>
              <div className="font-mono text-2xl font-bold tabular-nums text-forest-ink">
                OCT 05–18
              </div>
              <p className="mt-2 text-xs leading-relaxed text-charcoal">
                Capesize rates on Hay Point / Gladstone to Paradip route expected to dip to 90-day
                low.
              </p>
            </Card>

            <Card tone="fog" className={METRIC_CARD}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate">
                  VESSEL PARCEL PAIRING
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-amber-wash px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-warning">
                  BERTH OPTIMAL
                </span>
              </div>
              <div className="font-mono text-2xl font-bold tabular-nums text-forest-ink">
                PMX 75K
              </div>
              <p className="mt-2 text-xs leading-relaxed text-charcoal">
                Complies with current 14.5m draft constraints at Haldia Lock Gate and Paradip Berth
                #2.
              </p>
            </Card>
          </>
        ) : (
          <>
            <Card tone="fog" className={METRIC_CARD}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-charcoal">
                  BERTH AVAILABILITY
                </span>
                <Anchor className="size-4 text-forest-ink" aria-hidden="true" />
              </div>
              <div className="font-mono text-2xl font-semibold tabular-nums text-forest-ink">
                3 READY
              </div>
              <p className="mt-2 text-xs leading-relaxed text-charcoal">
                Mechanized Coal Berths at Paradip &amp; Vizag Outer Harbor open for immediate
                discharge.
              </p>
            </Card>

            <Card tone="fog" className={METRIC_CARD}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-charcoal">
                  DRAFT ADVISORY
                </span>
                <ShieldAlert className="size-4 text-signal-blue" aria-hidden="true" />
              </div>
              <div className="font-mono text-2xl font-semibold tabular-nums text-forest-ink">
                14.5M MAX
              </div>
              <p className="mt-2 text-xs leading-relaxed text-charcoal">
                Sagar-Sandheads transshipment advisory active for incoming Capesize bulk carriers.
              </p>
            </Card>

            <Card tone="fog" className={METRIC_CARD}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-charcoal">
                  AVG TURNAROUND
                </span>
                <Clock className="size-4 text-forest-ink" aria-hidden="true" />
              </div>
              <div className="font-mono text-2xl font-semibold tabular-nums text-forest-ink">41.8H</div>
              <p className="mt-2 text-xs leading-relaxed text-charcoal">
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

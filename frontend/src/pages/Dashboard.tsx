import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Anchor,
  ShieldAlert,
  Clock,
  Plus,
  RefreshCw,
} from "lucide-react";
import { GlobalMetricsStrip } from "../components/GlobalMetricsStrip";
import { RecentAnalysesTable } from "../components/RecentAnalysesTable";
import { NewAnalysisDrawer } from "../components/NewAnalysisDrawer";
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

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      {/* Greeting band — mono eyebrow + 36px Inter 700 greeting (spec §7) */}
      <section aria-labelledby="page-title" className="pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.08em] text-slate">{dateLabel}</div>
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
            <div className="shrink-0">
              <PrimaryButton onClick={() => { window.location.hash = "#new-analysis"; }}>
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

      {/* Feature #25: Maritime Disruption Alert Scanner */}
      <div
        data-tour="disruption-alert"
        className="mb-6 flex items-center justify-between rounded-card border border-amber-300 bg-amber-50/80 p-3.5 text-amber-900 shadow-xs"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-900 font-bold text-xs">
            !
          </span>
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-800">
              <span>ACTIVE MARITIME ADVISORY</span>
              <span>•</span>
              <span>RED SEA SUEZ DIVERSION</span>
            </div>
            <p className="text-xs text-amber-950 mt-0.5">
              Bulk carriers re-routing via Cape of Good Hope (+10 to 14 transit days). Australian coking coal routes to Indian East Coast remain clear of chokepoints.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            window.location.hash = "#scenario";
          }}
          className="hidden shrink-0 rounded-full bg-amber-200/80 px-2.5 py-1 font-mono text-[10px] font-semibold text-amber-900 hover:brightness-95 sm:inline-block"
        >
          What does this mean for me?
        </button>
      </div>

      {/* Primary indicator row — dense 4-up tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isPlanner ? (
          <>
            <Card tone="fog" className={METRIC_CARD}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate">
                  SHORT-TERM VS DAILY MARKET
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-emerald-wash px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-profit">
                  SAVES MONEY
                </span>
              </div>
              <div className="font-mono text-2xl font-bold tabular-nums text-emerald-profit">
                -14.2%
              </div>
              <p className="mt-2 text-xs leading-relaxed text-charcoal">
                Booking a short-term contract today costs about 14% less than buying at the daily
                market rate.
              </p>
            </Card>

            <Card tone="fog" className={METRIC_CARD}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate">
                  CHEAPEST BOOKING WINDOW
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-linen-mist px-2 py-0.5 font-mono text-[10px] font-semibold text-signal-blue">
                  BEST TIME TO BOOK
                </span>
              </div>
              <div className="font-mono text-2xl font-bold tabular-nums text-forest-ink">
                OCT 05–18
              </div>
              <p className="mt-2 text-xs leading-relaxed text-charcoal">
                Rates for coal from Australia to Paradip are expected to hit a 90-day low between
                these dates.
              </p>
            </Card>

            <Card tone="fog" className={METRIC_CARD}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate">
                  RECOMMENDED SHIP SIZE
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-amber-wash px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-warning">
                  FITS YOUR BERTHS
                </span>
              </div>
              <div className="font-mono text-2xl font-bold tabular-nums text-forest-ink">
                ~75,000 tons
              </div>
              <p className="mt-2 text-xs leading-relaxed text-charcoal">
                A ship this size clears the 14.5 m depth limit at Haldia and berths at Paradip.
              </p>
            </Card>

            {/* Feature #21: Steel Plant Stock-Out Alert */}
            <Card data-tour="stockout-alert" tone="fog" className={METRIC_CARD}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate">
                  COAL LEFT AT THE PLANT
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-amber-wash px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-warning">
                  15 DAYS LEFT
                </span>
              </div>
              <div className="font-mono text-2xl font-bold tabular-nums text-forest-ink">
                15 days / 22 to deliver
              </div>
              <p className="mt-2 text-xs leading-relaxed text-charcoal">
                Bhilai would run short before a new shipment arrives — book within 3 days to be safe.
              </p>
            </Card>
          </>
        ) : (
          <>
            <Card tone="fog" className={METRIC_CARD}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-charcoal">
                  BERTHS FREE NOW
                </span>
                <Anchor className="size-4 text-forest-ink" aria-hidden="true" />
              </div>
              <div className="font-mono text-2xl font-semibold tabular-nums text-forest-ink">
                3 READY
              </div>
              <p className="mt-2 text-xs leading-relaxed text-charcoal">
                Three berths are open for immediate discharge at Paradip and Vizag Outer Harbor.
              </p>
            </Card>

            <Card tone="fog" className={METRIC_CARD}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-charcoal">
                  WATER DEPTH LIMIT
                </span>
                <ShieldAlert className="size-4 text-signal-blue" aria-hidden="true" />
              </div>
              <div className="font-mono text-2xl font-semibold tabular-nums text-forest-ink">
                14.5M MAX
              </div>
              <p className="mt-2 text-xs leading-relaxed text-charcoal">
                Ships drawing more than 14.5 m cannot berth right now, so cargo is transshipped.
              </p>
            </Card>

            <Card tone="fog" className={METRIC_CARD}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-charcoal">
                  AVERAGE TIME IN PORT
                </span>
                <Clock className="size-4 text-forest-ink" aria-hidden="true" />
              </div>
              <div className="font-mono text-2xl font-semibold tabular-nums text-forest-ink">41.8H</div>
              <p className="mt-2 text-xs leading-relaxed text-charcoal">
                Ships spend about 41.8 hours in port on average, down 6.4 hours with pre-dispatch.
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

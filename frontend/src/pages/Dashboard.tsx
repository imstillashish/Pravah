import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Warning,
  Bell,
  ClipboardText,
  Clock,
  Coins,
  Files,
  Plus,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { GlobalMetricsStrip } from "../components/GlobalMetricsStrip";
import { RecentAnalysesTable } from "../components/RecentAnalysesTable";
import { NewAnalysisDrawer } from "../components/NewAnalysisDrawer";
import { API_BASE } from "../api";
import { PrimaryButton, Card } from "../components/ui";
import type { AnalysisObject, DashboardSummary } from "../types/analysis";

/* Shared indicator tile padding. */
const METRIC_CARD = "p-4";

const ALERT_STYLE: Record<string, string> = {
  high: "border-alarm-red/40",
  medium: "border-amber-warning/40",
  info: "border-signal-blue/40",
};

const ALERT_ICON: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>> = {
  high: Warning,
  medium: Clock,
  info: Bell,
};

const ALERT_TEXT: Record<string, string> = {
  high: "text-alarm-red",
  medium: "text-amber-warning",
  info: "text-signal-blue",
};

/* Severity word chips: charcoal on fog clears 4.5:1 at 10px (signal-blue/amber
   on fog measure 3.7/3.9 — reserved for the icon, which axe exempts). */
const ALERT_CHIP: Record<string, string> = {
  high: "text-alarm-red",
  medium: "text-amber-warning",
  info: "text-charcoal",
};

export const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisObject[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const fetchAnalyses = useCallback(async () => {
    if (!token) {
      setIsLoadingAnalyses(false);
      return;
    }
    setIsLoadingAnalyses(true);
    setFetchError(null);
    try {
      const [summaryRes, recentRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/analyses/recent`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (summaryRes.ok) {
        setSummary(await summaryRes.json());
      }
      if (recentRes.ok) {
        setAnalyses(await recentRes.json());
      } else {
        setFetchError(`Couldn't load recent analyses (server responded ${recentRes.status}).`);
      }
    } catch {
      setFetchError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsLoadingAnalyses(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchAnalyses();
    }
  }, [token, fetchAnalyses]);

  if (!user) return null;

  const hour = new Date().getHours();
  const daypart =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName =
    user.full_name?.split(" ")[0] ?? user.email?.split("@")[0] ?? "operator";
  const dateLabel = new Date()
    .toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })
    .toUpperCase();

  const savingsLabel = summary
    ? `$${Math.round(summary.total_savings_usd).toLocaleString("en-US")}`
    : "—";

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      {/* Greeting band — mono eyebrow + 36px Inter 700 greeting (spec §7) */}
      <section aria-labelledby="page-title" className="pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.08em] text-slate">
              FREIGHT DESK · {dateLabel}
            </div>
            <h1 id="page-title" className="text-4xl font-bold tracking-tight text-obsidian">
              {daypart}, {firstName}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-charcoal">
              Forecast freight volatility across major coal trade lanes, identify optimal charter
              contract entry windows, and optimize vessel parcel sizes for Indian East Coast
              terminals.
            </p>
          </div>
          <div className="shrink-0">
            <PrimaryButton onClick={() => setIsDrawerOpen(true)}>
              <Plus className="size-4" aria-hidden="true" />
              <span>Run New Analysis</span>
            </PrimaryButton>
          </div>
        </div>
      </section>

      {/* Global freight metrics */}
      <div className="mb-8">
        <GlobalMetricsStrip />
      </div>

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
            <ArrowClockwise className="size-3.5" aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Live desk summary — real counts from GET /api/dashboard/summary (spec §3.2) */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Card tone="fog" className={METRIC_CARD}>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-charcoal">
              ANALYSES RUN
            </span>
            <Files className="size-4 text-forest-ink" aria-hidden="true" />
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-forest-ink">
            {summary ? summary.total_analyses : "—"}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-charcoal">
            {summary && summary.drafts > 0
              ? `${summary.drafts} still in draft — finalize to lock the scenario.`
              : "Every scenario on the desk has been finalized."}
          </p>
        </Card>

        <Card tone="fog" className={METRIC_CARD}>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-charcoal">
              SAVINGS IDENTIFIED
            </span>
            <Coins className="size-4 text-forest-ink" aria-hidden="true" />
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-emerald-profit">
            {savingsLabel}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-charcoal">
            Total estimated savings across your finalized analyses.
          </p>
        </Card>

        <Card tone="fog" className={METRIC_CARD}>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-charcoal">
              ACTIVE ALERTS
            </span>
            <Bell className="size-4 text-forest-ink" aria-hidden="true" />
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-forest-ink">
            {summary ? summary.alerts.length : "—"}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-charcoal">
            {summary && summary.alerts.length > 0
              ? "Stock runways and desk nudges — details below."
              : "Nothing needs attention right now."}
          </p>
        </Card>

        <Card tone="fog" className={METRIC_CARD}>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-charcoal">
              LAST ANALYSIS
            </span>
            <ClipboardText className="size-4 text-forest-ink" aria-hidden="true" />
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-forest-ink">
            {summary?.latest_analysis_at
              ? new Date(summary.latest_analysis_at)
                  .toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
                  .toUpperCase()
              : "—"}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-charcoal">
            {summary?.latest_analysis_at
              ? "Most recent scenario computed on this desk."
              : "Run your first analysis to start the desk log."}
          </p>
        </Card>
      </div>

      {/* Engine-driven alerts — real stock-out runs + freshness nudge (spec §3.3) */}
      {summary && summary.alerts.length > 0 && (
        <section aria-label="Desk alerts" className="mt-8">
          <div className="space-y-2">
            {summary.alerts.map((alert) => {
              const Icon = ALERT_ICON[alert.severity] ?? Bell;
              return (
                <div
                  key={`${alert.kind}-${alert.title}`}
                  className={`flex items-start gap-3 rounded-card border bg-fog p-3.5 ${ALERT_STYLE[alert.severity] ?? "border-pebble"}`}
                >
                  <span
                    className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-paper ${ALERT_TEXT[alert.severity] ?? "text-slate"}`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1 leading-snug">
                    <div className="text-sm font-semibold text-obsidian">{alert.title}</div>
                    <div className="text-xs text-charcoal">{alert.message}</div>
                  </div>
                  <span
                    className={`shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] ${ALERT_CHIP[alert.severity] ?? "text-charcoal"}`}
                  >
                    {alert.severity}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent analyses feed */}
      <div className="mt-12">
        <RecentAnalysesTable
          analyses={analyses}
          isLoading={isLoadingAnalyses}
          onRefresh={fetchAnalyses}
        />
      </div>

      {/* Interactive simulation drawer */}
      <NewAnalysisDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onAnalysisCreated={fetchAnalyses}
      />
    </main>
  );
};

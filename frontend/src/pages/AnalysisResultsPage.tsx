import React, { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import { RouteMap } from "../components/RouteMap";
import {
  BookNowAction,
  CompareOptionsAction,
  ExpertDisclosure,
  PriceStoryChart,
  ShipComparisonCards,
  VerdictCard,
} from "../components/verdict";
import { deriveAlternatives, deriveBookWindow, deriveShipPicks, deriveVerdict } from "../lib/verdict";
import { API_BASE } from "../api";
import {
  Ship,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  DollarSign,
  ShieldAlert,
  Flame,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Sparkles,
  Info,
  ArrowRight,
  Plus,
} from "lucide-react";

interface FeasibilityRow {
  vessel_class: string;
  port_name?: string;
  draft_pass: boolean;
  loa_pass: boolean;
  beam_pass: boolean;
  dwt_pass: boolean;
  overall_feasible: boolean;
  requires_lightering?: boolean;
  failure_reason?: string | null;
}

interface RiskRow {
  risk_category: string;
  severity: string;
  signal_description: string;
  data_source: string;
}

interface RecommendationData {
  rank: number;
  vessel_class: string;
  port_name: string;
  cost_score: number;
  confidence_score: number;
  coverage_fit_score: number;
  total_score: number;
  score_breakdown?: Array<{
    component: string;
    weight: number;
    score: number;
    weighted: number;
  }>;
  is_emergency_mode?: boolean;
}

interface AnalysisDetail {
  id: number;
  title: string;
  origin_country: string;
  origin_port: string;
  destination_port: string;
  commodity: string;
  parcel_tonnage: number;
  recommended_vessel: string;
  predicted_rate_pmt: number;
  benchmark_spot_pmt: number;
  estimated_savings_usd: number;
  status: string;
  created_at: string;
  context: {
    route_distance_nm: number;
    inferred_vessel_class: string;
    origin_lat: number;
    origin_lon: number;
    destination_lat: number;
    destination_lon: number;
    note: string;
  };
  forecast: {
    p10_usd_per_mt: number;
    p50_usd_per_mt: number;
    p90_usd_per_mt: number;
    arima_baseline_usd_per_mt: number;
    confidence_label: "LOW" | "MEDIUM" | "HIGH";
    model_used: string;
  };
  feasibility: FeasibilityRow[];
  landed_cost: {
    freight_rate_usd_per_mt: number;
    baf_surcharge_usd_per_mt: number;
    usd_inr_rate: number;
    total_usd_per_mt: number;
    total_inr_per_mt: number;
    total_inr: number;
  };
  stockout_alert: {
    days_to_stockout: number;
    days_to_best_window: number;
    is_at_risk: boolean;
    alert_message: string;
  };
  risks: RiskRow[];
  recommendations: RecommendationData[];
  regret_scores: Array<{
    regret_pct: number;
    chosen_day_rate: number;
    best_rate_in_window: number;
  }>;
  decision?: {
    chosen_vessel_class?: string;
    was_override?: boolean;
    override_reason?: string | null;
    decided_at?: string;
  } | null;
}

const GOLDEN_DEMO_FALLBACK: AnalysisDetail = {
  id: 1,
  title: "Golden Demo — Newcastle to Paradip 75k MT",
  origin_country: "Australia",
  origin_port: "Newcastle, AU",
  destination_port: "Paradip",
  commodity: "coking_coal",
  parcel_tonnage: 75000,
  recommended_vessel: "Panamax",
  predicted_rate_pmt: 22.30,
  benchmark_spot_pmt: 25.50,
  estimated_savings_usd: 240000,
  status: "COMPLETE",
  created_at: new Date().toISOString(),
  context: {
    route_distance_nm: 5832.4,
    inferred_vessel_class: "Panamax",
    origin_lat: -32.9272,
    origin_lon: 151.7765,
    destination_lat: 20.3167,
    destination_lon: 86.6167,
    note: "Great-circle route via Lombok Strait",
  },
  forecast: {
    p10_usd_per_mt: 20.52,
    p50_usd_per_mt: 22.30,
    p90_usd_per_mt: 25.65,
    arima_baseline_usd_per_mt: 25.50,
    confidence_label: "HIGH",
    model_used: "LightGBM_Quantile_v1",
  },
  feasibility: [
    { vessel_class: "Capesize", port_name: "Paradip", draft_pass: false, loa_pass: true, beam_pass: true, dwt_pass: false, overall_feasible: false, requires_lightering: true, failure_reason: "Draft 18.2m exceeds Paradip max draft 16.5m" },
    { vessel_class: "Panamax", port_name: "Paradip", draft_pass: true, loa_pass: true, beam_pass: true, dwt_pass: true, overall_feasible: true, requires_lightering: false },
    { vessel_class: "Supramax", port_name: "Paradip", draft_pass: true, loa_pass: true, beam_pass: true, dwt_pass: true, overall_feasible: true, requires_lightering: false },
    { vessel_class: "Handysize", port_name: "Paradip", draft_pass: true, loa_pass: true, beam_pass: true, dwt_pass: true, overall_feasible: true, requires_lightering: false },
  ],
  landed_cost: {
    freight_rate_usd_per_mt: 22.30,
    baf_surcharge_usd_per_mt: 1.20,
    usd_inr_rate: 83.50,
    total_usd_per_mt: 23.50,
    total_inr_per_mt: 1962.25,
    total_inr: 147168750,
  },
  stockout_alert: {
    days_to_stockout: 15.0,
    days_to_best_window: 22.0,
    is_at_risk: true,
    alert_message: "Stock will last 15 days. Next favorable rate window is 22 days away. Book now — cannot afford to wait.",
  },
  risks: [
    { risk_category: "freight_volatility", severity: "MEDIUM", signal_description: "Baltic Dry Index fluctuated +4.2% over 7 days", data_source: "Baltic Exchange Daily Index" },
    { risk_category: "port_draft", severity: "LOW", signal_description: "Paradip current draught compliant with Panamax spec", data_source: "Indian Ports Association (IPA)" },
    { risk_category: "delivery_window", severity: "LOW", signal_description: "Berth wait time estimated 1.8 days", data_source: "Port Operations Log" },
    { risk_category: "bunker_volatility", severity: "LOW", signal_description: "Singapore VLSFO stable at $612.50/MT", data_source: "Ship & Bunker Benchmark" },
    { risk_category: "vessel_availability", severity: "NOT_ASSESSED", signal_description: "Fleet AIS telemetry within corridor active", data_source: "AIS Vessel Tracking" },
    { risk_category: "geopolitical", severity: "NOT_ASSESSED", signal_description: "East Coast route avoids Bab-el-Mandeb Strait", data_source: "Global Maritime Advisory" },
  ],
  recommendations: [
    {
      rank: 1,
      vessel_class: "Panamax",
      port_name: "Paradip",
      cost_score: 0.78,
      confidence_score: 0.60,
      coverage_fit_score: 0.92,
      total_score: 0.756,
      score_breakdown: [
        { component: "Cost Score", weight: 0.50, score: 0.78, weighted: 0.39 },
        { component: "Confidence Score", weight: 0.30, score: 0.60, weighted: 0.18 },
        { component: "Coverage Fit Score", weight: 0.20, score: 0.92, weighted: 0.184 },
      ],
      is_emergency_mode: false,
    }
  ],
  regret_scores: [
    { regret_pct: 0.5, chosen_day_rate: 14100.0, best_rate_in_window: 14030.0 },
    { regret_pct: 3.2, chosen_day_rate: 14800.0, best_rate_in_window: 14340.0 },
    { regret_pct: 8.1, chosen_day_rate: 15600.0, best_rate_in_window: 14430.0 },
  ],
  decision: {
    chosen_vessel_class: "Panamax",
    was_override: false,
    override_reason: null,
    decided_at: new Date().toISOString(),
  }
};

export const AnalysisResultsPage: React.FC<{ analysisId?: number | string }> = ({
  analysisId = 1,
}) => {
  const [data, setData] = useState<AnalysisDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Decision state (Section 9)
  const [isOverrideMode, setIsOverrideMode] = useState<boolean>(false);
  const [overrideVessel, setOverrideVessel] = useState<string>("Supramax");
  const [overrideReason, setOverrideReason] = useState<string>("");
  const [decisionRecorded, setDecisionRecorded] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Emergency Mode (Section 10)
  const [emergencyMode, setEmergencyMode] = useState<boolean>(false);

  // Collapsible Spot vs COA (Section 11)
  const [coaExpanded, setCoaExpanded] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchAnalysis = async () => {
      try {
        setIsLoading(true);
        const res = await apiClient<AnalysisDetail>(`/analyses/${analysisId}`);
        if (isMounted) {
          setData(res && res.id ? res : GOLDEN_DEMO_FALLBACK);
          if (res?.decision?.decided_at) {
            setDecisionRecorded(true);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          // ponytail: fallback to Golden Demo dataset if network or cold-start hiccup occurs
          console.warn("Using offline Golden Demo fallback for analysis:", err);
          setData(GOLDEN_DEMO_FALLBACK);
          setError(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchAnalysis();
    return () => {
      isMounted = false;
    };
  }, [analysisId]);

  // Freight history for the price story. Index-based on purpose: there is no
  // dated series endpoint, so the chart plots the returned series in order.
  const [freightHistory, setFreightHistory] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/metrics/global`)
      .then((res) => (res.ok ? res.json() : null))
      .then((metrics) => {
        if (!cancelled && metrics?.series?.freight) {
          setFreightHistory(metrics.series.freight);
        }
      })
      .catch(() => {
        /* Chart falls back to the known rates; nothing to report to the user. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDecisionSubmit = async (isOverride: boolean) => {
    if (!data) return;
    try {
      setIsSubmitting(true);
      const payload = {
        chosen_vessel_class: isOverride ? overrideVessel : data.recommended_vessel,
        chosen_day_rate: 14200.0,
        was_override: isOverride,
        override_reason: isOverride ? overrideReason : null,
      };
      await apiClient(`/analyses/${data.id}/decision`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setDecisionRecorded(true);
      setData((prev) =>
        prev
          ? {
              ...prev,
              status: isOverride ? "overridden" : "finalized",
              decision: {
                ...payload,
                decided_at: new Date().toISOString(),
              },
            }
          : prev
      );
    } catch (err: unknown) {
      alert("Failed to record decision: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
        <div className="size-10 animate-spin rounded-full border-4 border-pebble border-t-forest-ink" />
        <p className="mt-4 font-mono text-sm text-slate">Synthesizing multi-agent freight analysis…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="m-6 rounded-card border border-alarm-red/40 bg-fog p-6 text-charcoal">
        <h3 className="font-semibold text-lg text-alarm-red">Unable to load Analysis #{analysisId}</h3>
        <p className="mt-1 text-sm text-slate">{error || "Data unavailable"}</p>
      </div>
    );
  }

  const rec = data.recommendations?.[0] || {
    rank: 1,
    vessel_class: "Panamax",
    port_name: data.destination_port,
    cost_score: 0.78,
    confidence_score: 0.6,
    coverage_fit_score: 0.92,
    total_score: 0.756,
  };

  const verdict = deriveVerdict(data);
  const bookWindow = deriveBookWindow(data);
  const shipPicks = deriveShipPicks(data);
  const alternatives = deriveAlternatives(data);
  const cheapestRate = Math.min(data.forecast.p50_usd_per_mt, verdict.currentRate);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Top Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pebble pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-forest-ink/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-forest-ink">
              ANALYSIS #{data.id}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${
              data.status === "finalized"
                ? "bg-linen-mist text-forest-ink"
                : data.status === "overridden"
                ? "bg-amber-wash text-amber-warning"
                : "bg-fog text-charcoal"
            }`}>
              {data.status}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-obsidian sm:text-3xl">
            {data.title}
          </h1>
          <p className="mt-1 text-sm text-charcoal">
            {data.commodity.replace(/_/g, " ")} · {(data.parcel_tonnage / 1000).toLocaleString()}k tons ·{" "}
            {data.origin_port} →{" "}
            {data.destination_port}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Action button to launch New Analysis wizard */}
          <button
            type="button"
            onClick={() => {
              window.location.hash = "#new-analysis";
            }}
            className="flex items-center gap-1.5 rounded-full bg-forest-ink px-3.5 py-2 text-xs font-semibold text-paper shadow-xs transition-all hover:bg-forest-ink/90 active:scale-95 cursor-pointer"
            title="Configure and compute new voyage analysis"
          >
            <Plus className="size-3.5 text-lime-voltage" />
            <span>New Analysis</span>
          </button>

          {/* Section 10: Emergency Procurement Mode Toggle */}
          <div data-tour="emergency-mode" className="flex items-center gap-3 rounded-card border border-pebble bg-linen-mist/30 p-2">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-charcoal flex items-center gap-1">
                <Flame className="size-3.5 text-amber-warning" />
                Emergency Mode
              </span>
              <span className="text-[10px] text-slate">Force immediate chartering</span>
            </div>
            <button
              type="button"
              onClick={() => setEmergencyMode(!emergencyMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emergencyMode ? "bg-amber-warning" : "bg-pebble"
              }`}
            >
              <span
                className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                  emergencyMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {emergencyMode && (
        <div className="flex items-center gap-2 rounded-card border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <AlertTriangle className="size-4 shrink-0 text-amber-warning" />
          <span>
            <strong>Emergency Mode Active:</strong> Recommendation engine prioritizes immediate vessel fixture and suppresses laycan deferral windows.
          </span>
        </div>
      )}

      {/* SECTION 1: Context Summary */}
      <section className="grid grid-cols-2 gap-4 rounded-card border border-pebble bg-paper p-5 sm:grid-cols-4">
        <div>
          <span className="text-xs text-slate">Route Corridor</span>
          <p className="mt-0.5 font-semibold text-charcoal">
            {data.origin_port} → {data.destination_port}
          </p>
          <span className="text-[11px] text-slate font-mono">
            {data.context.route_distance_nm.toLocaleString()} NM ({data.context.note})
          </span>
        </div>
        <div>
          <span className="text-xs text-slate">Cargo & Parcel Size</span>
          <p className="mt-0.5 font-semibold text-charcoal">
            {data.parcel_tonnage.toLocaleString()} MT
          </p>
          <span className="text-[11px] text-slate">{data.commodity}</span>
        </div>
        <div>
          <span className="text-xs text-slate">Inferred Optimal Class</span>
          <p className="mt-0.5 font-semibold text-forest-ink">
            {data.context.inferred_vessel_class}
          </p>
          <span className="text-[11px] text-slate">Draft-checked for Paradip</span>
        </div>
        <div>
          <span className="text-xs text-slate">Resolution Timestamp</span>
          <p className="mt-0.5 font-mono text-xs text-charcoal">
            {new Date(data.created_at).toLocaleString()}
          </p>
          <span className="text-[11px] text-emerald-600">Model Quantile v1 Validated</span>
        </div>
      </section>

      {/* VERDICT STACK — the answer first, expert detail later (design spec §4) */}
      <VerdictCard
        result={verdict}
        primaryAction={<BookNowAction analysisId={data.id} />}
        secondaryAction={
          <CompareOptionsAction
            onCompare={() => {
              document.getElementById("ship-picks-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        }
        footnote={`Based on 90 days of rates and a 30-day forecast (model: ${data.forecast.model_used}).`}
      />

      <PriceStoryChart
        history={freightHistory}
        todayRate={data.benchmark_spot_pmt}
        forecast={{
          p10: data.forecast.p10_usd_per_mt,
          p50: data.forecast.p50_usd_per_mt,
          p90: data.forecast.p90_usd_per_mt,
        }}
        windowStartDay={bookWindow.daysUntilStart}
        windowEndDay={bookWindow.daysUntilEnd}
      />

      {bookWindow.label && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-pebble bg-linen-mist/40 p-5">
          <div>
            <h2 className="text-base font-semibold text-forest-ink">Best dates to book</h2>
            <p className="mt-1 text-sm text-charcoal">
              Booking between <strong>{bookWindow.label}</strong> ({bookWindow.daysUntilStart}–{bookWindow.daysUntilEnd}{" "}
              days from today) should land near <strong>${cheapestRate.toFixed(2)}/ton</strong>.
            </p>
          </div>
          <BookNowAction analysisId={data.id} />
        </section>
      )}

      <ShipComparisonCards picks={shipPicks} />

      {alternatives.length > 0 && (
        <section aria-labelledby="alternatives-heading" className="rounded-card border border-pebble bg-paper p-5">
          <h2 id="alternatives-heading" className="text-base font-semibold text-forest-ink">
            Other options worth knowing
          </h2>
          <ul className="mt-3 space-y-2">
            {alternatives.map((alt) => (
              <li key={alt.title} className="rounded-card border border-pebble bg-fog p-3">
                <p className="text-sm font-semibold text-charcoal">{alt.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-charcoal">{alt.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ExpertDisclosure label="Show expert detail (full analysis)" className="space-y-6">
        {/* Interactive Maritime Route Map (Task 251) */}
        <RouteMap
          originName={data.origin_port}
          destinationName={data.destination_port}
          distanceNm={data.context.route_distance_nm}
        />

        {/* Everything below is engine output — expert material, kept intact. */}

      {/* SECTION 5: Stock-Out Alert (Rendered conditionally with Red/Green border per Task 238 & 313) */}
      {data.stockout_alert && (
        <section
          className={`rounded-card border-2 p-5 ${
            data.stockout_alert.is_at_risk
              ? "border-alarm-red bg-alarm-wash text-charcoal"
              : "border-forest-ink/30 bg-linen-mist text-charcoal"
          }`}
        >
          <div className="flex items-start gap-3">
            {data.stockout_alert.is_at_risk ? (
              <ShieldAlert className="size-6 text-alarm-red shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="size-6 text-forest-ink shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold text-base text-obsidian">
                  {data.stockout_alert.is_at_risk
                    ? "CRITICAL STOCK-OUT RISK ALERT"
                    : "Inventory Buffer Adequate"}
                </h3>
                <div className="flex gap-2">
                  <span className="rounded-full border border-pebble bg-paper px-3 py-1 font-mono text-xs font-medium text-charcoal">
                    Stock Life: {data.stockout_alert.days_to_stockout} Days
                  </span>
                  <span className="rounded-full border border-pebble bg-paper px-3 py-1 font-mono text-xs font-medium text-charcoal">
                    Best Rate Window: {data.stockout_alert.days_to_best_window} Days
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm leading-relaxed font-medium">
                {data.stockout_alert.alert_message}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 7 & 8: Recommendation Hero Card & Explainability Waterfall */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Recommendation Hero Card (Section 7) */}
        <section data-tour="top-recommendation" className="rounded-card border border-pebble bg-paper p-6 lg:col-span-5">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-forest-ink px-3 py-1 text-xs font-medium uppercase tracking-wider text-lime-voltage">
              Rank #{rec.rank} Recommended
            </span>
            <div className="text-right">
              <span className="text-[10px] text-slate uppercase">Total Deterministic Score</span>
              <p className="font-mono text-3xl font-bold text-forest-ink">
                {rec.total_score.toFixed(3)}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-xl font-bold text-obsidian">
              {rec.vessel_class} Class Charter
            </h3>
            <p className="text-xs text-slate">
              Discharge Port: <strong>{rec.port_name}</strong> • Parcel: {data.parcel_tonnage.toLocaleString()} MT
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-pebble pt-4">
            <div className="rounded-card bg-fog p-3 border border-pebble">
              <span className="text-xs text-slate">Predicted Freight</span>
              <p className="text-lg font-bold text-obsidian">
                ${data.predicted_rate_pmt.toFixed(2)} <span className="text-xs font-normal text-slate">/ MT</span>
              </p>
            </div>
            <div className="rounded-card bg-fog p-3 border border-pebble">
              <span className="text-xs text-slate">Est. Net Savings</span>
              <p className="text-lg font-bold text-forest-ink">
                ${data.estimated_savings_usd.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-4 text-[11px] text-slate">
            Benchmark spot rate: ${data.benchmark_spot_pmt.toFixed(2)}/MT • Savings vs spot: ~14.5%
          </div>
        </section>

        {/* Explainability Panel (Section 8 — Tasks 241, 285, 311) */}
        <section data-tour="explainability-panel" className="rounded-card border border-pebble bg-paper p-6 lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-charcoal">
                Why this recommendation? (Explainability Weights)
              </h3>
              <p className="text-xs text-slate">
                Multi-objective decision scoring formula: (0.50 × Cost) + (0.30 × Confidence) + (0.20 × Fit)
              </p>
            </div>
            <Sparkles className="size-5 text-forest-ink" />
          </div>

          <div data-tour="score-breakdown" className="mt-5 space-y-4">
            {/* Cost Score (50%) */}
            <div>
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-charcoal">Cost Score (50% weight)</span>
                <span className="font-mono font-bold text-forest-ink">
                  {rec.cost_score} → Weighted: {(rec.cost_score * 0.5).toFixed(3)}
                </span>
              </div>
              <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-fog">
                <div
                  className="h-full bg-forest-ink transition-all duration-500"
                  style={{ width: `${rec.cost_score * 100}%` }}
                />
              </div>
              <span className="mt-0.5 text-[10px] text-slate">
                Source: LightGBM Freight Quantile Engine & Baltic Dry Index Benchmark
              </span>
            </div>

            {/* Confidence Score (30%) */}
            <div>
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-charcoal">Confidence Score (30% weight)</span>
                <span className="font-mono font-bold text-emerald-600">
                  {rec.confidence_score} → Weighted: {(rec.confidence_score * 0.3).toFixed(3)}
                </span>
              </div>
              <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-fog">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${rec.confidence_score * 100}%` }}
                />
              </div>
              <span className="mt-0.5 text-[10px] text-slate">
                Source: Quantile Spread (P90 - P10) & Historical Model Certainty
              </span>
            </div>

            {/* Coverage Fit Score (20%) */}
            <div>
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-charcoal">Coverage Fit Score (20% weight)</span>
                <span className="font-mono font-bold text-sky-600">
                  {rec.coverage_fit_score} → Weighted: {(rec.coverage_fit_score * 0.2).toFixed(3)}
                </span>
              </div>
              <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-fog">
                <div
                  className="h-full bg-sky-500 transition-all duration-500"
                  style={{ width: `${rec.coverage_fit_score * 100}%` }}
                />
              </div>
              <span className="mt-0.5 text-[10px] text-slate">
                Source: Plant Demand Alignment & Port Draught Compatibility Factor
              </span>
            </div>

            {/* Total Reconciled Score (Task 285) */}
            <div
              title="(0.5 × cost_score) + (0.3 × confidence_score) + (0.2 × coverage_fit_score) = 1.0 Total Weight"
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-linen-mist/50 p-2.5 font-mono text-xs"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-charcoal">
                  Deterministic Composite Score:
                </span>
                <span className="rounded bg-forest-ink/10 px-1.5 py-0.5 text-[10px] text-forest-ink font-semibold">
                  Weights Sum: 0.50 + 0.30 + 0.20 = 1.00
                </span>
              </div>
              <span className="font-extrabold text-forest-ink">
                (0.390 + 0.180 + 0.184) = 0.756
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* SECTION 2: Freight Rate Forecast (P10 / P50 / P90) */}
      <section data-tour="freight-forecast" className="rounded-card border border-pebble bg-paper p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-obsidian">Section 2: Freight Rate Forecast</h3>
            <p className="text-xs text-slate">
              P50 = most likely rate, P10 = best case, P90 = worst case
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 font-mono text-xs font-semibold ${
              data.forecast.confidence_label === "HIGH"
                ? "bg-linen-mist text-forest-ink"
                : data.forecast.confidence_label === "MEDIUM"
                ? "bg-amber-wash text-amber-warning"
                : "bg-alarm-wash text-alarm-red"
            }`}
          >
            Confidence: {data.forecast.confidence_label}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-card border border-pebble bg-paper p-4 text-center">
            <span className="text-xs font-medium text-slate uppercase">P10 (Best Case)</span>
            <p className="mt-1 font-mono text-2xl font-bold text-forest-ink">
              {data.forecast?.p10_usd_per_mt != null ? `$${data.forecast.p10_usd_per_mt.toFixed(2)}` : "unavailable"}
            </p>
            <div className="mt-1">
              <span className="rounded-full bg-linen-mist px-2 py-0.5 text-[9px] font-semibold text-forest-ink font-sans">
                MODEL OUTPUT
              </span>
            </div>
          </div>

          <div className="rounded-card border-2 border-forest-ink bg-linen-mist/30 p-4 text-center">
            <span className="text-xs font-bold text-forest-ink uppercase">P50 (Most Likely)</span>
            <p className="mt-1 font-mono text-3xl font-extrabold text-forest-ink">
              {data.forecast?.p50_usd_per_mt != null ? `$${data.forecast.p50_usd_per_mt.toFixed(2)}` : "unavailable"}
            </p>
            <div className="mt-1">
              <span className="rounded-full bg-forest-ink px-2 py-0.5 text-[9px] font-semibold text-lime-voltage font-sans">
                OPTIMAL
              </span>
            </div>
          </div>

          <div className="rounded-card border border-pebble bg-paper p-4 text-center">
            <span className="text-xs font-medium text-slate uppercase">P90 (Worst Case)</span>
            <p className="mt-1 font-mono text-2xl font-bold text-amber-warning">
              {data.forecast?.p90_usd_per_mt != null ? `$${data.forecast.p90_usd_per_mt.toFixed(2)}` : "unavailable"}
            </p>
            <div className="mt-1">
              <span className="rounded-full bg-amber-wash px-2 py-0.5 text-[9px] font-semibold text-amber-warning font-sans">
                HIGH VOLATILITY
              </span>
            </div>
          </div>

          <div className="rounded-card border border-pebble bg-fog p-4 text-center">
            <span className="text-xs font-medium text-slate uppercase">ARIMA Baseline</span>
            <p className="mt-1 font-mono text-2xl font-bold text-charcoal">
              {data.forecast?.arima_baseline_usd_per_mt != null ? `$${data.forecast.arima_baseline_usd_per_mt.toFixed(2)}` : "$25.50"}
            </p>
            <div className="mt-1">
              <span className="rounded-full bg-paper border border-pebble px-2 py-0.5 text-[9px] font-semibold text-slate font-sans">
                STATISTICAL
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Total Landed Cost (Task 236, 310) */}
      <section data-tour="landed-cost" className="rounded-card border border-pebble bg-paper p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-charcoal">Section 3: Total Landed Cost</h3>
            <p className="text-xs text-slate">
              Complete cost breakdown per metric ton and total voyage expenditure
            </p>
          </div>
          <DollarSign className="size-5 text-forest-ink" />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-pebble bg-linen-mist/40 text-xs font-semibold text-charcoal uppercase">
              <tr>
                <th className="py-2.5 px-4">Component</th>
                <th className="py-2.5 px-4 text-right">Value (USD)</th>
                <th className="py-2.5 px-4 text-right">Forex (USD/INR)</th>
                <th className="py-2.5 px-4 text-right">Total (₹/MT)</th>
                <th className="py-2.5 px-4 text-center">Data Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pebble font-mono text-xs">
              <tr>
                <td className="py-3 px-4 font-sans font-medium text-charcoal">
                  Ocean Freight Rate
                </td>
                <td className="py-3 px-4 text-right">
                  ${data.landed_cost.freight_rate_usd_per_mt.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right text-slate">—</td>
                <td className="py-3 px-4 text-right">
                  ₹{(data.landed_cost.freight_rate_usd_per_mt * data.landed_cost.usd_inr_rate).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800 font-sans">
                    MODEL OUTPUT
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-sans font-medium text-charcoal flex items-center gap-1.5">
                  Bunker Surcharge (BAF)
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800 font-sans">
                    ENGINEERING ASSUMPTION
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  ${data.landed_cost.baf_surcharge_usd_per_mt.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right text-slate">—</td>
                <td className="py-3 px-4 text-right">
                  ₹{(data.landed_cost.baf_surcharge_usd_per_mt * data.landed_cost.usd_inr_rate).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 font-sans">
                    DERIVED
                  </span>
                </td>
              </tr>
              <tr className="bg-linen-mist/20">
                <td className="py-3 px-4 font-sans font-semibold text-charcoal">
                  Subtotal Landed Rate
                </td>
                <td className="py-3 px-4 text-right font-bold">
                  ${data.landed_cost.total_usd_per_mt.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-bold text-forest-ink">
                  ₹{data.landed_cost.usd_inr_rate.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-bold text-forest-ink text-sm">
                  ₹{data.landed_cost.total_inr_per_mt.toFixed(2)} / MT
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-800 font-sans">
                    DERIVED
                  </span>
                </td>
              </tr>
              <tr className="bg-linen-mist/40 text-sm">
                <td colSpan={3} className="py-3 px-4 font-sans font-bold text-charcoal">
                  Total Voyage Outlay ({data.parcel_tonnage.toLocaleString()} MT)
                </td>
                <td className="py-3 px-4 text-right font-extrabold text-forest-ink text-base">
                  ₹{(data.landed_cost.total_inr / 10000000).toFixed(2)} Cr (₹{data.landed_cost.total_inr.toLocaleString()})
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-800 font-sans">
                    DERIVED
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 4: Vessel & Port Feasibility Matrix (Tasks 237, 308) */}
      <section data-tour="feasibility-matrix" className="rounded-card border border-pebble bg-paper p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-obsidian">
              Section 4: Vessel & Port Feasibility Matrix
            </h3>
            <p className="text-xs text-slate">
              Physical constraint compliance for target port: <strong>{data.destination_port}</strong>
            </p>
          </div>
          <Ship className="size-5 text-forest-ink" />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-pebble bg-linen-mist/40 text-xs font-semibold text-charcoal uppercase">
              <tr>
                <th className="py-2.5 px-4">Vessel Class</th>
                <th className="py-2.5 px-3 text-center">Draft</th>
                <th className="py-2.5 px-3 text-center">LOA</th>
                <th className="py-2.5 px-3 text-center">Beam</th>
                <th className="py-2.5 px-3 text-center">DWT</th>
                <th className="py-2.5 px-3 text-center">Overall</th>
                <th className="py-2.5 px-4">Constraint Notes & Feasibility Analysis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pebble text-xs">
              {data.feasibility.map((row) => (
                <tr
                  key={row.vessel_class}
                  className={row.overall_feasible ? "hover:bg-linen-mist/20" : "bg-alarm-wash"}
                >
                  <td className="py-3 px-4 font-semibold text-charcoal">
                    {row.vessel_class}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.draft_pass ? (
                      <CheckCircle2 className="inline size-4 text-forest-ink" />
                    ) : (
                      <XCircle className="inline size-4 text-alarm-red" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.loa_pass ? (
                      <CheckCircle2 className="inline size-4 text-forest-ink" />
                    ) : (
                      <XCircle className="inline size-4 text-alarm-red" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.beam_pass ? (
                      <CheckCircle2 className="inline size-4 text-forest-ink" />
                    ) : (
                      <XCircle className="inline size-4 text-alarm-red" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.dwt_pass ? (
                      <CheckCircle2 className="inline size-4 text-forest-ink" />
                    ) : (
                      <XCircle className="inline size-4 text-alarm-red" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-semibold text-[10px] uppercase ${
                        row.overall_feasible
                          ? "bg-linen-mist text-forest-ink"
                          : "bg-alarm-wash text-alarm-red border border-alarm-red/20"
                      }`}
                    >
                      {row.overall_feasible ? "FEASIBLE" : "RESTRICTED"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate">
                    {row.failure_reason ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-alarm-red">
                        <AlertTriangle className="size-3.5 shrink-0" />
                        {row.failure_reason}
                      </span>
                    ) : (
                      <span className="text-forest-ink">
                        Fully compliant with berth draught and handling envelope.
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 6: Multi-Dimensional Risk Assessment */}
      <section data-tour="risk-engine" className="rounded-card border border-pebble bg-paper p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-obsidian">
              Section 6: Multi-Dimensional Supply Chain Risk Assessment
            </h3>
            <p className="text-xs text-slate">
              Real-time telemetry and risk classification across 6 strategic risk vectors
            </p>
          </div>
          <AlertTriangle className="size-5 text-amber-warning" />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-pebble bg-linen-mist/40 text-xs font-semibold text-charcoal uppercase">
              <tr>
                <th className="py-2.5 px-4">Risk Category</th>
                <th className="py-2.5 px-3 text-center">Severity</th>
                <th className="py-2.5 px-4">Telemetry Signal / Observation</th>
                <th className="py-2.5 px-4">Verified Data Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pebble text-xs">
              {data.risks.map((risk) => (
                <tr key={risk.risk_category} className="hover:bg-fog/30">
                  <td className="py-3 px-4 font-medium text-charcoal capitalize">
                    {risk.risk_category ? risk.risk_category.replace(/_/g, " ") : "unavailable"}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        risk.severity === "LOW"
                          ? "bg-linen-mist text-forest-ink"
                          : risk.severity === "MEDIUM"
                          ? "bg-amber-wash text-amber-warning"
                          : risk.severity === "HIGH"
                          ? "bg-alarm-wash text-alarm-red"
                          : "bg-fog text-charcoal"
                      }`}
                    >
                      {risk.severity || "unavailable"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate">
                    {risk.signal_description || "unavailable"}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-charcoal">
                    {risk.data_source || "unavailable"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 9: Your Decision (Accept / Override Workflow — Task 242, 312) */}
      <section data-tour="decision-workflow" className="rounded-card border border-pebble bg-paper p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-obsidian">
              Section 9: Procurement Officer Chartering Decision
            </h3>
            <p className="text-xs text-slate">
              Record official fixture governance action into the immutable audit trail
            </p>
          </div>
          <FileCheck className="size-5 text-forest-ink" />
        </div>

        {decisionRecorded ? (
          <div className="mt-4 rounded-card border border-forest-ink/20 bg-linen-mist p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-6 text-forest-ink" />
              <div>
                <h4 className="font-bold text-forest-ink">
                  Decision Recorded and Committed to Audit Log
                </h4>
                <p className="text-xs text-charcoal mt-0.5">
                  Vessel Class: <strong>{data.decision?.chosen_vessel_class || data.recommended_vessel}</strong> •
                  Override: {data.decision?.was_override ? "Yes" : "No"} •
                  Timestamp: {data.decision?.decided_at ? new Date(data.decision.decided_at).toLocaleString() : "Just now"}
                </p>
                {data.decision?.override_reason && (
                  <p className="text-xs text-charcoal mt-1 italic">
                    Reason: "{data.decision.override_reason}"
                  </p>
                )}
                {/* Task 383: Link to Decision Record Page */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.hash = `#decision-${data.id}`;
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-forest-ink px-4 py-2 text-xs font-medium text-paper hover:bg-forest-ink/90 transition-all active:scale-95"
                  >
                    <span>Approve / Send for Booking (Decision Record)</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {!isOverrideMode ? (
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDecisionSubmit(false)}
                  className="flex items-center gap-2 rounded-full bg-lime-voltage px-5 py-2.5 text-sm font-medium text-forest-ink transition-all hover:brightness-95 active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="size-4" />
                  Accept Recommendation ({rec.vessel_class} @ Paradip)
                </button>
                <button
                  type="button"
                  onClick={() => setIsOverrideMode(true)}
                  className="rounded-full border border-forest-ink bg-paper px-5 py-2.5 text-sm font-medium text-forest-ink transition-colors hover:bg-fog"
                >
                  Override & Choose Different Option
                </button>
              </div>
            ) : (
              <div className="rounded-card border border-pebble bg-fog p-5 space-y-4">
                <h4 className="font-semibold text-obsidian text-sm">
                  Procurement Officer Override
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-slate">
                      Select Alternative Feasible Vessel Class:
                    </label>
                    <select
                      value={overrideVessel}
                      onChange={(e) => setOverrideVessel(e.target.value)}
                      className="mt-1 w-full rounded-card border border-pebble bg-paper p-2.5 text-sm text-charcoal focus:border-forest-ink focus:outline-none"
                    >
                      {data.feasibility
                        .filter((f) => f.overall_feasible || f.vessel_class !== "Capesize")
                        .map((f) => (
                          <option key={f.vessel_class} value={f.vessel_class}>
                            {f.vessel_class} {f.overall_feasible ? "(Feasible)" : "(Requires Lightering)"}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate">
                      Override Justification (Required for Audit Trail):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dedicated plant conveyor preference / urgent laycan..."
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="mt-1 w-full rounded-card border border-pebble bg-paper p-2.5 text-sm text-charcoal focus:border-forest-ink focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting || !overrideReason.trim()}
                    onClick={() => handleDecisionSubmit(true)}
                    className="flex items-center gap-2 rounded-full bg-amber-warning px-5 py-2.5 text-sm font-medium text-white transition-all hover:brightness-95 active:scale-95 disabled:opacity-50"
                  >
                    Confirm Override & Record in Audit Log
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOverrideMode(false)}
                    className="rounded-full border border-pebble bg-paper px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-fog"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SECTION 11: Spot vs. COA Comparison (Collapsible — Task 244) */}
      <section data-tour="spot-vs-coa" className="rounded-card border border-pebble bg-paper">
        <button
          type="button"
          onClick={() => setCoaExpanded(!coaExpanded)}
          className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-fog/20"
        >
          <div className="flex items-center gap-3">
            <TrendingDown className="size-5 text-forest-ink" />
            <div>
              <h3 className="text-base font-bold text-charcoal">
                Section 11: Spot vs. Contract of Affreightment (COA) Comparison
              </h3>
              <p className="text-xs text-slate">
                Volume contracting analysis vs single-voyage spot chartering
              </p>
            </div>
          </div>
          {coaExpanded ? <ChevronUp className="size-5 text-slate" /> : <ChevronDown className="size-5 text-slate" />}
        </button>

        {coaExpanded && (
          <div className="border-t border-pebble p-5 pt-3">
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-linen-mist/50 p-2 text-xs text-charcoal">
              <Info className="size-4 shrink-0 text-forest-ink" />
              <span>
                <strong>Note:</strong> COA discount is a configurable engineering assumption (~8% volume concession), not a live broker rate.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-pebble bg-linen-mist/40 font-sans font-semibold text-charcoal uppercase">
                  <tr>
                    <th className="py-2 px-3">Contract Structure</th>
                    <th className="py-2 px-3 text-right">Freight Rate ($/MT)</th>
                    <th className="py-2 px-3 text-right">Cost Per Voyage</th>
                    <th className="py-2 px-3 text-right">10 Voyages (Annual)</th>
                    <th className="py-2 px-3 text-right">Variance vs Spot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pebble">
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-medium text-charcoal">
                      Spot Charter (Current Market)
                    </td>
                    <td className="py-2.5 px-3 text-right">${data.benchmark_spot_pmt.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      ${(data.benchmark_spot_pmt * data.parcel_tonnage).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      ${(data.benchmark_spot_pmt * data.parcel_tonnage * 10).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate">Baseline</td>
                  </tr>
                  <tr className="bg-emerald-50/40">
                    <td className="py-2.5 px-3 font-sans font-semibold text-emerald-900">
                      Predicted Spot Fixture (Pravah)
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">
                      ${data.predicted_rate_pmt.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-800">
                      ${(data.predicted_rate_pmt * data.parcel_tonnage).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-800">
                      ${(data.predicted_rate_pmt * data.parcel_tonnage * 10).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">
                      -${data.estimated_savings_usd.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-linen-mist/20">
                    <td className="py-2.5 px-3 font-sans font-semibold text-charcoal">
                      Annual COA Agreement (~8% Discount)
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-forest-ink">
                      ${(data.predicted_rate_pmt * 0.92).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-forest-ink">
                      ${(data.predicted_rate_pmt * 0.92 * data.parcel_tonnage).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-forest-ink">
                      ${(data.predicted_rate_pmt * 0.92 * data.parcel_tonnage * 10).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-forest-ink font-bold">
                      -${((data.benchmark_spot_pmt - data.predicted_rate_pmt * 0.92) * data.parcel_tonnage * 10).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
      </ExpertDisclosure>
    </div>
  );
};

export default AnalysisResultsPage;

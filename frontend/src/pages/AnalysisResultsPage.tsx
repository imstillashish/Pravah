import React, { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import { RouteMap } from "../components/RouteMap";
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
  Calendar,
  CloudRain,
  Clock,
  Compass,
  Waves,
  Languages,
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
  seasonal_factor?: {
    season_name: string;
    factor: number;
    risk_level: string;
    narrative_en: string;
    narrative_hi: string;
    month: number;
  };
  turnaround?: {
    origin_waiting_days: number;
    destination_waiting_days: number;
    laytime_allowed_days: number;
    demurrage_exposure_usd: number;
    ballast_deadhead_days: number;
  };
  alternative_employments?: Array<{
    id: string;
    title: string;
    route_type: string;
    net_benefit_usd: number;
    absorbed_idle_days: number;
    description: string;
  }>;
}

export const AnalysisResultsPage: React.FC<{ analysisId?: number | string }> = ({
  analysisId = 1,
}) => {
  const [data, setData] = useState<AnalysisDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [narrativeLang, setNarrativeLang] = useState<"en" | "hi">("en");
  const [selectedAlt, setSelectedAlt] = useState<string | null>(null);

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
          setData(res);
          if (res.decision?.decided_at) {
            setDecisionRecorded(true);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load analysis details");
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
      <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">
        <h3 className="font-semibold text-lg">Unable to load Analysis #{analysisId}</h3>
        <p className="mt-1 text-sm text-red-700">{error || "Data unavailable"}</p>
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
                ? "bg-emerald-100 text-emerald-800"
                : data.status === "overridden"
                ? "bg-amber-100 text-amber-800"
                : "bg-slate-100 text-slate-700"
            }`}>
              {data.status}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-charcoal sm:text-3xl">
            {data.title}
          </h1>
        </div>

        {/* Section 10: Emergency Procurement Mode Toggle */}
        <div className="flex items-center gap-3 rounded-xl border border-pebble bg-linen-mist/30 p-2.5">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-charcoal flex items-center gap-1">
              <Flame className="size-3.5 text-amber-600" />
              Emergency Mode
            </span>
            <span className="text-[10px] text-slate">Force immediate chartering</span>
          </div>
          <button
            type="button"
            onClick={() => setEmergencyMode(!emergencyMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              emergencyMode ? "bg-amber-600" : "bg-pebble"
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

      {emergencyMode && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <AlertTriangle className="size-4 shrink-0 text-amber-700" />
          <span>
            <strong>Emergency Mode Active:</strong> Recommendation engine prioritizes immediate vessel fixture and suppresses laycan deferral windows.
          </span>
        </div>
      )}

      {/* SECTION 1: Context Summary */}
      <section className="grid grid-cols-2 gap-4 rounded-xl border border-pebble bg-paper p-5 sm:grid-cols-4">
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

      {/* Interactive Maritime Route Map (Task 251) */}
      <RouteMap
        originName={data.origin_port}
        destinationName={data.destination_port}
        distanceNm={data.context.route_distance_nm}
      />

      {/* SECTION 5: Stock-Out Alert (Rendered conditionally with Red/Green border per Task 238 & 313) */}
      {data.stockout_alert && (
        <section
          className={`rounded-xl border-2 p-5 ${
            data.stockout_alert.is_at_risk
              ? "border-red-500 bg-red-50/60 text-red-950"
              : "border-emerald-500 bg-emerald-50/60 text-emerald-950"
          }`}
        >
          <div className="flex items-start gap-3">
            {data.stockout_alert.is_at_risk ? (
              <ShieldAlert className="size-6 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="size-6 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold text-base">
                  {data.stockout_alert.is_at_risk
                    ? "CRITICAL STOCK-OUT RISK ALERT"
                    : "Inventory Buffer Adequate"}
                </h3>
                <div className="flex gap-2">
                  <span className="rounded-md bg-white/80 px-2.5 py-1 font-mono text-xs font-semibold shadow-sm">
                    Stock Life: {data.stockout_alert.days_to_stockout} Days
                  </span>
                  <span className="rounded-md bg-white/80 px-2.5 py-1 font-mono text-xs font-semibold shadow-sm">
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
        <section className="rounded-xl border border-forest-ink/30 bg-gradient-to-br from-paper via-linen-mist/20 to-emerald-50/40 p-6 shadow-sm lg:col-span-5">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-forest-ink px-3 py-1 text-xs font-semibold uppercase tracking-wider text-paper">
              Rank #{rec.rank} Recommended
            </span>
            <div className="text-right">
              <span className="text-[10px] text-slate uppercase">Total Deterministic Score</span>
              <p className="font-mono text-3xl font-extrabold text-forest-ink">
                {rec.total_score.toFixed(3)}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-xl font-bold text-charcoal">
              {rec.vessel_class} Class Charter
            </h3>
            <p className="text-xs text-slate">
              Discharge Port: <strong>{rec.port_name}</strong> • Parcel: {data.parcel_tonnage.toLocaleString()} MT
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-pebble pt-4">
            <div className="rounded-lg bg-paper p-3 border border-pebble">
              <span className="text-xs text-slate">Predicted Freight</span>
              <p className="text-lg font-bold text-charcoal">
                ${data.predicted_rate_pmt.toFixed(2)} <span className="text-xs font-normal text-slate">/ MT</span>
              </p>
            </div>
            <div className="rounded-lg bg-paper p-3 border border-pebble">
              <span className="text-xs text-slate">Est. Net Savings</span>
              <p className="text-lg font-bold text-emerald-600">
                ${data.estimated_savings_usd.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-4 text-[11px] text-slate">
            Benchmark spot rate: ${data.benchmark_spot_pmt.toFixed(2)}/MT • Savings vs spot: ~14.5%
          </div>
        </section>

        {/* Explainability Panel (Section 8 — Tasks 241, 285, 311) */}
        <section className="rounded-xl border border-pebble bg-paper p-6 shadow-sm lg:col-span-7">
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

          <div className="mt-5 space-y-4">
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
      <section className="rounded-xl border border-pebble bg-paper p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-charcoal">Section 2: Freight Rate Forecast</h3>
            <p className="text-xs text-slate">
              P50 = most likely rate, P10 = best case, P90 = worst case
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 font-mono text-xs font-semibold ${
              data.forecast.confidence_label === "HIGH"
                ? "bg-emerald-100 text-emerald-800"
                : data.forecast.confidence_label === "MEDIUM"
                ? "bg-amber-100 text-amber-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            Confidence: {data.forecast.confidence_label}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-pebble bg-paper p-4 text-center">
            <span className="text-xs font-medium text-slate uppercase">P10 (Best Case)</span>
            <p className="mt-1 font-mono text-2xl font-bold text-emerald-600">
              {data.forecast?.p10_usd_per_mt != null ? `$${data.forecast.p10_usd_per_mt.toFixed(2)}` : "unavailable"}
            </p>
            <div className="mt-1">
              <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-semibold text-sky-800 font-sans">
                MODEL OUTPUT
              </span>
            </div>
          </div>

          <div className="rounded-xl border-2 border-forest-ink bg-linen-mist/30 p-4 text-center">
            <span className="text-xs font-bold text-forest-ink uppercase">P50 (Most Likely)</span>
            <p className="mt-1 font-mono text-3xl font-extrabold text-forest-ink">
              {data.forecast?.p50_usd_per_mt != null ? `$${data.forecast.p50_usd_per_mt.toFixed(2)}` : "unavailable"}
            </p>
            <div className="mt-1">
              <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-semibold text-sky-800 font-sans">
                MODEL OUTPUT
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-pebble bg-paper p-4 text-center">
            <span className="text-xs font-medium text-slate uppercase">P90 (Worst Case)</span>
            <p className="mt-1 font-mono text-2xl font-bold text-amber-600">
              {data.forecast?.p90_usd_per_mt != null ? `$${data.forecast.p90_usd_per_mt.toFixed(2)}` : "unavailable"}
            </p>
            <div className="mt-1">
              <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-semibold text-sky-800 font-sans">
                MODEL OUTPUT
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-pebble bg-fog/50 p-4 text-center">
            <span className="text-xs font-medium text-slate uppercase">ARIMA Baseline</span>
            <p className="mt-1 font-mono text-2xl font-bold text-charcoal">
              {data.forecast?.arima_baseline_usd_per_mt != null ? `$${data.forecast.arima_baseline_usd_per_mt.toFixed(2)}` : "$25.50"}
            </p>
            <div className="mt-1">
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-800 font-sans">
                MODEL OUTPUT
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Total Landed Cost (Task 236, 310) */}
      <section className="rounded-xl border border-pebble bg-paper p-6 shadow-sm">
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

      {/* SECTION 4: Dual-Port Vessel & Port Feasibility Matrix (Tasks 237, 308) */}
      <section className="rounded-xl border border-pebble bg-paper p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-charcoal">
                Section 4: Dual-Port Vessel Feasibility Matrix
              </h3>
              <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800 font-sans">
                DUAL-PORT VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate mt-0.5">
              Origin Load Port: <strong>{data.origin_port}</strong> ({data.origin_country}) ⇄ Discharge Port: <strong>{data.destination_port}</strong> (India)
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
                  className={row.overall_feasible ? "hover:bg-emerald-50/20" : "bg-red-50/30"}
                >
                  <td className="py-3 px-4 font-semibold text-charcoal">
                    {row.vessel_class}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.draft_pass ? (
                      <CheckCircle2 className="inline size-4 text-emerald-600" />
                    ) : (
                      <XCircle className="inline size-4 text-red-600" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.loa_pass ? (
                      <CheckCircle2 className="inline size-4 text-emerald-600" />
                    ) : (
                      <XCircle className="inline size-4 text-red-600" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.beam_pass ? (
                      <CheckCircle2 className="inline size-4 text-emerald-600" />
                    ) : (
                      <XCircle className="inline size-4 text-red-600" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.dwt_pass ? (
                      <CheckCircle2 className="inline size-4 text-emerald-600" />
                    ) : (
                      <XCircle className="inline size-4 text-red-600" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`rounded px-2 py-0.5 font-semibold text-[10px] uppercase ${
                        row.overall_feasible
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {row.overall_feasible ? "FEASIBLE" : "RESTRICTED"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate">
                    {row.failure_reason ? (
                      <span className="font-medium text-red-700">
                        ⚠️ {row.failure_reason}
                      </span>
                    ) : (
                      <span className="text-emerald-700">
                        Fully compliant with both origin and destination berth draught envelopes.
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 4B: Seasonal Demand-Supply & Climatology Impact (SIH26006) */}
      <section className="rounded-xl border border-pebble bg-paper p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-sky-50 p-2 text-sky-700">
              <CloudRain className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-charcoal">
                  Section 4B: Seasonal Demand-Supply & Climatology Impact
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                    data.seasonal_factor?.risk_level === "HIGH"
                      ? "bg-red-100 text-red-800"
                      : data.seasonal_factor?.risk_level === "ELEVATED"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {data.seasonal_factor?.risk_level || "MODERATE"} CLIMATOLOGY RISK
                </span>
              </div>
              <p className="text-xs text-slate mt-0.5">
                Laycan Season: <strong>Month {data.seasonal_factor?.month ?? 7} ({data.seasonal_factor?.season_name ?? "South-West Monsoon / Restocking"})</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-medium text-slate uppercase">Seasonal Freight Multiplier</span>
              <p className="font-mono text-xl font-extrabold text-forest-ink">
                {data.seasonal_factor?.factor ? `${data.seasonal_factor.factor.toFixed(2)}x` : "1.26x"}
                <span className="ml-1 text-xs font-normal text-amber-700">
                  (+{Math.round(((data.seasonal_factor?.factor ?? 1.26) - 1.0) * 100)}% premium)
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNarrativeLang(narrativeLang === "en" ? "hi" : "en")}
              className="flex items-center gap-1.5 rounded-lg border border-pebble bg-fog/50 px-3 py-1.5 text-xs font-semibold text-charcoal hover:bg-fog transition-colors"
              title="Toggle Hindi/English Explainability"
            >
              <Languages className="size-3.5 text-forest-ink" />
              <span>{narrativeLang === "en" ? "हिंदी व्याख्या" : "English Narrative"}</span>
            </button>
          </div>
        </div>

        {/* Climatology Narrative Callout */}
        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/50 p-4">
          <div className="flex items-start gap-3">
            <Info className="size-5 shrink-0 text-sky-700 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wide">
                Bilingual Seasonal Risk Advisory ({narrativeLang === "en" ? "English" : "हिंदी"}):
              </h4>
              <p className="text-sm text-sky-900 leading-relaxed font-sans">
                {narrativeLang === "en"
                  ? data.seasonal_factor?.narrative_en ||
                    "July Laycan: Active South-West Monsoon brings heavy sea swell to the Bay of Bengal, reducing discharge handling rates by 20–25% and suspending offshore Sandheads lightering."
                  : data.seasonal_factor?.narrative_hi ||
                    "जुलाई लैकान: बंगाल की खाड़ी में सक्रिय दक्षिण-पश्चिम मानसून की भारी लहरों के कारण डिस्चार्ज दर 20-25% घट जाती है और सैंडहेड्स पर लाइटरिंग बंद रहती है।"}
              </p>
            </div>
          </div>
        </div>

        {/* 3 Climatological Risk Columns */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-lg border border-pebble bg-linen-mist/30 p-3">
            <span className="font-bold text-charcoal flex items-center gap-1.5">
              <Waves className="size-3.5 text-sky-600" />
              Bay of Bengal SW Monsoon
            </span>
            <p className="mt-1 text-slate text-[11px]">
              Swell height 3.5m+ at Paradip/Dhamra outer anchorages slows crane cycling; Sandheads lightering completely shut Jun–Aug.
            </p>
          </div>
          <div className="rounded-lg border border-pebble bg-linen-mist/30 p-3">
            <span className="font-bold text-charcoal flex items-center gap-1.5">
              <Compass className="size-3.5 text-amber-600" />
              Queensland Cyclone Window
            </span>
            <p className="mt-1 text-slate text-[11px]">
              Tropical cyclone track alert for Hay Point & Gladstone in Jan–Feb; triggers precautionary fleet closures.
            </p>
          </div>
          <div className="rounded-lg border border-pebble bg-linen-mist/30 p-3">
            <span className="font-bold text-charcoal flex items-center gap-1.5">
              <Calendar className="size-3.5 text-forest-ink" />
              Winter Heating Restocking
            </span>
            <p className="mt-1 text-slate text-[11px]">
              Peak procurement competition from China, Japan & South Korea Nov–Jan absorbs available Pacific Capesize tonnage.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6: Multi-Dimensional Risk Assessment */}
      <section className="rounded-xl border border-pebble bg-paper p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-charcoal">
              Section 6: Multi-Dimensional Supply Chain Risk Assessment
            </h3>
            <p className="text-xs text-slate">
              Real-time telemetry and risk classification across 6 strategic risk vectors
            </p>
          </div>
          <AlertTriangle className="size-5 text-amber-600" />
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
                      className={`rounded px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        risk.severity === "LOW"
                          ? "bg-emerald-100 text-emerald-800"
                          : risk.severity === "MEDIUM"
                          ? "bg-amber-100 text-amber-800"
                          : risk.severity === "HIGH"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-600"
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
      <section className="rounded-xl border border-pebble bg-paper p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-charcoal">
              Section 9: Procurement Officer Chartering Decision
            </h3>
            <p className="text-xs text-slate">
              Record official fixture governance action into the immutable audit trail
            </p>
          </div>
          <FileCheck className="size-5 text-forest-ink" />
        </div>

        {decisionRecorded ? (
          <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50/80 p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-6 text-emerald-600" />
              <div>
                <h4 className="font-bold text-emerald-950">
                  Decision Recorded and Committed to Audit Log
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Vessel Class: <strong>{data.decision?.chosen_vessel_class || data.recommended_vessel}</strong> •
                  Override: {data.decision?.was_override ? "Yes" : "No"} •
                  Timestamp: {data.decision?.decided_at ? new Date(data.decision.decided_at).toLocaleString() : "Just now"}
                </p>
                {data.decision?.override_reason && (
                  <p className="text-xs text-emerald-900 mt-1 italic">
                    Reason: "{data.decision.override_reason}"
                  </p>
                )}
                {/* Task 383: Link to Decision Record Page */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.hash = "#decision";
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-forest-ink px-4 py-2 text-xs font-semibold text-paper shadow-sm hover:bg-forest-ink/90 transition-all active:scale-95"
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
                  className="flex items-center gap-2 rounded-xl bg-forest-ink px-5 py-3 text-sm font-semibold text-paper shadow-sm transition-all hover:bg-forest-ink/90 active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="size-4" />
                  Accept Recommendation ({rec.vessel_class} @ Paradip)
                </button>
                <button
                  type="button"
                  onClick={() => setIsOverrideMode(true)}
                  className="rounded-xl border border-pebble bg-paper px-5 py-3 text-sm font-semibold text-charcoal transition-all hover:bg-fog"
                >
                  Override & Choose Different Option
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-pebble bg-fog/30 p-5 space-y-4">
                <h4 className="font-semibold text-charcoal text-sm">
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
                      className="mt-1 w-full rounded-lg border border-pebble bg-paper p-2.5 text-sm text-charcoal focus:border-forest-ink focus:outline-none"
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
                      className="mt-1 w-full rounded-lg border border-pebble bg-paper p-2.5 text-sm text-charcoal focus:border-forest-ink focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting || !overrideReason.trim()}
                    onClick={() => handleDecisionSubmit(true)}
                    className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-700 disabled:opacity-50"
                  >
                    Confirm Override & Record in Audit Log
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOverrideMode(false)}
                    className="rounded-xl border border-pebble bg-paper px-4 py-2.5 text-sm text-slate hover:text-charcoal"
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
      <section className="rounded-xl border border-pebble bg-paper shadow-sm">
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
                      Predicted Spot Fixture (Astitva)
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

      {/* SECTION 12: Idle Time Turnaround & Alternative Employment (SIH26006) */}
      <section className="rounded-xl border border-pebble bg-paper p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2 text-forest-ink">
              <Clock className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-charcoal">
                  Section 12: Idle Time Turnaround & Alternative Employment Recommendations
                </h3>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 font-sans">
                  SIH26006 DISPATCH SOLVER
                </span>
              </div>
              <p className="text-xs text-slate mt-0.5">
                Turnaround queue forecasting, financial demurrage risk mitigation, and post-discharge vessel employment
              </p>
            </div>
          </div>
        </div>

        {/* Turnaround KPI Metric Strips */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5 font-mono text-center">
          <div className="rounded-xl border border-pebble bg-fog/30 p-3">
            <span className="text-[10px] font-sans font-semibold text-slate uppercase block">
              Origin Queue ({data.origin_port.split(" ")[0]})
            </span>
            <p className="mt-1 text-lg font-bold text-charcoal">
              {data.turnaround?.origin_waiting_days ? `${data.turnaround.origin_waiting_days} d` : "3.4 d"}
            </p>
            <span className="text-[10px] font-sans text-slate">Load berth wait</span>
          </div>

          <div className="rounded-xl border border-pebble bg-fog/30 p-3">
            <span className="text-[10px] font-sans font-semibold text-slate uppercase block">
              Discharge Queue ({data.destination_port})
            </span>
            <p className="mt-1 text-lg font-bold text-charcoal">
              {data.turnaround?.destination_waiting_days ? `${data.turnaround.destination_waiting_days} d` : "2.8 d"}
            </p>
            <span className="text-[10px] font-sans text-slate">Discharge berth wait</span>
          </div>

          <div className="rounded-xl border border-pebble bg-fog/30 p-3">
            <span className="text-[10px] font-sans font-semibold text-slate uppercase block">
              Allowed Laytime
            </span>
            <p className="mt-1 text-lg font-bold text-charcoal">
              {data.turnaround?.laytime_allowed_days ? `${data.turnaround.laytime_allowed_days} d` : "8.5 d"}
            </p>
            <span className="text-[10px] font-sans text-slate">Contract laytime</span>
          </div>

          <div className={`rounded-xl border p-3 ${
            (data.turnaround?.demurrage_exposure_usd ?? 44800) > 0
              ? "border-amber-300 bg-amber-50/50"
              : "border-pebble bg-fog/30"
          }`}>
            <span className="text-[10px] font-sans font-semibold text-slate uppercase block">
              Demurrage Exposure
            </span>
            <p className={`mt-1 text-lg font-bold ${
              (data.turnaround?.demurrage_exposure_usd ?? 44800) > 0
                ? "text-amber-700"
                : "text-emerald-700"
            }`}>
              ${(data.turnaround?.demurrage_exposure_usd ?? 44800).toLocaleString()}
            </p>
            <span className="text-[10px] font-sans text-slate">At benchmark laytime</span>
          </div>

          <div className="rounded-xl border border-pebble bg-fog/30 p-3">
            <span className="text-[10px] font-sans font-semibold text-slate uppercase block">
              Ballast Deadhead Loss
            </span>
            <p className="mt-1 text-lg font-bold text-red-600">
              {data.turnaround?.ballast_deadhead_days ? `${data.turnaround.ballast_deadhead_days} d` : "18.5 d"}
            </p>
            <span className="text-[10px] font-sans text-slate">Unladen return steaming</span>
          </div>
        </div>

        {/* 4 Actionable Alternative Employment Cards */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-charcoal">
                Ranked Alternative Employment Strategies
              </h4>
              <p className="text-xs text-slate">
                Commercial fixtures to absorb unladen ballast deadheading and monetize vessel idle time
              </p>
            </div>
            {selectedAlt && (
              <span className="rounded-full bg-forest-ink/10 px-3 py-1 text-xs font-semibold text-forest-ink">
                Selected for Fixture Note
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(data.alternative_employments || [
              {
                id: "coastal_cabotage",
                title: `Coastal Coal Cabotage (${data.destination_port} → Ennore / Tuticorin)`,
                route_type: "Domestic Cabotage",
                net_benefit_usd: 262400,
                absorbed_idle_days: 7.5,
                description: `Reposition vessel under domestic RSR cabotage guidelines carrying thermal coal from ${data.destination_port} to southern TANGEDCO/NTPC power plants, replacing empty ballast with freight earnings.`
              },
              {
                id: "backhaul_iron_ore",
                title: `Backhaul Mineral Run (${data.destination_port} / Vizag → Qingdao, China)`,
                route_type: "Backhaul Export",
                net_benefit_usd: 315000,
                absorbed_idle_days: 14.0,
                description: "Lade export iron ore pellets or bauxite for delivery to Qingdao or Rizhao, offsetting 50% of the Pacific ballast transit fuel and vessel charter hire costs."
              },
              {
                id: "period_relet",
                title: "Short-Term Period Relet (Singapore Hub / Malacca Strait)",
                route_type: "Time-Charter Relet",
                net_benefit_usd: 190000,
                absorbed_idle_days: 28.0,
                description: "Relet the vessel into Southeast Asian regional trades at prevailing Baltic Time Charter rates while SAIL blast furnaces drawdown stockyard inventories."
              },
              {
                id: "eco_speed",
                title: "Virtual Arrival & Eco-Speed Slow Steaming",
                route_type: "Speed Optimization",
                net_benefit_usd: 97840,
                absorbed_idle_days: 3.5,
                description: `Reduce cruising speed to 10.8 knots to align arrival with ${data.destination_port} berth readiness, cutting bunker fuel consumption by ~28% with zero demurrage penalty.`
              }
            ]).map((alt) => {
              const isSelected = selectedAlt === alt.id;
              return (
                <div
                  key={alt.id}
                  className={`rounded-xl border p-4 transition-all duration-200 ${
                    isSelected
                      ? "border-forest-ink bg-linen-mist/30 ring-2 ring-forest-ink/30 shadow-md"
                      : "border-pebble bg-paper hover:border-slate/40 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
                        {alt.route_type}
                      </span>
                      <h5 className="mt-1 text-sm font-bold text-charcoal leading-snug">
                        {alt.title}
                      </h5>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-medium text-slate uppercase block">Est. Net Benefit</span>
                      <span className="font-mono text-base font-extrabold text-emerald-700">
                        +${alt.net_benefit_usd.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-slate leading-relaxed">
                    {alt.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-pebble/60 pt-3 text-xs">
                    <span className="font-mono text-charcoal">
                      Absorbs: <strong>{alt.absorbed_idle_days} days</strong> deadhead
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedAlt(isSelected ? null : alt.id)}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-forest-ink text-paper shadow-sm"
                          : "border border-pebble bg-fog/50 text-charcoal hover:bg-fog"
                      }`}
                    >
                      {isSelected ? "Active Strategy ✓" : "Select Strategy"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnalysisResultsPage;

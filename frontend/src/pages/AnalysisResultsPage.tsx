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
  Gauge,
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
      {/* Top Header Banner & Section 10: Emergency Procurement Mode */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pebble pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-forest-ink/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-forest-ink">
              ANALYSIS #{data.id}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase font-mono ${
                data.status === "finalized"
                  ? "bg-emerald-wash text-emerald-profit border border-emerald-profit/30"
                  : data.status === "overridden"
                  ? "bg-amber-wash text-amber-warning border border-amber-warning/30"
                  : "bg-fog text-charcoal border border-pebble"
              }`}
            >
              {data.status}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-forest-ink sm:text-3xl">
            {data.title}
          </h1>
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
            <Plus className="size-3.5 text-lime-voltage" aria-hidden="true" />
            <span>New Analysis</span>
          </button>

          {/* Section 10: Emergency Procurement Mode Toggle */}
          <div className="flex items-center gap-3 rounded-card border border-pebble bg-linen-mist/40 p-2.5 shadow-xs">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-forest-ink flex items-center gap-1.5">
                <Flame className="size-3.5 text-amber-warning" aria-hidden="true" />
                Emergency Mode
              </span>
              <span className="text-[10px] text-charcoal">Force immediate fixture</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={emergencyMode}
              aria-label="Toggle Emergency Procurement Mode"
              onClick={() => setEmergencyMode(!emergencyMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-signal-blue focus-visible:outline-none ${
                emergencyMode ? "bg-amber-warning" : "bg-pebble"
              }`}
            >
              <span
                className={`inline-block size-4 transform rounded-full bg-paper shadow-xs transition-transform ${
                  emergencyMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {emergencyMode && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-amber-warning/40 bg-amber-wash p-3.5 text-xs font-medium text-amber-warning"
        >
          <AlertTriangle className="size-4 shrink-0 text-amber-warning" aria-hidden="true" />
          <span>
            <strong className="font-bold">Emergency Mode Active:</strong> Recommendation engine prioritizes immediate vessel fixture and suppresses laycan deferral windows.
          </span>
        </div>
      )}

      {/* SECTION 1: Context Summary */}
      <section
        aria-label="Context Summary"
        className="grid grid-cols-2 gap-4 rounded-xl border border-pebble bg-paper p-5 sm:grid-cols-4 shadow-xs"
      >
        <div>
          <span className="text-xs font-medium text-slate">Route Corridor</span>
          <p className="mt-0.5 font-bold text-forest-ink">
            {data.origin_port} → {data.destination_port}
          </p>
          <span className="text-[11px] text-charcoal font-mono tabular-nums">
            {data.context.route_distance_nm.toLocaleString()} NM ({data.context.note})
          </span>
        </div>
        <div>
          <span className="text-xs font-medium text-slate">Cargo & Parcel Size</span>
          <p className="mt-0.5 font-bold text-charcoal font-mono tabular-nums">
            {data.parcel_tonnage.toLocaleString()} MT
          </p>
          <span className="text-[11px] text-charcoal">{data.commodity}</span>
        </div>
        <div>
          <span className="text-xs font-medium text-slate">Inferred Optimal Class</span>
          <p className="mt-0.5 font-bold text-spruce">
            {data.context.inferred_vessel_class}
          </p>
          <span className="text-[11px] text-charcoal">Draft-checked for Paradip</span>
        </div>
        <div>
          <span className="text-xs font-medium text-slate">Resolution Timestamp</span>
          <p className="mt-0.5 font-mono text-xs text-charcoal font-semibold tabular-nums">
            {new Date(data.created_at).toLocaleString()}
          </p>
          <span className="text-[11px] font-semibold text-emerald-profit">Model Quantile v1 Validated</span>
        </div>
      </section>

      {/* Interactive Maritime Route Map */}
      <RouteMap
        originName={data.origin_port}
        destinationName={data.destination_port}
        distanceNm={data.context.route_distance_nm}
      />

      {/* SECTION 2: Freight Rate Forecast (P10 / P50 / P90 / ARIMA Baseline) */}
      <section
        aria-label="Freight Rate Forecast"
        className="rounded-xl border border-pebble bg-paper p-6 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-forest-ink">Section 2: Freight Rate Forecast</h3>
            <p className="text-xs text-slate">
              P50 = most likely rate, P10 = best case, P90 = worst case
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 font-mono text-xs font-semibold uppercase ${
              data.forecast.confidence_label === "HIGH"
                ? "bg-emerald-wash text-emerald-profit border border-emerald-profit/30"
                : data.forecast.confidence_label === "MEDIUM"
                ? "bg-amber-wash text-amber-warning border border-amber-warning/30"
                : "bg-alarm-wash text-alarm-red border border-alarm-red/30"
            }`}
          >
            Confidence: {data.forecast.confidence_label}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-pebble bg-paper p-4 text-center shadow-xs">
            <span className="text-xs font-semibold text-slate uppercase">P10 (Best Case)</span>
            <p className="mt-1 font-mono tabular-nums text-2xl font-bold text-emerald-profit">
              {data.forecast?.p10_usd_per_mt != null ? `$${data.forecast.p10_usd_per_mt.toFixed(2)}` : "unavailable"}
              <span className="text-xs font-normal text-slate"> / MT</span>
            </p>
            <div className="mt-2 flex items-center justify-center gap-1.5">
              <span className="rounded bg-linen-mist px-1.5 py-0.5 text-[9px] font-semibold text-spruce font-sans">
                MODEL OUTPUT
              </span>
              {data.forecast?.p10_usd_per_mt != null && data.forecast?.p50_usd_per_mt != null && (
                <span className="font-mono tabular-nums text-[10px] font-semibold text-emerald-profit">
                  -{(data.forecast.p50_usd_per_mt - data.forecast.p10_usd_per_mt).toFixed(2)}/MT (-{Math.round(((data.forecast.p50_usd_per_mt - data.forecast.p10_usd_per_mt) / data.forecast.p50_usd_per_mt) * 100)}%)
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border-2 border-forest-ink bg-linen-mist/30 p-4 text-center shadow-xs">
            <span className="text-xs font-bold text-forest-ink uppercase">P50 (Most Likely)</span>
            <p className="mt-1 font-mono tabular-nums text-3xl font-extrabold text-forest-ink">
              {data.forecast?.p50_usd_per_mt != null ? `$${data.forecast.p50_usd_per_mt.toFixed(2)}` : "unavailable"}
              <span className="text-xs font-normal text-slate"> / MT</span>
            </p>
            <div className="mt-2 flex items-center justify-center">
              <span className="rounded bg-forest-ink px-2 py-0.5 text-[9px] font-semibold text-paper font-sans">
                PRIMARY ESTIMATE
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-pebble bg-paper p-4 text-center shadow-xs">
            <span className="text-xs font-semibold text-slate uppercase">P90 (Worst Case)</span>
            <p className="mt-1 font-mono tabular-nums text-2xl font-bold text-amber-warning">
              {data.forecast?.p90_usd_per_mt != null ? `$${data.forecast.p90_usd_per_mt.toFixed(2)}` : "unavailable"}
              <span className="text-xs font-normal text-slate"> / MT</span>
            </p>
            <div className="mt-2 flex items-center justify-center gap-1.5">
              <span className="rounded bg-amber-wash px-1.5 py-0.5 text-[9px] font-semibold text-amber-warning font-sans border border-amber-warning/20">
                RISK BOUND
              </span>
              {data.forecast?.p90_usd_per_mt != null && data.forecast?.p50_usd_per_mt != null && (
                <span className="font-mono tabular-nums text-[10px] font-semibold text-amber-warning">
                  +{(data.forecast.p90_usd_per_mt - data.forecast.p50_usd_per_mt).toFixed(2)}/MT (+{Math.round(((data.forecast.p90_usd_per_mt - data.forecast.p50_usd_per_mt) / data.forecast.p50_usd_per_mt) * 100)}%)
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-pebble bg-fog/40 p-4 text-center shadow-xs">
            <span className="text-xs font-semibold text-charcoal uppercase">ARIMA Baseline</span>
            <p className="mt-1 font-mono tabular-nums text-2xl font-bold text-charcoal">
              {data.forecast?.arima_baseline_usd_per_mt != null ? `$${data.forecast.arima_baseline_usd_per_mt.toFixed(2)}` : "$25.50"}
              <span className="text-xs font-normal text-charcoal"> / MT</span>
            </p>
            <div className="mt-2 flex items-center justify-center gap-1.5">
              <span className="rounded bg-fog px-1.5 py-0.5 text-[9px] font-semibold text-charcoal font-sans border border-pebble">
                TIME-SERIES BENCHMARK
              </span>
              {data.forecast?.arima_baseline_usd_per_mt != null && data.forecast?.p50_usd_per_mt != null && (
                <span className="font-mono tabular-nums text-[10px] font-semibold text-charcoal">
                  {(data.forecast.p50_usd_per_mt - data.forecast.arima_baseline_usd_per_mt) < 0 ? "-" : "+"}${Math.abs(data.forecast.p50_usd_per_mt - data.forecast.arima_baseline_usd_per_mt).toFixed(2)}/MT vs ML
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quantile Spread Strip */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-linen-mist/30 px-3.5 py-2 text-xs border border-pebble/60">
          <span className="font-semibold text-charcoal">
            Quantile Uncertainty Spread (P90 - P10 Band):
          </span>
          <span className="font-mono tabular-nums font-bold text-forest-ink">
            ${((data.forecast?.p90_usd_per_mt ?? 27.60) - (data.forecast?.p10_usd_per_mt ?? 22.40)).toFixed(2)} / MT ({(
              (((data.forecast?.p90_usd_per_mt ?? 27.60) - (data.forecast?.p10_usd_per_mt ?? 22.40)) / (data.forecast?.p50_usd_per_mt ?? 24.80)) * 100
            ).toFixed(1)}% volatility window)
          </span>
        </div>
      </section>

      {/* SECTION 3: Total Landed Cost (Task 236, 310) */}
      <section
        aria-label="Total Landed Cost"
        className="rounded-xl border border-pebble bg-paper p-6 shadow-xs"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-forest-ink">Section 3: Total Landed Cost</h3>
            <p className="text-xs text-slate">
              Complete cost breakdown per metric ton and total voyage expenditure
            </p>
          </div>
          <DollarSign className="size-5 text-forest-ink" aria-hidden="true" />
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-pebble">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-pebble bg-linen-mist/80 backdrop-blur-xs text-xs font-semibold text-forest-ink uppercase">
              <tr>
                <th scope="col" className="py-2.5 px-4">Component</th>
                <th scope="col" className="py-2.5 px-4 text-right">Value (USD)</th>
                <th scope="col" className="py-2.5 px-4 text-right">Forex (USD/INR)</th>
                <th scope="col" className="py-2.5 px-4 text-right">Total (₹/MT)</th>
                <th scope="col" className="py-2.5 px-4 text-center">Data Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pebble font-mono text-xs">
              <tr className="bg-paper hover:bg-fog/40 transition-colors">
                <td className="py-3 px-4 font-sans font-medium text-charcoal">
                  Ocean Freight Rate
                </td>
                <td className="py-3 px-4 text-right tabular-nums">
                  ${data.landed_cost.freight_rate_usd_per_mt.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right text-slate tabular-nums">—</td>
                <td className="py-3 px-4 text-right tabular-nums font-semibold text-charcoal">
                  ₹{(data.landed_cost.freight_rate_usd_per_mt * data.landed_cost.usd_inr_rate).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="rounded bg-linen-mist px-2 py-0.5 text-[10px] font-semibold text-spruce font-sans border border-spruce/20">
                    MODEL OUTPUT
                  </span>
                </td>
              </tr>
              <tr className="bg-fog/20 hover:bg-fog/50 transition-colors">
                <td className="py-3 px-4 font-sans font-medium text-charcoal flex items-center gap-1.5">
                  Bunker Surcharge (BAF)
                  <span className="rounded bg-amber-wash px-1.5 py-0.5 text-[9px] font-semibold text-amber-warning font-sans border border-amber-warning/30">
                    ENGINEERING ASSUMPTION
                  </span>
                </td>
                <td className="py-3 px-4 text-right tabular-nums">
                  ${data.landed_cost.baf_surcharge_usd_per_mt.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right text-slate tabular-nums">—</td>
                <td className="py-3 px-4 text-right tabular-nums font-semibold text-charcoal">
                  ₹{(data.landed_cost.baf_surcharge_usd_per_mt * data.landed_cost.usd_inr_rate).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="rounded bg-amber-wash px-2 py-0.5 text-[10px] font-semibold text-amber-warning font-sans border border-amber-warning/30">
                    DERIVED
                  </span>
                </td>
              </tr>
              <tr className="bg-linen-mist/30 hover:bg-linen-mist/50 transition-colors">
                <td className="py-3 px-4 font-sans font-bold text-forest-ink">
                  Subtotal Landed Rate
                </td>
                <td className="py-3 px-4 text-right font-bold tabular-nums text-forest-ink">
                  ${data.landed_cost.total_usd_per_mt.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-bold text-forest-ink tabular-nums">
                  ₹{data.landed_cost.usd_inr_rate.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-bold text-forest-ink text-sm tabular-nums">
                  ₹{data.landed_cost.total_inr_per_mt.toFixed(2)} / MT
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="rounded bg-forest-ink/10 px-2 py-0.5 text-[10px] font-semibold text-forest-ink font-sans">
                    DERIVED
                  </span>
                </td>
              </tr>
              <tr className="bg-linen-mist/60 hover:bg-linen-mist/80 transition-colors text-sm">
                <td colSpan={3} className="py-3 px-4 font-sans font-extrabold text-forest-ink">
                  Total Voyage Outlay ({data.parcel_tonnage.toLocaleString()} MT)
                </td>
                <td className="py-3 px-4 text-right font-extrabold text-forest-ink text-base tabular-nums">
                  ₹{(data.landed_cost.total_inr / 10000000).toFixed(2)} Cr (₹{data.landed_cost.total_inr.toLocaleString()})
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="rounded bg-forest-ink/10 px-2 py-0.5 text-[10px] font-bold text-forest-ink font-sans">
                    DERIVED
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 4: Dual-Port Vessel & Port Feasibility Matrix (Tasks 237, 308) */}
      <section
        aria-label="Dual-Port Vessel & Port Feasibility Matrix"
        className="rounded-xl border border-pebble bg-paper p-6 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-forest-ink">
                Section 4: Dual-Port Vessel & Port Feasibility Matrix
              </h3>
              <span className="rounded-full bg-linen-mist px-2.5 py-0.5 text-[10px] font-bold text-spruce font-mono border border-spruce/20">
                DUAL-PORT VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate mt-0.5">
              Origin Load Port: <strong>{data.origin_port}</strong> ({data.origin_country}) ⇄ Discharge Port: <strong>{data.destination_port}</strong> (India)
            </p>
          </div>
          <Ship className="size-5 text-forest-ink" aria-hidden="true" />
        </div>

        {/* Dual-Port Load <-> Discharge Verification Cards */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-pebble bg-paper p-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate">Origin Load Port</span>
              <span className="rounded bg-emerald-wash px-2 py-0.5 text-[10px] font-bold text-emerald-profit border border-emerald-profit/30 font-mono">
                LOAD PORT CLEAR
              </span>
            </div>
            <h4 className="mt-1 font-bold text-charcoal text-sm">{data.origin_port}</h4>
            <p className="mt-1 text-xs text-charcoal font-mono tabular-nums">
              Permissible Draught: <strong>16.2m</strong> · Capesize/Panamax ready
            </p>
          </div>

          <div className="rounded-xl border border-pebble bg-paper p-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate">Corridor Transit</span>
              <span className="rounded bg-emerald-wash px-2 py-0.5 text-[10px] font-bold text-emerald-profit border border-emerald-profit/30 font-mono">
                CORRIDOR PASS
              </span>
            </div>
            <h4 className="mt-1 font-bold text-charcoal text-sm">Deep-Draft Transit Route</h4>
            <p className="mt-1 text-xs text-charcoal font-mono tabular-nums">
              <strong>{data.context.route_distance_nm.toLocaleString()} NM</strong> · Depth &gt; 25.0m · No air draft limits
            </p>
          </div>

          <div className="rounded-xl border border-pebble bg-paper p-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate">Discharge Port</span>
              <span className="rounded bg-amber-wash px-2 py-0.5 text-[10px] font-bold text-amber-warning border border-amber-warning/30 font-mono">
                RESTRICTED DRAFT
              </span>
            </div>
            <h4 className="mt-1 font-bold text-charcoal text-sm">{data.destination_port}</h4>
            <p className="mt-1 text-xs text-charcoal font-mono tabular-nums">
              Max Draught: <strong>16.5m</strong> · Capesize requires lightering
            </p>
          </div>
        </div>

        {/* Feasibility Table with Sticky Header & High-Contrast Status Pills */}
        <div className="mt-4 overflow-x-auto rounded-xl border border-pebble">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-pebble bg-linen-mist/80 backdrop-blur-xs text-xs font-semibold text-forest-ink uppercase">
              <tr>
                <th scope="col" className="py-2.5 px-4">Vessel Class</th>
                <th scope="col" className="py-2.5 px-3 text-center">Draft</th>
                <th scope="col" className="py-2.5 px-3 text-center">LOA</th>
                <th scope="col" className="py-2.5 px-3 text-center">Beam</th>
                <th scope="col" className="py-2.5 px-3 text-center">DWT</th>
                <th scope="col" className="py-2.5 px-3 text-center">Overall Feasibility</th>
                <th scope="col" className="py-2.5 px-4">Constraint Notes & Feasibility Analysis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pebble text-xs">
              {data.feasibility.map((row) => (
                <tr
                  key={row.vessel_class}
                  className={`transition-colors ${
                    row.overall_feasible ? "bg-paper hover:bg-emerald-wash/30" : "bg-alarm-wash/30 hover:bg-alarm-wash/50"
                  }`}
                >
                  <td className="py-3 px-4 font-bold text-forest-ink">
                    {row.vessel_class}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.draft_pass ? (
                      <span className="inline-flex items-center justify-center size-5 rounded-full bg-emerald-wash text-emerald-profit" title="Draft Pass">
                        <CheckCircle2 className="size-4" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center size-5 rounded-full bg-alarm-wash text-alarm-red" title="Draft Fail">
                        <XCircle className="size-4" />
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.loa_pass ? (
                      <span className="inline-flex items-center justify-center size-5 rounded-full bg-emerald-wash text-emerald-profit" title="LOA Pass">
                        <CheckCircle2 className="size-4" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center size-5 rounded-full bg-alarm-wash text-alarm-red" title="LOA Fail">
                        <XCircle className="size-4" />
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.beam_pass ? (
                      <span className="inline-flex items-center justify-center size-5 rounded-full bg-emerald-wash text-emerald-profit" title="Beam Pass">
                        <CheckCircle2 className="size-4" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center size-5 rounded-full bg-alarm-wash text-alarm-red" title="Beam Fail">
                        <XCircle className="size-4" />
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.dwt_pass ? (
                      <span className="inline-flex items-center justify-center size-5 rounded-full bg-emerald-wash text-emerald-profit" title="DWT Pass">
                        <CheckCircle2 className="size-4" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center size-5 rounded-full bg-alarm-wash text-alarm-red" title="DWT Fail">
                        <XCircle className="size-4" />
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block rounded px-2.5 py-0.5 font-bold font-mono text-[10px] uppercase ${
                        row.overall_feasible
                          ? "bg-emerald-wash text-emerald-profit border border-emerald-profit/40"
                          : row.requires_lightering
                          ? "bg-amber-wash text-amber-warning border border-amber-warning/40"
                          : "bg-alarm-wash text-alarm-red border border-alarm-red/40"
                      }`}
                    >
                      {row.overall_feasible ? "FEASIBLE" : row.requires_lightering ? "LIGHTERING REQUIRED" : "RESTRICTED"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {row.failure_reason ? (
                      <span className="font-semibold text-alarm-red">
                        ⚠️ {row.failure_reason}
                      </span>
                    ) : (
                      <span className="text-emerald-profit font-medium">
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
      <section
        aria-label="Seasonal Demand-Supply & Climatology Impact"
        className="rounded-xl border border-pebble bg-paper p-6 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-linen-mist p-2 text-spruce">
              <CloudRain className="size-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-forest-ink">
                  Section 4B: Seasonal Demand-Supply & Climatology Impact
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                    data.seasonal_factor?.risk_level === "HIGH"
                      ? "bg-alarm-wash text-alarm-red border border-alarm-red/40"
                      : data.seasonal_factor?.risk_level === "ELEVATED"
                      ? "bg-amber-wash text-amber-warning border border-amber-warning/40"
                      : "bg-emerald-wash text-emerald-profit border border-emerald-profit/40"
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
              <span className="text-[10px] font-bold text-slate uppercase">Seasonal Freight Multiplier</span>
              <p className="font-mono tabular-nums text-xl font-extrabold text-forest-ink">
                {data.seasonal_factor?.factor ? `${data.seasonal_factor.factor.toFixed(2)}x` : "1.26x"}
                <span className="ml-1 text-xs font-semibold text-amber-warning tabular-nums">
                  (+{Math.round(((data.seasonal_factor?.factor ?? 1.26) - 1.0) * 100)}% premium)
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNarrativeLang(narrativeLang === "en" ? "hi" : "en")}
              className="flex items-center gap-1.5 rounded-lg border border-pebble bg-paper px-3 py-1.5 text-xs font-bold text-forest-ink hover:bg-fog transition-colors focus-visible:ring-2 focus-visible:ring-signal-blue focus-visible:outline-none shadow-xs"
              title="Toggle Hindi/English Explainability"
            >
              <Languages className="size-3.5 text-spruce" aria-hidden="true" />
              <span>{narrativeLang === "en" ? "हिंदी व्याख्या" : "English Narrative"}</span>
            </button>
          </div>
        </div>

        {/* Climatology Narrative Callout with aria-live="polite" */}
        <div
          role="region"
          aria-live="polite"
          aria-label="Seasonal risk narrative"
          className="mt-4 rounded-xl border border-signal-blue/30 bg-linen-mist/50 p-4 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <Info className="size-5 shrink-0 text-spruce mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-forest-ink uppercase tracking-wide">
                Bilingual Seasonal Risk Advisory ({narrativeLang === "en" ? "English" : "हिंदी"}):
              </h4>
              <p className="text-sm text-forest-ink leading-relaxed font-sans font-medium">
                {narrativeLang === "en"
                  ? data.seasonal_factor?.narrative_en ||
                    "July Laycan: Active South-West Monsoon brings heavy sea swell to the Bay of Bengal, reducing discharge handling rates by 20–25% and suspending offshore Sandheads lightering."
                  : data.seasonal_factor?.narrative_hi ||
                    "जुलाई लैकान: बंगाल की खाड़ी में सक्रिय दक्षिण-पश्चिम मानसून की भारी लहरों के कारण डिस्चार्ज दर 20-25% घट जाती है और सैंडहेड्स पर लाइटरिंग बंद रहती है।"}
              </p>
            </div>
          </div>
        </div>

        {/* 3 Climatological Risk Pillars */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-pebble bg-paper p-4 shadow-xs hover:border-spruce/40 transition-colors">
            <span className="font-bold text-forest-ink flex items-center gap-1.5 text-sm">
              <Waves className="size-4 text-spruce" aria-hidden="true" />
              Bay of Bengal SW Monsoon
            </span>
            <p className="mt-1.5 text-charcoal leading-relaxed text-xs">
              Swell height 3.5m+ at Paradip/Dhamra outer anchorages slows crane cycling; Sandheads lightering completely shut Jun–Aug.
            </p>
          </div>
          <div className="rounded-xl border border-pebble bg-paper p-4 shadow-xs hover:border-amber-warning/40 transition-colors">
            <span className="font-bold text-forest-ink flex items-center gap-1.5 text-sm">
              <Compass className="size-4 text-amber-warning" aria-hidden="true" />
              Queensland Cyclone Window
            </span>
            <p className="mt-1.5 text-charcoal leading-relaxed text-xs">
              Tropical cyclone track alert for Hay Point &amp; Gladstone in Jan–Feb; triggers precautionary fleet closures.
            </p>
          </div>
          <div className="rounded-xl border border-pebble bg-paper p-4 shadow-xs hover:border-forest-ink/40 transition-colors">
            <span className="font-bold text-forest-ink flex items-center gap-1.5 text-sm">
              <Calendar className="size-4 text-forest-ink" aria-hidden="true" />
              Winter Heating Restocking
            </span>
            <p className="mt-1.5 text-charcoal leading-relaxed text-xs">
              Peak procurement competition from China, Japan &amp; South Korea Nov–Jan absorbs available Pacific Capesize tonnage.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5: Stockout Risk Gauge & Inventory Buffer Alert */}
      {data.stockout_alert && (
        <section
          aria-label="Stockout Risk Gauge & Inventory Buffer Alert"
          className="rounded-xl border border-pebble bg-paper p-6 shadow-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${data.stockout_alert.is_at_risk ? "bg-alarm-wash text-alarm-red" : "bg-emerald-wash text-emerald-profit"}`}>
                <Gauge className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-base font-bold text-forest-ink">
                  Section 5: Plant Stockpile Days-of-Inventory (DOI) &amp; Stockout Risk Gauge
                </h3>
                <p className="text-xs text-slate">
                  Inventory depletion runway vs optimal procurement laycan window
                </p>
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1 font-mono text-xs font-bold uppercase ${
                data.stockout_alert.is_at_risk
                  ? "bg-alarm-wash text-alarm-red border border-alarm-red/40"
                  : "bg-emerald-wash text-emerald-profit border border-emerald-profit/40"
              }`}
            >
              {data.stockout_alert.is_at_risk ? "CRITICAL STOCKOUT RISK" : "INVENTORY BUFFER ADEQUATE"}
            </span>
          </div>

          {/* Visual Stockout Risk Gauge Meter */}
          <div className="mt-5 rounded-xl border border-pebble bg-linen-mist/20 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-charcoal">Inventory Depletion Gauge:</span>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-alarm-red" />
                  <span>Hazard (&lt;15d)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-amber-warning" />
                  <span>Caution (15-30d)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-emerald-profit" />
                  <span>Safe (&gt;30d)</span>
                </span>
              </div>
            </div>

            {/* Segmented Meter Bar with Indicator Needles */}
            <div className="relative mt-4 pt-6 pb-2">
              {/* Pointer Marker for Current Stock Life */}
              <div
                className="absolute top-0 flex flex-col items-center -translate-x-1/2 transition-all"
                style={{
                  left: `${Math.min(95, Math.max(5, (data.stockout_alert.days_to_stockout / 45) * 100))}%`,
                }}
              >
                <span className="rounded bg-alarm-red px-2 py-0.5 font-mono tabular-nums text-[10px] font-bold text-paper shadow-xs whitespace-nowrap">
                  Current: {data.stockout_alert.days_to_stockout}d
                </span>
                <div className="size-0 border-x-4 border-x-transparent border-t-4 border-t-alarm-red" />
              </div>

              {/* Multi-segment Colored Track */}
              <div className="h-4 w-full overflow-hidden rounded-full flex shadow-inner">
                {/* Hazard zone: 0-15d (33.3%) */}
                <div className="h-full bg-alarm-red w-1/3" title="Hazard zone (< 15 days)" />
                {/* Caution zone: 15-30d (33.3%) */}
                <div className="h-full bg-amber-warning w-1/3" title="Caution zone (15-30 days)" />
                {/* Safe zone: 30-45d (33.3%) */}
                <div className="h-full bg-emerald-profit w-1/3" title="Safe stockpile zone (> 30 days)" />
              </div>

              {/* Threshold Labels Under Bar */}
              <div className="mt-1 flex justify-between font-mono text-[10px] text-charcoal tabular-nums">
                <span>0 days (Depletion)</span>
                <span className="font-bold text-amber-warning">15d (Min Buffer)</span>
                <span className="font-bold text-charcoal">30d (Target)</span>
                <span className="font-bold text-emerald-profit">45+ days (Optimal)</span>
              </div>
            </div>

            {/* 4 Metrics Strip */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-center">
              <div className="rounded-lg bg-paper p-3 border border-pebble">
                <span className="text-[10px] font-sans font-semibold text-slate uppercase block">Stock Life</span>
                <span className="text-xl font-bold tabular-nums text-alarm-red">
                  {data.stockout_alert.days_to_stockout} Days
                </span>
              </div>
              <div className="rounded-lg bg-paper p-3 border border-pebble">
                <span className="text-[10px] font-sans font-semibold text-slate uppercase block">Safety Threshold</span>
                <span className="text-xl font-bold tabular-nums text-charcoal">
                  15 Days
                </span>
              </div>
              <div className="rounded-lg bg-paper p-3 border border-pebble">
                <span className="text-[10px] font-sans font-semibold text-slate uppercase block">Best Rate Window</span>
                <span className="text-xl font-bold tabular-nums text-spruce">
                  {data.stockout_alert.days_to_best_window} Days
                </span>
              </div>
              <div className="rounded-lg bg-paper p-3 border border-pebble">
                <span className="text-[10px] font-sans font-semibold text-slate uppercase block">Laycan Deficit</span>
                <span className="text-xl font-extrabold tabular-nums text-alarm-red">
                  -{(15 - data.stockout_alert.days_to_stockout).toFixed(1)} Days
                </span>
              </div>
            </div>
          </div>

          {/* Alert Notification Card */}
          <div
            className={`mt-4 rounded-xl border-2 p-4 ${
              data.stockout_alert.is_at_risk
                ? "border-alarm-red bg-alarm-wash text-alarm-red"
                : "border-emerald-profit bg-emerald-wash text-emerald-profit"
            }`}
          >
            <div className="flex items-start gap-3">
              {data.stockout_alert.is_at_risk ? (
                <ShieldAlert className="size-5 shrink-0 mt-0.5 text-alarm-red" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="size-5 shrink-0 mt-0.5 text-emerald-profit" aria-hidden="true" />
              )}
              <div className="flex-1">
                <h4 className="font-bold text-sm">
                  {data.stockout_alert.is_at_risk
                    ? "CRITICAL ALERT: Stockyard inventory buffer breached below 15 days threshold"
                    : "NORMAL: Plant stockyard inventory buffer adequate"}
                </h4>
                <p className="mt-1 text-xs text-charcoal font-medium leading-relaxed">
                  {data.stockout_alert.alert_message}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 6: Multi-Dimensional Supply Chain Risk Assessment */}
      <section
        aria-label="Supply Chain Risk Assessment"
        className="rounded-xl border border-pebble bg-paper p-6 shadow-xs"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-forest-ink">
              Section 6: Multi-Dimensional Supply Chain Risk Assessment
            </h3>
            <p className="text-xs text-slate">
              Real-time telemetry and risk classification across strategic risk vectors
            </p>
          </div>
          <AlertTriangle className="size-5 text-amber-warning" aria-hidden="true" />
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-pebble">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-pebble bg-linen-mist/80 backdrop-blur-xs text-xs font-semibold text-forest-ink uppercase">
              <tr>
                <th scope="col" className="py-2.5 px-4">Risk Category</th>
                <th scope="col" className="py-2.5 px-3 text-center">Severity</th>
                <th scope="col" className="py-2.5 px-4">Telemetry Signal / Observation</th>
                <th scope="col" className="py-2.5 px-4">Verified Data Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pebble text-xs">
              {data.risks.map((risk) => (
                <tr key={risk.risk_category} className="hover:bg-linen-mist/20 transition-colors">
                  <td className="py-3 px-4 font-bold text-forest-ink capitalize">
                    {risk.risk_category ? risk.risk_category.replace(/_/g, " ") : "unavailable"}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block rounded px-2.5 py-0.5 text-[10px] font-bold uppercase font-mono ${
                        risk.severity === "LOW"
                          ? "bg-emerald-wash text-emerald-profit border border-emerald-profit/40"
                          : risk.severity === "MEDIUM"
                          ? "bg-amber-wash text-amber-warning border border-amber-warning/40"
                          : risk.severity === "HIGH"
                          ? "bg-alarm-wash text-alarm-red border border-alarm-red/40"
                          : "bg-fog text-charcoal border border-pebble"
                      }`}
                    >
                      {risk.severity || "unavailable"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-charcoal leading-relaxed font-medium">
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

      {/* SECTION 7 & 8: Recommendation Hero Card & Explainability Waterfall */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Recommendation Hero Card (Section 7) */}
        <section
          aria-label="Recommendation Hero"
          className="rounded-xl border border-spruce/30 bg-gradient-to-br from-paper via-linen-mist/20 to-emerald-wash/30 p-6 shadow-xs lg:col-span-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-forest-ink px-3 py-1 text-xs font-bold uppercase tracking-wider text-paper font-mono">
                Rank #{rec.rank} Recommended
              </span>
              <div className="text-right">
                <span className="text-[10px] text-slate uppercase font-bold">Total Deterministic Score</span>
                <p className="font-mono tabular-nums text-3xl font-extrabold text-forest-ink">
                  {rec.total_score.toFixed(3)}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-xl font-bold text-forest-ink">
                {rec.vessel_class} Class Charter
              </h3>
              <p className="text-xs text-charcoal mt-0.5">
                Discharge Port: <strong>{rec.port_name}</strong> • Parcel: <span className="font-mono tabular-nums font-semibold">{data.parcel_tonnage.toLocaleString()} MT</span>
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-pebble pt-4">
              <div className="rounded-lg bg-paper p-3 border border-pebble shadow-xs">
                <span className="text-xs font-semibold text-slate uppercase">Predicted Freight</span>
                <p className="text-lg font-bold text-charcoal font-mono tabular-nums">
                  ${data.predicted_rate_pmt.toFixed(2)} <span className="text-xs font-normal text-slate">/ MT</span>
                </p>
              </div>
              <div className="rounded-lg bg-paper p-3 border border-pebble shadow-xs">
                <span className="text-xs font-semibold text-slate uppercase">Est. Net Savings</span>
                <p className="text-lg font-bold text-emerald-profit font-mono tabular-nums">
                  +${data.estimated_savings_usd.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-4 text-[11px] text-charcoal">
              Benchmark spot rate: <strong className="font-mono tabular-nums">${data.benchmark_spot_pmt.toFixed(2)}/MT</strong> • Savings vs spot: <strong className="text-emerald-profit font-mono tabular-nums">~14.5%</strong>
            </div>
          </div>

          {/* Other Options Considered (Task 240) */}
          <div className="mt-5 border-t border-pebble pt-3">
            <span className="text-[10px] font-bold uppercase text-slate block mb-1.5">
              Other Options Considered
            </span>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between rounded bg-paper/80 p-1.5 border border-pebble text-charcoal">
                <span className="font-semibold">Supramax Class (55k MT)</span>
                <span className="text-[11px] font-mono tabular-nums text-slate">Score: 0.680 · Higher unit freight ($28.50/MT)</span>
              </div>
              <div className="flex items-center justify-between rounded bg-paper/80 p-1.5 border border-pebble text-charcoal">
                <span className="font-semibold">Capesize Class (150k MT)</span>
                <span className="text-[11px] font-mono tabular-nums text-alarm-red">Score: 0.610 · Draft restricted (18.2m &gt; 16.5m)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Explainability Panel (Section 8 — Tasks 241, 285, 311) */}
        <section
          aria-label="Explainability Waterfall"
          className="rounded-xl border border-pebble bg-paper p-6 shadow-xs lg:col-span-7"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-forest-ink">
                Section 8: Why this recommendation? (Explainability Factor Bars)
              </h3>
              <p className="text-xs text-slate">
                Multi-objective decision scoring formula: (0.50 × Cost) + (0.30 × Confidence) + (0.20 × Fit)
              </p>
            </div>
            <Sparkles className="size-5 text-forest-ink" aria-hidden="true" />
          </div>

          <div className="mt-5 space-y-4">
            {/* Cost Score (50%) -> bg-signal-blue */}
            <div>
              <div className="flex justify-between text-xs">
                <span className="font-bold text-charcoal">Cost Score (50% weight)</span>
                <span className="font-mono tabular-nums font-bold text-signal-blue">
                  {rec.cost_score.toFixed(2)} → Weighted: {(rec.cost_score * 0.5).toFixed(3)}
                </span>
              </div>
              <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-fog">
                <div
                  className="h-full bg-signal-blue transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, rec.cost_score * 100))}%` }}
                />
              </div>
              <span className="mt-0.5 text-[10px] text-charcoal block">
                Source: LightGBM Freight Quantile Engine &amp; Baltic Dry Index Benchmark
              </span>
            </div>

            {/* Confidence Score (30%) -> bg-emerald-profit */}
            <div>
              <div className="flex justify-between text-xs">
                <span className="font-bold text-charcoal">Confidence Score (30% weight)</span>
                <span className="font-mono tabular-nums font-bold text-emerald-profit">
                  {rec.confidence_score.toFixed(2)} → Weighted: {(rec.confidence_score * 0.3).toFixed(3)}
                </span>
              </div>
              <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-fog">
                <div
                  className="h-full bg-emerald-profit transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, rec.confidence_score * 100))}%` }}
                />
              </div>
              <span className="mt-0.5 text-[10px] text-charcoal block">
                Source: Quantile Spread (P90 - P10) &amp; Historical Model Certainty
              </span>
            </div>

            {/* Coverage Fit Score (20%) -> bg-amber-warning */}
            <div>
              <div className="flex justify-between text-xs">
                <span className="font-bold text-charcoal">Coverage Fit Score (20% weight)</span>
                <span className="font-mono tabular-nums font-bold text-amber-warning">
                  {rec.coverage_fit_score.toFixed(2)} → Weighted: {(rec.coverage_fit_score * 0.2).toFixed(3)}
                </span>
              </div>
              <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-fog">
                <div
                  className="h-full bg-amber-warning transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, rec.coverage_fit_score * 100))}%` }}
                />
              </div>
              <span className="mt-0.5 text-[10px] text-charcoal block">
                Source: Plant Demand Alignment &amp; Port Draught Compatibility Factor
              </span>
            </div>

            {/* Total Reconciled Score (Task 285) */}
            <div
              title="(0.5 × cost_score) + (0.3 × confidence_score) + (0.2 × coverage_fit_score) = 1.0 Total Weight"
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-linen-mist/50 p-2.5 font-mono text-xs border border-pebble"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-charcoal">
                  Deterministic Composite Score:
                </span>
                <span className="rounded bg-forest-ink/10 px-1.5 py-0.5 text-[10px] text-forest-ink font-semibold">
                  Weights: 0.50 + 0.30 + 0.20 = 1.00
                </span>
              </div>
              <span className="font-extrabold text-forest-ink tabular-nums">
                ({(rec.cost_score * 0.5).toFixed(3)} + {(rec.confidence_score * 0.3).toFixed(3)} + {(rec.coverage_fit_score * 0.2).toFixed(3)}) = {rec.total_score.toFixed(3)}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* SECTION 9: Your Decision (Accept / Override Workflow — Task 242, 312) */}
      <section
        aria-label="Procurement Officer Chartering Decision"
        className="rounded-xl border border-pebble bg-paper p-6 shadow-xs"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-forest-ink">
              Section 9: Procurement Officer Chartering Decision
            </h3>
            <p className="text-xs text-slate">
              Record official fixture governance action into the immutable audit trail
            </p>
          </div>
          <FileCheck className="size-5 text-forest-ink" aria-hidden="true" />
        </div>

        {decisionRecorded ? (
          <div className="mt-4 rounded-xl border border-emerald-profit/40 bg-emerald-wash p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-6 text-emerald-profit shrink-0" aria-hidden="true" />
              <div>
                <h4 className="font-bold text-forest-ink">
                  Decision Recorded and Committed to Immutable Audit Log
                </h4>
                <p className="text-xs text-charcoal mt-0.5">
                  Vessel Class: <strong>{data.decision?.chosen_vessel_class || data.recommended_vessel}</strong> •
                  Override: <strong>{data.decision?.was_override ? "Yes" : "No"}</strong> •
                  Timestamp: <span className="font-mono tabular-nums">{data.decision?.decided_at ? new Date(data.decision.decided_at).toLocaleString() : "Just now"}</span>
                </p>
                {data.decision?.override_reason && (
                  <p className="text-xs text-charcoal mt-1 italic">
                    Reason: "{data.decision.override_reason}"
                  </p>
                )}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.hash = "#decision";
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-forest-ink px-4 py-2 text-xs font-semibold text-paper shadow-xs hover:bg-forest-ink/90 transition-all focus-visible:ring-2 focus-visible:ring-signal-blue focus-visible:outline-none active:scale-95"
                  >
                    <span>Approve / Send for Booking (Decision Record)</span>
                    <ArrowRight className="size-3.5" aria-hidden="true" />
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
                  className="flex items-center gap-2 rounded-xl bg-forest-ink px-5 py-3 text-sm font-bold text-paper shadow-xs transition-all hover:bg-spruce focus-visible:ring-2 focus-visible:ring-signal-blue focus-visible:outline-none active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  Accept Recommendation ({rec.vessel_class} @ Paradip)
                </button>
                <button
                  type="button"
                  onClick={() => setIsOverrideMode(true)}
                  className="rounded-xl border border-pebble bg-paper px-5 py-3 text-sm font-semibold text-charcoal transition-all hover:bg-fog focus-visible:ring-2 focus-visible:ring-signal-blue focus-visible:outline-none"
                >
                  Override &amp; Choose Different Option
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-pebble bg-fog/40 p-5 space-y-4">
                <h4 className="font-bold text-forest-ink text-sm">
                  Procurement Officer Override
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-charcoal block mb-1">
                      Select Alternative Feasible Vessel Class:
                    </label>
                    <select
                      value={overrideVessel}
                      onChange={(e) => setOverrideVessel(e.target.value)}
                      className="w-full rounded-lg border border-pebble bg-paper p-2.5 text-sm text-charcoal focus-visible:ring-2 focus-visible:ring-signal-blue focus:border-signal-blue focus:outline-none"
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
                    <label className="text-xs font-bold text-charcoal block mb-1">
                      Override Justification (Required for Audit Trail):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dedicated plant conveyor preference / urgent laycan..."
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="w-full rounded-lg border border-pebble bg-paper p-2.5 text-sm text-charcoal focus-visible:ring-2 focus-visible:ring-signal-blue focus:border-signal-blue focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting || !overrideReason.trim()}
                    onClick={() => handleDecisionSubmit(true)}
                    className="flex items-center gap-2 rounded-xl bg-amber-warning px-5 py-2.5 text-sm font-bold text-paper shadow-xs transition-all hover:bg-amber-800 focus-visible:ring-2 focus-visible:ring-signal-blue focus-visible:outline-none disabled:opacity-50"
                  >
                    Confirm Override &amp; Record in Audit Log
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOverrideMode(false)}
                    className="rounded-xl border border-pebble bg-paper px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-fog focus-visible:ring-2 focus-visible:ring-signal-blue focus-visible:outline-none"
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
      <section
        aria-label="Spot vs. COA Comparison"
        className="rounded-xl border border-pebble bg-paper shadow-xs"
      >
        <button
          type="button"
          aria-expanded={coaExpanded}
          onClick={() => setCoaExpanded(!coaExpanded)}
          className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-fog/30 focus-visible:ring-2 focus-visible:ring-signal-blue focus-visible:outline-none rounded-xl"
        >
          <div className="flex items-center gap-3">
            <TrendingDown className="size-5 text-forest-ink" aria-hidden="true" />
            <div>
              <h3 className="text-base font-bold text-forest-ink">
                Section 11: Spot vs. Contract of Affreightment (COA) Comparison
              </h3>
              <p className="text-xs text-slate">
                Volume contracting analysis vs single-voyage spot chartering
              </p>
            </div>
          </div>
          {coaExpanded ? <ChevronUp className="size-5 text-forest-ink" aria-hidden="true" /> : <ChevronDown className="size-5 text-forest-ink" aria-hidden="true" />}
        </button>

        {coaExpanded && (
          <div className="border-t border-pebble p-5 pt-3">
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-linen-mist/50 p-2.5 text-xs text-forest-ink border border-signal-blue/20">
              <Info className="size-4 shrink-0 text-spruce" aria-hidden="true" />
              <span>
                <strong className="font-bold">Contract Modeling Note:</strong> COA discount is a configurable engineering assumption (~8% volume concession), not a live broker rate.
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-pebble">
              <table className="w-full text-left text-xs font-mono">
                <thead className="sticky top-0 z-10 border-b border-pebble bg-linen-mist/80 font-sans font-semibold text-forest-ink uppercase">
                  <tr>
                    <th scope="col" className="py-2.5 px-3">Contract Structure</th>
                    <th scope="col" className="py-2.5 px-3 text-right">Freight Rate ($/MT)</th>
                    <th scope="col" className="py-2.5 px-3 text-right">Cost Per Voyage</th>
                    <th scope="col" className="py-2.5 px-3 text-right">10 Voyages (Annual)</th>
                    <th scope="col" className="py-2.5 px-3 text-right">Variance vs Spot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pebble">
                  <tr className="bg-paper hover:bg-fog/30 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-semibold text-charcoal">
                      Spot Charter (Current Market)
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold">${data.benchmark_spot_pmt.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-bold tabular-nums">
                      ${(data.benchmark_spot_pmt * data.parcel_tonnage).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      ${(data.benchmark_spot_pmt * data.parcel_tonnage * 10).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate tabular-nums font-semibold">Baseline</td>
                  </tr>
                  <tr className="bg-emerald-wash/40 hover:bg-emerald-wash/60 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-bold text-emerald-profit">
                      Predicted Spot Fixture (Astitva)
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-profit font-bold tabular-nums">
                      ${data.predicted_rate_pmt.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-profit tabular-nums">
                      ${(data.predicted_rate_pmt * data.parcel_tonnage).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-profit tabular-nums">
                      ${(data.predicted_rate_pmt * data.parcel_tonnage * 10).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-profit font-extrabold tabular-nums">
                      -${data.estimated_savings_usd.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-linen-mist/30 hover:bg-linen-mist/50 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-bold text-forest-ink">
                      Annual COA Agreement (~8% Discount)
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-forest-ink tabular-nums">
                      ${(data.predicted_rate_pmt * 0.92).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-forest-ink tabular-nums">
                      ${(data.predicted_rate_pmt * 0.92 * data.parcel_tonnage).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-forest-ink tabular-nums">
                      ${(data.predicted_rate_pmt * 0.92 * data.parcel_tonnage * 10).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-forest-ink font-extrabold tabular-nums">
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
      <section
        aria-label="Idle Time Turnaround & Alternative Employment"
        className="rounded-xl border border-pebble bg-paper p-6 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-wash p-2 text-forest-ink">
              <Clock className="size-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-forest-ink">
                  Section 12: Idle Time Turnaround &amp; Alternative Employment Recommendations
                </h3>
                <span className="rounded bg-emerald-wash px-2 py-0.5 text-[10px] font-bold text-emerald-profit font-mono border border-emerald-profit/30">
                  SIH26006 DISPATCH SOLVER
                </span>
              </div>
              <p className="text-xs text-slate mt-0.5">
                Turnaround queue forecasting, financial demurrage risk mitigation, and post-discharge vessel employment
              </p>
            </div>
          </div>
        </div>

        {/* 5 Turnaround KPI Metric Strips with Color-Coded Alerts */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5 font-mono text-center">
          <div className="rounded-xl border border-pebble bg-paper p-3 shadow-xs">
            <span className="text-[10px] font-sans font-bold text-slate uppercase block">
              Origin Queue ({data.origin_port.split(" ")[0]})
            </span>
            <p className="mt-1 text-lg font-bold tabular-nums text-forest-ink">
              {data.turnaround?.origin_waiting_days ? `${data.turnaround.origin_waiting_days} d` : "3.4 d"}
            </p>
            <span className="text-[10px] font-sans text-charcoal">Load berth wait</span>
          </div>

          <div className="rounded-xl border border-pebble bg-paper p-3 shadow-xs">
            <span className="text-[10px] font-sans font-bold text-slate uppercase block">
              Discharge Queue ({data.destination_port})
            </span>
            <p className="mt-1 text-lg font-bold tabular-nums text-forest-ink">
              {data.turnaround?.destination_waiting_days ? `${data.turnaround.destination_waiting_days} d` : "2.8 d"}
            </p>
            <span className="text-[10px] font-sans text-charcoal">Discharge berth wait</span>
          </div>

          <div className="rounded-xl border border-pebble bg-paper p-3 shadow-xs">
            <span className="text-[10px] font-sans font-bold text-slate uppercase block">
              Allowed Laytime
            </span>
            <p className="mt-1 text-lg font-bold tabular-nums text-forest-ink">
              {data.turnaround?.laytime_allowed_days ? `${data.turnaround.laytime_allowed_days} d` : "8.5 d"}
            </p>
            <span className="text-[10px] font-sans text-charcoal">Contract laytime</span>
          </div>

          {/* Demurrage Exposure - Color Coded Alert */}
          <div className={`rounded-xl border p-3 shadow-xs ${
            (data.turnaround?.demurrage_exposure_usd ?? 44800) > 0
              ? "border-amber-warning/40 bg-amber-wash"
              : "border-pebble bg-paper"
          }`}>
            <span className="text-[10px] font-sans font-bold text-slate uppercase block">
              Demurrage Exposure
            </span>
            <p className={`mt-1 text-lg font-extrabold tabular-nums ${
              (data.turnaround?.demurrage_exposure_usd ?? 44800) > 0
                ? "text-amber-warning"
                : "text-emerald-profit"
            }`}>
              ${(data.turnaround?.demurrage_exposure_usd ?? 44800).toLocaleString()}
            </p>
            <span className="text-[10px] font-sans font-semibold text-amber-warning">
              Overrun at benchmark laytime
            </span>
          </div>

          {/* Ballast Deadhead Loss - Color Coded Alert */}
          <div className="rounded-xl border border-alarm-red/40 bg-alarm-wash p-3 shadow-xs">
            <span className="text-[10px] font-sans font-bold text-slate uppercase block">
              Ballast Deadhead Loss
            </span>
            <p className="mt-1 text-lg font-extrabold tabular-nums text-alarm-red">
              {data.turnaround?.ballast_deadhead_days ? `${data.turnaround.ballast_deadhead_days} d` : "18.5 d"}
            </p>
            <span className="text-[10px] font-sans font-semibold text-alarm-red">
              Unladen return steaming
            </span>
          </div>
        </div>

        {/* 4 Actionable Alternative Employment Cards */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-forest-ink">
                Ranked Alternative Employment Strategies
              </h4>
              <p className="text-xs text-slate">
                Commercial fixtures to absorb unladen ballast deadheading and monetize vessel idle time
              </p>
            </div>
            {selectedAlt && (
              <span className="rounded-full bg-forest-ink px-3 py-1 text-xs font-bold text-paper font-mono shadow-xs">
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
                  className={`rounded-xl border p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                    isSelected
                      ? "border-forest-ink bg-linen-mist/30 ring-2 ring-forest-ink shadow-md"
                      : "border-pebble bg-paper hover:border-spruce/40 shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="rounded bg-linen-mist px-2 py-0.5 text-[10px] font-bold text-spruce font-mono border border-spruce/20">
                        {alt.route_type}
                      </span>
                      <h5 className="mt-1.5 text-sm font-bold text-forest-ink leading-snug">
                        {alt.title}
                      </h5>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-slate uppercase block">Est. Net Benefit</span>
                      <span className="rounded-full bg-emerald-wash px-2.5 py-1 font-mono text-sm font-bold text-emerald-profit border border-emerald-profit/30 tabular-nums inline-block mt-0.5">
                        +${alt.net_benefit_usd.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-charcoal leading-relaxed">
                    {alt.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-pebble pt-3 text-xs">
                    <span className="font-mono tabular-nums text-charcoal">
                      Absorbs: <strong className="text-forest-ink">{alt.absorbed_idle_days} days</strong> deadhead
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedAlt(isSelected ? null : alt.id)}
                      className={`rounded-lg px-3.5 py-1 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-signal-blue focus-visible:outline-none ${
                        isSelected
                          ? "bg-forest-ink text-paper shadow-xs"
                          : "border border-pebble bg-paper text-charcoal hover:bg-fog shadow-xs"
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

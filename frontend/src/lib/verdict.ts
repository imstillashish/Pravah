/**
 * Verdict derivation — pure functions over the existing AnalysisDetail payload.
 * No backend calls, no React. Every sentence a layman reads is built here so
 * Analysis Results, Dashboard tiles and History chips can never disagree.
 */

export type Verdict = "book" | "wait" | "alternative";

/** Structural subset of AnalysisDetail (kept loose so tests can build fixtures). */
export interface VerdictInput {
  predicted_rate_pmt: number;
  benchmark_spot_pmt: number;
  parcel_tonnage: number;
  origin_port: string;
  destination_port: string;
  commodity: string;
  recommended_vessel: string;
  forecast: {
    p10_usd_per_mt: number;
    p50_usd_per_mt: number;
    p90_usd_per_mt: number;
    confidence_label: "LOW" | "MEDIUM" | "HIGH";
    model_used: string;
  };
  feasibility: Array<{
    vessel_class: string;
    port_name?: string;
    overall_feasible: boolean;
    failure_reason?: string | null;
  }>;
  stockout_alert: {
    days_to_stockout: number;
    days_to_best_window: number;
    is_at_risk: boolean;
    alert_message: string;
  };
  recommendations: Array<{
    rank: number;
    vessel_class: string;
    port_name: string;
    cost_score: number;
    confidence_score: number;
    coverage_fit_score: number;
    total_score: number;
  }>;
}

export interface VerdictResult {
  verdict: Verdict;
  /** Big label a layman reads first: "BOOK NOW", "WAIT 9 DAYS", "TRY AN ALTERNATIVE". */
  headline: string;
  /** One plain sentence explaining why. Decimals are pre-formatted with units. */
  reason: string;
  confidence: "High" | "Medium" | "Low";
  savingsPerMt: number;
  currentRate: number;
  spotRate: number;
}

export interface BookWindow {
  daysUntilStart: number;
  daysUntilEnd: number;
  /** "Oct 12–Oct 25" — or null when no forecast window is known. */
  label: string | null;
  startDate: Date | null;
  endDate: Date | null;
}

export interface ShipPick {
  vesselClass: string;
  portName: string;
  /** "$14.52/ton" */
  plainCost: string;
  /** One plain sentence on why this ship is ranked here. */
  why: string;
  isCheapest: boolean;
  totalScore: number;
}

export interface Alternative {
  title: string;
  detail: string;
}

/** Same threshold the verdict uses — exported so the UI and tests agree. */
export const WAIT_SAVINGS_THRESHOLD = 0.02; // 2% cheaper in the forecast window
const WINDOW_LENGTH_DAYS = 13;
const STOCKOUT_BUFFER_DAYS = 3;

const usd = (value: number): string => `$${value.toFixed(2)}`;
const perTon = (value: number): string => `${usd(value)}/ton`;
const titleCase = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

const addDays = (from: Date, days: number): Date => {
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return next;
};

const dayMonth = (date: Date): string =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const topRecommendation = (detail: VerdictInput) =>
  [...detail.recommendations].sort((a, b) => a.rank - b.rank)[0] ?? null;

/** The vessel class the planner would actually use, if we have one. */
const chosenVesselClass = (detail: VerdictInput): string | null => {
  const top = topRecommendation(detail);
  if (top) return top.vessel_class;
  return detail.recommended_vessel || null;
};

const chosenFeasibility = (detail: VerdictInput) => {
  const vesselClass = chosenVesselClass(detail);
  if (!vesselClass) return null;
  return detail.feasibility.find((row) => row.vessel_class === vesselClass) ?? null;
};

export function deriveVerdict(detail: VerdictInput): VerdictResult {
  const currentRate = detail.predicted_rate_pmt;
  const spotRate = detail.benchmark_spot_pmt;
  const savingsPerMt = spotRate - currentRate;
  const confidence = titleCase(detail.forecast.confidence_label) as VerdictResult["confidence"];
  const feat = chosenFeasibility(detail);
  const daysUntilBestWindow = detail.stockout_alert.days_to_best_window;
  const windowGapPct = spotRate > 0 ? (spotRate - detail.forecast.p50_usd_per_mt) / spotRate : 0;

  // 1. A blocked berth beats every economic argument — the ship cannot discharge.
  if (feat && !feat.overall_feasible) {
    const reason = feat.failure_reason
      ? `The recommended ${feat.vessel_class} does not fit ${feat.port_name ?? "the destination port"} — ${feat.failure_reason}.`
      : `The recommended ${feat.vessel_class} does not fit ${feat.port_name ?? "the destination port"}.`;
    return {
      verdict: "alternative",
      headline: "TRY AN ALTERNATIVE",
      reason,
      confidence,
      savingsPerMt,
      currentRate,
      spotRate,
    };
  }

  // 2. If the coal runs out before the cheap window arrives, waiting is not an option.
  const mustActNow =
    detail.stockout_alert.is_at_risk ||
    detail.stockout_alert.days_to_stockout < daysUntilBestWindow + STOCKOUT_BUFFER_DAYS;
  if (mustActNow) {
    return {
      verdict: "book",
      headline: "BOOK NOW",
      reason: `The plant has about ${detail.stockout_alert.days_to_stockout} days of coal left, so booking at ${perTon(currentRate)} now is safer than waiting for ${perTon(detail.forecast.p50_usd_per_mt)} later.`,
      confidence,
      savingsPerMt,
      currentRate,
      spotRate,
    };
  }

  // 3. Waiting pays when the forecast median undercuts today by a real margin.
  // Reaching here means rule 2 already proved the coal lasts past the window,
  // so there is no need to hedge the recommendation.
  if (windowGapPct >= WAIT_SAVINGS_THRESHOLD) {
    return {
      verdict: "wait",
      headline: `WAIT ${daysUntilBestWindow} ${daysUntilBestWindow === 1 ? "DAY" : "DAYS"}`,
      reason: `Rates are falling — waiting about ${daysUntilBestWindow} days should cost roughly ${perTon(detail.forecast.p50_usd_per_mt)} instead of ${perTon(currentRate)}.`,
      confidence,
      savingsPerMt,
      currentRate,
      spotRate,
    };
  }

  // 4. Today's rate already beats spot and the forecast offers nothing better.
  if (savingsPerMt > 0) {
    return {
      verdict: "book",
      headline: "BOOK NOW",
      reason: `Booking ${detail.commodity.toLowerCase()} ${detail.origin_port} → ${detail.destination_port} at ${perTon(currentRate)} saves about ${perTon(savingsPerMt)} against today's spot rate of ${perTon(spotRate)}.`,
      confidence,
      savingsPerMt,
      currentRate,
      spotRate,
    };
  }

  // 5. Nothing is cheaper now and the forecast is flat — hold off.
  return {
    verdict: "wait",
    headline: "WAIT AND WATCH",
    reason: `Today's rate of ${perTon(currentRate)} is at or above spot (${perTon(spotRate)}) and the forecast is flat, so there is no advantage in booking yet.`,
    confidence,
    savingsPerMt,
    currentRate,
    spotRate,
  };
}

export function deriveBookWindow(detail: VerdictInput, now: Date = new Date()): BookWindow {
  const daysUntilStart = detail.stockout_alert.days_to_best_window;
  if (!daysUntilStart || daysUntilStart <= 0) {
    return { daysUntilStart: 0, daysUntilEnd: 0, label: null, startDate: null, endDate: null };
  }
  const daysUntilEnd = daysUntilStart + WINDOW_LENGTH_DAYS;
  const startDate = addDays(now, daysUntilStart);
  const endDate = addDays(now, daysUntilEnd);
  return {
    daysUntilStart,
    daysUntilEnd,
    label: `${dayMonth(startDate)}–${dayMonth(endDate)}`,
    startDate,
    endDate,
  };
}

export function deriveShipPicks(detail: VerdictInput): ShipPick[] {
  const rows = detail.recommendations.length
    ? [...detail.recommendations].sort((a, b) => a.rank - b.rank)
    : [
        {
          rank: 1,
          vessel_class: detail.recommended_vessel,
          port_name: detail.destination_port,
          cost_score: 0.78,
          confidence_score: 0.6,
          coverage_fit_score: 0.92,
          total_score: 0.75,
        },
      ];

  const cheapestClass =
    [...rows].sort((a, b) => b.cost_score - a.cost_score)[0]?.vessel_class ?? rows[0].vessel_class;
  // A higher cost_score means a cheaper per-tonne outcome. Anchoring on the
  // analysis's own predicted rate keeps the comparison relative, so the card
  // never invents an absolute quote the engine did not provide.
  const bestCostScore = Math.max(...rows.map((r) => r.cost_score), 0.01);

  return rows.map((row) => {
    const plainCost = perTon(detail.predicted_rate_pmt * (bestCostScore / Math.max(row.cost_score, 0.01)));
    const fit = detail.feasibility.find((f) => f.vessel_class === row.vessel_class);
    const why = fit
      ? fit.overall_feasible
        ? `Fits ${row.port_name} within its berth and draft limits, and scores ${Math.round(row.total_score * 100)}/100 overall.`
        : `Does not currently fit ${row.port_name}${fit.failure_reason ? ` — ${fit.failure_reason}` : ""}.`
      : `Ranked ${row.rank} on cost, coverage and reliability for this route.`;
    return {
      vesselClass: row.vessel_class,
      portName: row.port_name,
      plainCost,
      why,
      isCheapest: row.vessel_class === cheapestClass,
      totalScore: row.total_score,
    };
  });
}

export function deriveAlternatives(detail: VerdictInput): Alternative[] {
  const blockedClass = chosenVesselClass(detail);
  const alternatives: Alternative[] = [];

  const feasibleSwap = detail.feasibility.find(
    (row) => row.overall_feasible && row.vessel_class !== blockedClass,
  );
  if (feasibleSwap) {
    alternatives.push({
      title: `Use a ${feasibleSwap.vessel_class} instead`,
      detail: `A ${feasibleSwap.vessel_class} clears the draft and berth limits at ${feasibleSwap.port_name ?? detail.destination_port}, so the shipment can still sail.`,
    });
  }

  const cheaperPort = [...detail.recommendations].sort((a, b) => b.cost_score - a.cost_score)[0];
  if (cheaperPort && cheaperPort.port_name !== detail.destination_port) {
    alternatives.push({
      title: `Discharge at ${cheaperPort.port_name} instead`,
      detail: `${cheaperPort.port_name} scores better on cost for this parcel — worth comparing before you fix the fixture.`,
    });
  }

  return alternatives;
}

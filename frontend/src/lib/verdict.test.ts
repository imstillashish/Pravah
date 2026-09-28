import { describe, expect, it } from "vitest";
import { deriveAlternatives, deriveBookWindow, deriveShipPicks, deriveVerdict } from "./verdict";

const baseDetail = {
  id: 1,
  title: "Newcastle → Paradip 75k MT",
  origin_port: "Newcastle, AU",
  destination_port: "Paradip",
  commodity: "Coking Coal",
  parcel_tonnage: 75000,
  recommended_vessel: "Panamax",
  predicted_rate_pmt: 14.52,
  benchmark_spot_pmt: 16.5,
  estimated_savings_usd: 148500,
  status: "finalized",
  created_at: "2026-09-27T11:28:00Z",
  context: {
    route_distance_nm: 5600,
    inferred_vessel_class: "Panamax",
    origin_lat: 0,
    origin_lon: 0,
    destination_lat: 0,
    destination_lon: 0,
    note: "Golden demo",
  },
  forecast: {
    p10_usd_per_mt: 12.0,
    p50_usd_per_mt: 13.2,
    p90_usd_per_mt: 16.8,
    arima_baseline_usd_per_mt: 14.9,
    confidence_label: "HIGH" as const,
    model_used: "quantile-v1",
  },
  feasibility: [
    {
      vessel_class: "Panamax",
      port_name: "Paradip",
      draft_pass: true,
      loa_pass: true,
      beam_pass: true,
      dwt_pass: true,
      overall_feasible: true,
    },
  ],
  landed_cost: {
    freight_rate_usd_per_mt: 14.52,
    baf_surcharge_usd_per_mt: 1.1,
    usd_inr_rate: 83.2,
    total_usd_per_mt: 15.62,
    total_inr_per_mt: 1299.6,
    total_inr: 9747000,
  },
  stockout_alert: {
    days_to_stockout: 15,
    days_to_best_window: 9,
    is_at_risk: false,
    alert_message: "Bhilai requires fixture closure within 3 days",
  },
  risks: [],
  recommendations: [
    {
      rank: 1,
      vessel_class: "Panamax",
      port_name: "Paradip",
      cost_score: 0.78,
      confidence_score: 0.6,
      coverage_fit_score: 0.92,
      total_score: 0.756,
    },
  ],
  regret_scores: [{ regret_pct: 2.1, chosen_day_rate: 14.52, best_rate_in_window: 13.2 }],
};

const withOverrides = (overrides: Record<string, unknown>): any => ({ ...baseDetail, ...overrides });

describe("deriveVerdict", () => {
  it("books now when waiting would risk a stock-out", () => {
    const detail = withOverrides({
      stockout_alert: { days_to_stockout: 10, days_to_best_window: 9, is_at_risk: true, alert_message: "" },
    });
    expect(deriveVerdict(detail).verdict).toBe("book");
  });

  it("waits when the forecast is meaningfully cheaper than today's rate", () => {
    const detail = withOverrides({
      stockout_alert: { days_to_stockout: 40, days_to_best_window: 9, is_at_risk: false, alert_message: "" },
    });
    // (16.5 - 13.2) / 16.5 = 20% cheaper in the forecast window
    expect(deriveVerdict(detail).verdict).toBe("wait");
  });

  it("books when today's rate already beats spot and the forecast is not cheaper", () => {
    const detail = withOverrides({
      forecast: { ...baseDetail.forecast, p50_usd_per_mt: 16.4 },
      stockout_alert: { days_to_stockout: 40, days_to_best_window: 9, is_at_risk: false, alert_message: "" },
    });
    // predicted 14.52 vs spot 16.50 = 12% saved now; forecast p50 16.4 is not cheaper
    expect(deriveVerdict(detail).verdict).toBe("book");
  });

  it("suggests an alternative when the top recommendation fails port feasibility", () => {
    const detail = withOverrides({
      feasibility: [
        {
          vessel_class: "Panamax",
          port_name: "Paradip",
          draft_pass: false,
          loa_pass: true,
          beam_pass: true,
          dwt_pass: true,
          overall_feasible: false,
          failure_reason: "Draft exceeds 14.5m at Paradip",
        },
      ],
    });
    const result = deriveVerdict(detail);
    expect(result.verdict).toBe("alternative");
    expect(result.reason).toContain("does not fit");
  });

  it("carries the forecast confidence label through, title-cased", () => {
    expect(deriveVerdict(withOverrides({})).confidence).toBe("High");
    const low = withOverrides({ forecast: { ...baseDetail.forecast, confidence_label: "LOW" } });
    expect(deriveVerdict(low).confidence).toBe("Low");
  });

  it("states a per-tonne saving with a unit and never a bare float", () => {
    const result = deriveVerdict(withOverrides({}));
    expect(result.savingsPerMt).toBeCloseTo(1.98, 2);
    expect(result.reason).toMatch(/\$[\d.]+\/ton/);
  });
});

describe("deriveBookWindow", () => {
  it("starts the window on the best-forecast day and runs 13 days", () => {
    const window = deriveBookWindow(withOverrides({}));
    expect(window.daysUntilStart).toBe(9);
    expect(window.daysUntilEnd).toBe(22);
    expect(window.label).toMatch(/^[A-Z][a-z]{2} \d{1,2}–[A-Z][a-z]{2} \d{1,2}$/);
  });

  it("returns null label when no forecast window is known", () => {
    const detail = withOverrides({
      stockout_alert: { days_to_stockout: 15, days_to_best_window: 0, is_at_risk: false, alert_message: "" },
    });
    expect(deriveBookWindow(detail).label).toBeNull();
  });
});

describe("deriveShipPicks", () => {
  it("ranks ships in plain words with a per-tonne cost", () => {
    const picks = deriveShipPicks(withOverrides({}));
    expect(picks[0].vesselClass).toBe("Panamax");
    expect(picks[0].plainCost).toMatch(/\$[\d.]+\/ton/);
    expect(picks[0].why.length).toBeGreaterThan(10);
  });

  it("marks the cheapest pick", () => {
    const detail = withOverrides({
      recommendations: [
        { ...baseDetail.recommendations[0], vessel_class: "Panamax", cost_score: 0.91, total_score: 0.756 },
        { ...baseDetail.recommendations[0], rank: 2, vessel_class: "Capesize", cost_score: 0.78, total_score: 0.7 },
      ],
    });
    expect(deriveShipPicks(detail)[0].isCheapest).toBe(true);
    expect(deriveShipPicks(detail)[1].isCheapest).toBe(false);
  });
});

describe("deriveAlternatives", () => {
  it("names a feasible vessel class when the first pick is blocked", () => {
    const detail = withOverrides({
      feasibility: [
        { ...baseDetail.feasibility[0], overall_feasible: false, failure_reason: "Draft exceeds 14.5m" },
        { ...baseDetail.feasibility[0], vessel_class: "Capesize", overall_feasible: true },
      ],
    });
    const alternatives = deriveAlternatives(detail);
    expect(alternatives[0].title).toContain("Capesize");
  });

  it("returns an empty list when nothing better exists", () => {
    expect(deriveAlternatives(withOverrides({}))).toEqual([]);
  });
});

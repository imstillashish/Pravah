/**
 * The single jargon dictionary. Every expert term the app renders gets one
 * layman label plus a sentence template here — never inline in a component —
 * so the plain layer stays consistent and coverage is testable.
 */

export interface PlainTerm {
  /** Layman-facing label, sentence case. */
  label: string;
  /** Unit shown next to the number, e.g. "%", "m", "tons". */
  unit?: string;
  /** Plain-English sentence. The formatted value is passed in as `v`. */
  template: (v: string) => string;
}

/** Fields the UI must be able to translate — checked by the coverage test. */
export const REQUIRED_FIELDS = [
  "spot_vs_period_gap",
  "forecasted_window",
  "vessel_parcel_pairing",
  "plant_coal_reserves",
  "berth_availability",
  "draft_advisory",
  "avg_turnaround",
  "baltic_dry_index",
  "avg_freight_rate",
  "bunker_vlsfo",
  "loa",
  "dwt",
  "baf",
  "laycan",
  "pmt",
  "capesize",
  "panamax",
  "lightering",
  "stockout",
  "regret",
  "freight_rate",
  "landed_cost",
] as const;

export const PLAIN_TERMS: Record<string, PlainTerm> = {
  spot_vs_period_gap: {
    label: "Short-term vs daily market",
    unit: "%",
    template: (v) => `Short-term contracts are ${v.replace("-", "")}% cheaper than the daily spot market right now.`,
  },
  forecasted_window: {
    label: "Cheapest booking window",
    template: (v) => `Rates are expected to be lowest between ${v}.`,
  },
  vessel_parcel_pairing: {
    label: "Recommended ship size",
    unit: "tons",
    template: (v) => `A ship carrying about ${v} tons fits this route and its berths.`,
  },
  plant_coal_reserves: {
    label: "Coal left at the plant",
    template: (v) => `The plant has about ${v} of coal left before it runs short.`,
  },
  berth_availability: {
    label: "Berths free now",
    template: (v) => `${v} berths are free for immediate discharge.`,
  },
  draft_advisory: {
    label: "Water depth limit",
    unit: "m",
    template: (v) => `Ships drawing more than ${v} m of water cannot berth here right now.`,
  },
  avg_turnaround: {
    label: "Average time in port",
    unit: "h",
    template: (v) => `Ships wait about ${v} hours in port on average.`,
  },
  baltic_dry_index: {
    label: "Global shipping price index",
    template: (v) => `The global shipping price index is ${v}. When it falls, freight gets cheaper.`,
  },
  avg_freight_rate: {
    label: "Average freight rate",
    unit: "$/ton",
    template: (v) => `The average freight rate across tracked routes is ${v} per ton.`,
  },
  bunker_vlsfo: {
    label: "Ship fuel price",
    unit: "$/ton",
    template: (v) => `Ship fuel costs ${v} per ton, which feeds directly into freight rates.`,
  },
  loa: {
    label: "Ship length",
    unit: "m",
    template: (v) => `The ship is ${v} m long — some ports cap how long a vessel may be.`,
  },
  dwt: {
    label: "Carrying capacity",
    unit: "tons",
    template: (v) => `The ship can carry up to ${v} tons of cargo.`,
  },
  baf: {
    label: "Fuel surcharge",
    unit: "$/ton",
    template: (v) => `A fuel surcharge of ${v} per ton is added to the base freight rate.`,
  },
  laycan: {
    label: "Loading window",
    template: (v) => `The agreed loading window is ${v}; missing it can cost extra.`,
  },
  pmt: {
    label: "Per ton",
    unit: "$/ton",
    template: (v) => `${v} per ton of cargo.`,
  },
  capesize: {
    label: "Very large bulk ship",
    template: () => "A Capesize is the largest common bulk carrier — cheapest per ton, but needs deep water and long berths.",
  },
  panamax: {
    label: "Mid-size bulk ship",
    template: () => "A Panamax is a mid-size bulk carrier that fits most Indian east-coast berths.",
  },
  lightering: {
    label: "Offloading to smaller ships",
    template: () => "Lightering means part of the cargo is offloaded to smaller ships because the berth is too shallow.",
  },
  stockout: {
    label: "Risk of running out of coal",
    template: (v) => `Days of coal left before the plant runs short: ${v}.`,
  },
  regret: {
    label: "Cost of not picking the best day",
    unit: "%",
    template: (v) => `Booking on the best day instead of the chosen day would have moved the cost by ${v}%.`,
  },
  freight_rate: {
    label: "Freight rate",
    unit: "$/ton",
    template: (v) => `The freight rate is ${v} per ton.`,
  },
  landed_cost: {
    label: "Total delivered cost",
    unit: "$/ton",
    template: (v) => `Freight plus surcharges comes to ${v} per ton delivered.`,
  },
};

const humanize = (field: string): string => {
  const spaced = field.replace(/[_-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

export const hasPlainTerm = (field: string): boolean => field in PLAIN_TERMS;

export function explain(field: string, value?: string | number): { label: string; sentence: string; unit?: string } {
  const term = PLAIN_TERMS[field];
  const formatted = value === undefined ? "" : String(value);
  if (!term) {
    const label = humanize(field);
    return { label, sentence: value === undefined ? label : `${label}: ${formatted}` };
  }
  return {
    label: term.label,
    sentence: term.template(formatted),
    unit: term.unit,
  };
}

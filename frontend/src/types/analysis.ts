export interface AnalysisObject {
  id: number;
  user_id: number;
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
  status: "draft" | "finalized" | "overridden";
  created_at: string;
}

export interface GlobalMetrics {
  bdi_index: number;
  bdi_change_pct: number;
  current_avg_freight_pmt: number;
  freight_change_pct: number;
  bunker_vlsfo_pmt: number;
  capesize_daily_usd: number;
  panamax_daily_usd: number;
}

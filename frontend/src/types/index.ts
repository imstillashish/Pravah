export interface Analysis {
  id: string | number;
  user_id?: string | number;
  plant_id?: number | null;
  cargo_type_id?: number;
  quantity_mt: number;
  origin_port: string;
  destination_port_id: number | string;
  delivery_start: string;
  delivery_end: string;
  status: "DRAFT" | "PROCESSING" | "COMPLETE" | "OVERRIDDEN";
  current_stock_mt?: number | null;
  daily_consumption_mt?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface ContextObject {
  id: string;
  analysis_id: string;
  route_distance_nm?: number;
  inferred_vessel_class?: string;
  origin_lat?: number;
  origin_lon?: number;
  destination_lat?: number;
  destination_lon?: number;
  context_resolved_at?: string;
}

export interface ForecastResult {
  id: string;
  analysis_id: string;
  p10_usd_per_mt: number;
  p50_usd_per_mt: number;
  p90_usd_per_mt: number;
  arima_baseline_usd_per_mt?: number;
  confidence_label: "LOW" | "MEDIUM" | "HIGH";
  model_used: string;
  forecast_generated_at?: string;
}

export interface FeasibilityResult {
  id: string;
  analysis_id: string;
  vessel_class: string;
  port_id: number;
  draft_pass: boolean;
  loa_pass: boolean;
  beam_pass: boolean;
  dwt_pass: boolean;
  overall_feasible: boolean;
  requires_lightering: boolean;
  failure_reason?: string | null;
}

export interface RiskResult {
  id: string;
  analysis_id: string;
  risk_category: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "NOT_ASSESSED";
  signal_description?: string | null;
  data_source?: string | null;
}

export interface RecommendationResult {
  id: string;
  analysis_id: string;
  rank: number;
  vessel_class: string;
  port_id: number;
  cost_score: number;
  confidence_score: number;
  coverage_fit_score: number;
  total_score: number;
  cost_score_breakdown?: string;
  is_emergency_mode: boolean;
}

export interface ExplainabilityResult {
  id: string;
  analysis_id: string;
  feature_name: string;
  shap_value: number;
  feature_impact: string;
}

export interface DecisionRecord {
  id: string;
  analysis_id: string;
  chosen_vessel_class: string;
  chosen_port_id: number;
  was_override: boolean;
  override_reason?: string | null;
  decided_by: string;
  decided_at: string;
}

export interface LandedCost {
  id: string;
  analysis_id: string;
  freight_rate_usd_per_mt: number;
  baf_surcharge_usd_per_mt: number;
  usd_inr_rate: number;
  total_usd_per_mt: number;
  total_inr_per_mt: number;
  total_inr: number;
  computed_at?: string;
}

export interface StockOutAlert {
  id: string;
  plant_name: string;
  days_of_stock_left: number;
  daily_burn_rate_mt: number;
  current_inventory_mt: number;
  stockout_predicted_date: string;
  urgency_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface PoolingResult {
  id: string;
  combined_cargo_tonnage: number;
  participating_plants: string[];
  recommended_vessel_class: string;
  total_savings_usd: number;
}

export interface RegretScore {
  id: string;
  decision_record_id: string;
  regret_pct: number;
  chosen_day_rate: number;
  best_rate_in_window: number;
  window_start: string;
  window_end: string;
  computed_at: string;
}

export interface DisruptionAlert {
  id: number;
  keyword_matched: string;
  headline_text: string;
  source_url?: string;
  matched_at: string;
  is_active: boolean;
}

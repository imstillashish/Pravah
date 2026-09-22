from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class ContextObject(Base):
    __tablename__ = "context_objects"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), unique=True, nullable=False)
    route_distance_nm = Column(Float, nullable=True)
    inferred_vessel_class = Column(String, nullable=True)
    origin_lat = Column(Float, nullable=True)
    origin_lon = Column(Float, nullable=True)
    destination_lat = Column(Float, nullable=True)
    destination_lon = Column(Float, nullable=True)
    context_resolved_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class EnrichmentCache(Base):
    __tablename__ = "enrichment_cache"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=True)
    data_key = Column(String, nullable=False, index=True)
    data_value = Column(Text, nullable=False)
    data_classification = Column(String, default="REAL_DATA")
    source_url = Column(String, nullable=True)
    fetched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_stale = Column(Boolean, default=False)

class ForecastResult(Base):
    __tablename__ = "forecast_results"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), unique=True, nullable=False)
    p10_usd_per_mt = Column(Float, nullable=False)
    p50_usd_per_mt = Column(Float, nullable=False)
    p90_usd_per_mt = Column(Float, nullable=False)
    arima_baseline_usd_per_mt = Column(Float, nullable=True)
    confidence_label = Column(String, default="MEDIUM")
    model_used = Column(String, default="LightGBM_Quantile_v1")
    forecast_generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class FeasibilityResult(Base):
    __tablename__ = "feasibility_results"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)
    vessel_class = Column(String, nullable=False)
    port_id = Column(Integer, nullable=False)
    draft_pass = Column(Boolean, default=True)
    loa_pass = Column(Boolean, default=True)
    beam_pass = Column(Boolean, default=True)
    dwt_pass = Column(Boolean, default=True)
    overall_feasible = Column(Boolean, default=True)
    requires_lightering = Column(Boolean, default=False)
    failure_reason = Column(Text, nullable=True)

class LandedCost(Base):
    __tablename__ = "landed_costs"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), unique=True, nullable=False)
    freight_rate_usd_per_mt = Column(Float, nullable=False)
    baf_surcharge_usd_per_mt = Column(Float, default=0.0)
    usd_inr_rate = Column(Float, default=86.5)
    total_usd_per_mt = Column(Float, nullable=False)
    total_inr_per_mt = Column(Float, nullable=False)
    total_inr = Column(Float, nullable=False)
    computed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class RiskResult(Base):
    __tablename__ = "risk_results"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)
    risk_category = Column(String, nullable=False)
    severity = Column(String, default="LOW")
    signal_description = Column(Text, nullable=True)
    data_source = Column(String, nullable=True)

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)
    rank = Column(Integer, default=1)
    vessel_class = Column(String, nullable=False)
    port_id = Column(Integer, nullable=False)
    cost_score = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    coverage_fit_score = Column(Float, default=0.0)
    total_score = Column(Float, default=0.0)
    cost_score_breakdown = Column(Text, nullable=True)
    is_emergency_mode = Column(Boolean, default=False)

class DecisionRecord(Base):
    __tablename__ = "decision_records"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), unique=True, nullable=False)
    chosen_vessel_class = Column(String, nullable=False)
    chosen_port_id = Column(Integer, nullable=False)
    was_override = Column(Boolean, default=False)
    override_reason = Column(Text, nullable=True)
    decided_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    decided_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class RegretScore(Base):
    __tablename__ = "regret_scores"

    id = Column(Integer, primary_key=True, index=True)
    decision_record_id = Column(Integer, ForeignKey("decision_records.id"), unique=True, nullable=False)
    regret_pct = Column(Float, default=0.0)
    chosen_day_rate = Column(Float, default=0.0)
    best_rate_in_window = Column(Float, default=0.0)
    window_start = Column(DateTime, nullable=True)
    window_end = Column(DateTime, nullable=True)
    computed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DisruptionAlert(Base):
    __tablename__ = "disruption_alerts"

    id = Column(Integer, primary_key=True, index=True)
    keyword_matched = Column(String, nullable=False)
    headline_text = Column(Text, nullable=False)
    source_url = Column(String, nullable=True)
    matched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action_type = Column(String, nullable=False)
    affected_record_id = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    logged_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    detail = Column(Text, nullable=True)

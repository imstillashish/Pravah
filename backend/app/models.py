from datetime import datetime, timezone, date
from typing import Optional, List, Dict, Any
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="logistics_planner", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    analyses = relationship("Analysis", back_populates="user", cascade="all, delete-orphan")


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    origin_country = Column(String, nullable=False)
    origin_port = Column(String, nullable=False)
    destination_port = Column(String, nullable=False)
    commodity = Column(String, nullable=False)
    parcel_tonnage = Column(Float, nullable=False)
    recommended_vessel = Column(String, nullable=False)
    predicted_rate_pmt = Column(Float, nullable=False)
    benchmark_spot_pmt = Column(Float, nullable=False)
    estimated_savings_usd = Column(Float, nullable=False)
    status = Column(String, default="draft", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="analyses")


class ReferencePort(Base):
    __tablename__ = "reference_ports"

    id = Column(Integer, primary_key=True, index=True)
    port_name = Column(String, unique=True, nullable=False)
    max_loa_m = Column(Float, nullable=False)
    max_beam_m = Column(Float, nullable=False)
    max_draft_m = Column(Float, nullable=False)
    max_dwt_mt = Column(Float, nullable=False)
    has_lightering = Column(Boolean, default=False)
    lightering_note = Column(String, nullable=True)


class ReferenceVesselClass(Base):
    __tablename__ = "reference_vessel_classes"

    id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String, unique=True, nullable=False)
    dwt_min = Column(Float, nullable=False)
    dwt_max = Column(Float, nullable=False)
    typical_draft_m = Column(Float, nullable=False)
    typical_loa_m = Column(Float, nullable=False)
    typical_beam_m = Column(Float, nullable=False)
    avg_speed_knots = Column(Float, nullable=False)


class ForecastResult(Base):
    __tablename__ = "forecast_results"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, nullable=True, index=True)
    p10_usd_per_mt = Column(Float, nullable=True)
    p50_usd_per_mt = Column(Float, nullable=True)
    p90_usd_per_mt = Column(Float, nullable=True)
    arima_baseline_usd_per_mt = Column(Float, nullable=True)
    confidence_label = Column(String, nullable=True)
    model_used = Column(String, nullable=True, default="LightGBM_quantile_ensemble")
    forecast_generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def p10(self) -> Optional[float]:
        return self.p10_usd_per_mt

    @property
    def p50(self) -> Optional[float]:
        return self.p50_usd_per_mt

    @property
    def p90(self) -> Optional[float]:
        return self.p90_usd_per_mt

    @property
    def arima_baseline(self) -> Optional[float]:
        return self.arima_baseline_usd_per_mt

    def to_dict(self) -> Dict[str, Any]:
        return {
            "analysis_id": self.analysis_id,
            "p10_usd_per_mt": self.p10_usd_per_mt,
            "p50_usd_per_mt": self.p50_usd_per_mt,
            "p90_usd_per_mt": self.p90_usd_per_mt,
            "arima_baseline_usd_per_mt": self.arima_baseline_usd_per_mt,
            "confidence_label": self.confidence_label,
            "model_used": self.model_used,
            "forecast_generated_at": self.forecast_generated_at.isoformat() if self.forecast_generated_at else None,
        }


class FeasibilityResult(Base):
    __tablename__ = "feasibility_results"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, nullable=True, index=True)
    vessel_class = Column(String, nullable=False)
    port_id = Column(Integer, nullable=True)
    port_name = Column(String, nullable=True)
    draft_pass = Column(Boolean, default=False)
    loa_pass = Column(Boolean, default=False)
    beam_pass = Column(Boolean, default=False)
    dwt_pass = Column(Boolean, default=False)
    overall_feasible = Column(Boolean, default=False)
    requires_lightering = Column(Boolean, default=False)
    failure_reason = Column(Text, nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "vessel_class": self.vessel_class,
            "port_name": self.port_name,
            "draft_pass": self.draft_pass,
            "loa_pass": self.loa_pass,
            "beam_pass": self.beam_pass,
            "dwt_pass": self.dwt_pass,
            "overall_feasible": self.overall_feasible,
            "requires_lightering": self.requires_lightering,
            "failure_reason": self.failure_reason,
        }


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, nullable=True, index=True)
    rank = Column(Integer, default=1)
    vessel_class = Column(String, nullable=False)
    port_id = Column(Integer, nullable=True)
    port_name = Column(String, nullable=True)
    cost_score = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    coverage_fit_score = Column(Float, default=0.0)
    total_score = Column(Float, default=0.0)
    cost_score_breakdown = Column(Text, nullable=True)
    is_emergency_mode = Column(Boolean, default=False)

    def __init__(self, **kwargs):
        self.score_breakdown = kwargs.pop("score_breakdown", [])
        super().__init__(**kwargs)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rank": self.rank,
            "vessel_class": self.vessel_class,
            "port_name": self.port_name,
            "cost_score": round(float(self.cost_score), 4),
            "confidence_score": round(float(self.confidence_score), 4),
            "coverage_fit_score": round(float(self.coverage_fit_score), 4),
            "total_score": round(float(self.total_score), 4),
            "score_breakdown": getattr(self, "score_breakdown", []),
            "is_emergency_mode": self.is_emergency_mode,
        }


class RiskResult(Base):
    __tablename__ = "risk_results"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, nullable=True, index=True)
    risk_category = Column(String, nullable=False)
    severity = Column(String, default="NOT_ASSESSED")
    signal_description = Column(Text, nullable=True)
    data_source = Column(String, nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "risk_category": self.risk_category,
            "severity": self.severity,
            "signal_description": self.signal_description,
            "data_source": self.data_source,
        }


class LandedCost(Base):
    __tablename__ = "landed_costs"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, nullable=True, index=True)
    freight_rate_usd_per_mt = Column(Float, default=0.0)
    baf_surcharge_usd_per_mt = Column(Float, default=0.0)
    usd_inr_rate = Column(Float, default=83.5)
    total_usd_per_mt = Column(Float, default=0.0)
    total_inr_per_mt = Column(Float, default=0.0)
    total_inr = Column(Float, default=0.0)
    computed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "freight_rate_usd_per_mt": round(float(self.freight_rate_usd_per_mt), 2),
            "baf_surcharge_usd_per_mt": round(float(self.baf_surcharge_usd_per_mt), 2),
            "usd_inr_rate": round(float(self.usd_inr_rate), 2),
            "total_usd_per_mt": round(float(self.total_usd_per_mt), 2),
            "total_inr_per_mt": round(float(self.total_inr_per_mt), 2),
            "total_inr": round(float(self.total_inr), 2),
            "computed_at": self.computed_at.isoformat() if self.computed_at else None,
        }


class StockOutAlert(Base):
    __tablename__ = "stockout_alerts"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, nullable=True, index=True)
    days_to_stockout = Column(Float, default=0.0)
    days_to_best_window = Column(Float, default=0.0)
    is_at_risk = Column(Boolean, default=False)
    alert_message = Column(Text, default="")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "days_to_stockout": round(float(self.days_to_stockout), 1),
            "days_to_best_window": round(float(self.days_to_best_window), 1),
            "is_at_risk": self.is_at_risk,
            "alert_message": self.alert_message,
        }


class DecisionRecord(Base):
    __tablename__ = "decision_records"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, nullable=True, index=True)
    chosen_vessel_class = Column(String, nullable=True)
    chosen_port_id = Column(Integer, nullable=True)
    chosen_day_rate = Column(Float, nullable=True)
    was_override = Column(Boolean, default=False)
    override_reason = Column(Text, nullable=True)
    decided_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class RegretScore(Base):
    __tablename__ = "regret_scores"

    id = Column(Integer, primary_key=True, index=True)
    decision_record_id = Column(Integer, nullable=True, index=True)
    regret_pct = Column(Float, default=0.0)
    chosen_day_rate = Column(Float, default=0.0)
    best_rate_in_window = Column(Float, default=0.0)
    window_start = Column(Date, nullable=True)
    window_end = Column(Date, nullable=True)
    computed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "regret_pct": round(float(self.regret_pct), 2),
            "chosen_day_rate": round(float(self.chosen_day_rate), 2),
            "best_rate_in_window": round(float(self.best_rate_in_window), 2),
            "window_start": self.window_start.isoformat() if self.window_start else None,
            "window_end": self.window_end.isoformat() if self.window_end else None,
            "computed_at": self.computed_at.isoformat() if self.computed_at else None,
        }


class DisruptionAlert(Base):
    __tablename__ = "disruption_alerts"

    id = Column(Integer, primary_key=True, index=True)
    keyword_matched = Column(String, nullable=False)
    headline_text = Column(Text, nullable=False)
    source_url = Column(String, nullable=True)
    matched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)

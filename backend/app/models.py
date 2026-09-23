from datetime import datetime, timezone, date
from typing import Optional, List, Dict, Any, cast
import uuid
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


def _to_float(val: Any, default: float = 0.0) -> float:
    """Safely converts an ORM attribute/column value to float without buffer protocol mismatch."""
    try:
        return float(val) if val is not None else default
    except (TypeError, ValueError):
        return default


def _to_float_or_none(val: Any) -> Optional[float]:
    """Safely converts an ORM attribute/column value to Optional[float]."""
    try:
        return float(val) if val is not None else None
    except (TypeError, ValueError):
        return None


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False, default="")
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="logistics_planner", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    analyses = relationship("Analysis", back_populates="user", cascade="all, delete-orphan")

    @property
    def password_hash(self) -> str:
        return cast(str, self.hashed_password)

    @password_hash.setter
    def password_hash(self, value: str) -> None:
        setattr(self, "hashed_password", value)


class ReferencePort(Base):
    __tablename__ = "reference_ports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    port_name = Column(String, unique=True, index=True, nullable=False)
    locode = Column(String, nullable=True)
    max_loa_m = Column(Float, nullable=True)
    max_beam_m = Column(Float, nullable=True)
    max_draft_m = Column(Float, nullable=True)
    max_dwt_mt = Column(Float, nullable=True)
    has_lightering = Column(Boolean, default=False)
    lightering_note = Column(Text, nullable=True)
    source = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)


class ReferenceVesselClass(Base):
    __tablename__ = "reference_vessel_classes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    class_name = Column(String, unique=True, index=True, nullable=False)
    dwt_min = Column(Float, nullable=True)
    dwt_max = Column(Float, nullable=True)
    typical_draft_m = Column(Float, nullable=True)
    typical_loa_m = Column(Float, nullable=True)
    typical_beam_m = Column(Float, nullable=True)
    avg_speed_knots = Column(Float, nullable=True)


class ReferenceCargoType(Base):
    __tablename__ = "reference_cargo_types"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    cargo_name = Column(String, unique=True, index=True, nullable=False)
    density_mt_per_cbm = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)


class ReferencePlant(Base):
    __tablename__ = "reference_plants"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    plant_name = Column(String, unique=True, index=True, nullable=False)
    daily_consumption_mt = Column(Float, nullable=True)
    current_stock_mt = Column(Float, nullable=True)
    stockout_threshold_days = Column(Integer, default=14)
    preferred_port_id = Column(Integer, ForeignKey("reference_ports.id"), nullable=True)

    port = relationship("ReferencePort")


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    origin_country = Column(String, nullable=False)
    origin_port = Column(String, nullable=False)
    destination_port = Column(String, nullable=False)
    destination_port_id = Column(Integer, ForeignKey("reference_ports.id"), nullable=True)
    commodity = Column(String, nullable=False)
    parcel_tonnage = Column(Float, nullable=False)
    recommended_vessel = Column(String, nullable=False)
    predicted_rate_pmt = Column(Float, nullable=False)
    benchmark_spot_pmt = Column(Float, nullable=False)
    estimated_savings_usd = Column(Float, nullable=False)
    status = Column(String, default="draft", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="analyses")
    context_object = relationship("ContextObject", uselist=False, back_populates="analysis", cascade="all, delete-orphan")
    forecast_result = relationship("ForecastResult", uselist=False, back_populates="analysis", cascade="all, delete-orphan")
    landed_cost = relationship("LandedCost", uselist=False, back_populates="analysis", cascade="all, delete-orphan")
    decision_record = relationship("DecisionRecord", uselist=False, back_populates="analysis", cascade="all, delete-orphan")

    feasibility_results = relationship("FeasibilityResult", back_populates="analysis", cascade="all, delete-orphan")
    risk_results = relationship("RiskResult", back_populates="analysis", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="analysis", cascade="all, delete-orphan")
    stockout_alerts = relationship("StockOutAlert", back_populates="analysis", cascade="all, delete-orphan")


class ContextObject(Base):
    __tablename__ = "context_objects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(Integer, ForeignKey("analyses.id"), unique=True, nullable=False, index=True)
    route_distance_nm = Column(Float, nullable=True)
    inferred_vessel_class = Column(String, nullable=True)
    origin_lat = Column(Float, nullable=True)
    origin_lon = Column(Float, nullable=True)
    destination_lat = Column(Float, nullable=True)
    destination_lon = Column(Float, nullable=True)
    context_resolved_at = Column(DateTime, nullable=True)

    analysis = relationship("Analysis", back_populates="context_object")


class EnrichmentCache(Base):
    __tablename__ = "enrichment_caches"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=True, index=True)
    data_key = Column(String, nullable=False, index=True)
    data_value = Column(Text, nullable=True)
    data_classification = Column(String, nullable=True)
    source_url = Column(String, nullable=True)
    fetched_at = Column(DateTime, nullable=True, default=lambda: datetime.now(timezone.utc))
    is_stale = Column(Boolean, default=False)


class ForecastResult(Base):
    __tablename__ = "forecast_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), unique=True, nullable=True, index=True)
    p10_usd_per_mt = Column(Float, nullable=True)
    p50_usd_per_mt = Column(Float, nullable=True)
    p90_usd_per_mt = Column(Float, nullable=True)
    arima_baseline_usd_per_mt = Column(Float, nullable=True)
    confidence_label = Column(String, nullable=True)
    model_used = Column(String, nullable=True, default="LightGBM_quantile_ensemble")
    forecast_generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    analysis = relationship("Analysis", back_populates="forecast_result")

    @property
    def p10(self) -> Optional[float]:
        return _to_float_or_none(getattr(self, "p10_usd_per_mt", None))

    @property
    def p50(self) -> Optional[float]:
        return _to_float_or_none(getattr(self, "p50_usd_per_mt", None))

    @property
    def p90(self) -> Optional[float]:
        return _to_float_or_none(getattr(self, "p90_usd_per_mt", None))

    @property
    def arima_baseline(self) -> Optional[float]:
        return _to_float_or_none(getattr(self, "arima_baseline_usd_per_mt", None))

    def to_dict(self) -> Dict[str, Any]:
        fg_at = getattr(self, "forecast_generated_at", None)
        return {
            "analysis_id": getattr(self, "analysis_id", None),
            "p10_usd_per_mt": _to_float_or_none(getattr(self, "p10_usd_per_mt", None)),
            "p50_usd_per_mt": _to_float_or_none(getattr(self, "p50_usd_per_mt", None)),
            "p90_usd_per_mt": _to_float_or_none(getattr(self, "p90_usd_per_mt", None)),
            "arima_baseline_usd_per_mt": _to_float_or_none(getattr(self, "arima_baseline_usd_per_mt", None)),
            "confidence_label": getattr(self, "confidence_label", None),
            "model_used": getattr(self, "model_used", None),
            "forecast_generated_at": fg_at.isoformat() if hasattr(fg_at, "isoformat") else None,
        }


class FeasibilityResult(Base):
    __tablename__ = "feasibility_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=True, index=True)
    vessel_class = Column(String, nullable=True)
    port_id = Column(Integer, ForeignKey("reference_ports.id"), nullable=True)
    port_name = Column(String, nullable=True)
    draft_pass = Column(Boolean, default=False)
    loa_pass = Column(Boolean, default=False)
    beam_pass = Column(Boolean, default=False)
    dwt_pass = Column(Boolean, default=False)
    overall_feasible = Column(Boolean, default=False)
    requires_lightering = Column(Boolean, default=False)
    failure_reason = Column(Text, nullable=True)

    analysis = relationship("Analysis", back_populates="feasibility_results")
    port = relationship("ReferencePort")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "vessel_class": getattr(self, "vessel_class", ""),
            "port_name": getattr(self, "port_name", None),
            "draft_pass": getattr(self, "draft_pass", False),
            "loa_pass": getattr(self, "loa_pass", False),
            "beam_pass": getattr(self, "beam_pass", False),
            "dwt_pass": getattr(self, "dwt_pass", False),
            "overall_feasible": getattr(self, "overall_feasible", False),
            "requires_lightering": getattr(self, "requires_lightering", False),
            "failure_reason": getattr(self, "failure_reason", None),
        }


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=True, index=True)
    rank = Column(Integer, default=1)
    vessel_class = Column(String, nullable=True)
    port_id = Column(Integer, ForeignKey("reference_ports.id"), nullable=True)
    port_name = Column(String, nullable=True)
    cost_score = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    coverage_fit_score = Column(Float, default=0.0)
    total_score = Column(Float, default=0.0)
    cost_score_breakdown = Column(Text, nullable=True)
    is_emergency_mode = Column(Boolean, default=False)

    analysis = relationship("Analysis", back_populates="recommendations")
    port = relationship("ReferencePort")

    def __init__(self, **kwargs: Any) -> None:
        self.score_breakdown = kwargs.pop("score_breakdown", [])
        super().__init__(**kwargs)

    def to_dict(self) -> Dict[str, Any]:
        c_score = getattr(self, "cost_score", 0.0)
        cf_score = getattr(self, "confidence_score", 0.0)
        cov_score = getattr(self, "coverage_fit_score", 0.0)
        t_score = getattr(self, "total_score", 0.0)
        return {
            "rank": getattr(self, "rank", 1),
            "vessel_class": getattr(self, "vessel_class", ""),
            "port_name": getattr(self, "port_name", None),
            "cost_score": round(_to_float(c_score), 4),
            "confidence_score": round(_to_float(cf_score), 4),
            "coverage_fit_score": round(_to_float(cov_score), 4),
            "total_score": round(_to_float(t_score), 4),
            "score_breakdown": getattr(self, "score_breakdown", []),
            "is_emergency_mode": getattr(self, "is_emergency_mode", False),
        }


class RiskResult(Base):
    __tablename__ = "risk_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=True, index=True)
    risk_category = Column(String, nullable=True)
    severity = Column(String, default="NOT_ASSESSED")
    signal_description = Column(Text, nullable=True)
    data_source = Column(String, nullable=True)

    analysis = relationship("Analysis", back_populates="risk_results")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "risk_category": getattr(self, "risk_category", ""),
            "severity": getattr(self, "severity", "NOT_ASSESSED"),
            "signal_description": getattr(self, "signal_description", None),
            "data_source": getattr(self, "data_source", None),
        }


class LandedCost(Base):
    __tablename__ = "landed_costs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), unique=True, nullable=True, index=True)
    freight_rate_usd_per_mt = Column(Float, default=0.0)
    baf_surcharge_usd_per_mt = Column(Float, default=0.0)
    usd_inr_rate = Column(Float, default=83.5)
    total_usd_per_mt = Column(Float, default=0.0)
    total_inr_per_mt = Column(Float, default=0.0)
    total_inr = Column(Float, default=0.0)
    computed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    analysis = relationship("Analysis", back_populates="landed_cost")

    def to_dict(self) -> Dict[str, Any]:
        fr = getattr(self, "freight_rate_usd_per_mt", 0.0)
        baf = getattr(self, "baf_surcharge_usd_per_mt", 0.0)
        fx = getattr(self, "usd_inr_rate", 83.5)
        tot_usd = getattr(self, "total_usd_per_mt", 0.0)
        tot_inr_pmt = getattr(self, "total_inr_per_mt", 0.0)
        tot_inr = getattr(self, "total_inr", 0.0)
        c_at = getattr(self, "computed_at", None)
        return {
            "freight_rate_usd_per_mt": round(_to_float(fr), 2),
            "baf_surcharge_usd_per_mt": round(_to_float(baf), 2),
            "usd_inr_rate": round(_to_float(fx, 83.5), 2),
            "total_usd_per_mt": round(_to_float(tot_usd), 2),
            "total_inr_per_mt": round(_to_float(tot_inr_pmt), 2),
            "total_inr": round(_to_float(tot_inr), 2),
            "computed_at": c_at.isoformat() if hasattr(c_at, "isoformat") else None,
        }


class StockOutAlert(Base):
    __tablename__ = "stockout_alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=True, index=True)
    days_to_stockout = Column(Float, default=0.0)
    days_to_best_window = Column(Float, default=0.0)
    is_at_risk = Column(Boolean, default=False)
    alert_message = Column(Text, default="")

    analysis = relationship("Analysis", back_populates="stockout_alerts")

    def to_dict(self) -> Dict[str, Any]:
        d_stock = getattr(self, "days_to_stockout", 0.0)
        d_best = getattr(self, "days_to_best_window", 0.0)
        return {
            "days_to_stockout": round(_to_float(d_stock), 1),
            "days_to_best_window": round(_to_float(d_best), 1),
            "is_at_risk": bool(getattr(self, "is_at_risk", False)),
            "alert_message": str(getattr(self, "alert_message", "")),
        }


class DecisionRecord(Base):
    __tablename__ = "decision_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), unique=True, nullable=True, index=True)
    chosen_vessel_class = Column(String, nullable=True)
    chosen_port_id = Column(Integer, ForeignKey("reference_ports.id"), nullable=True)
    chosen_day_rate = Column(Float, nullable=True)
    was_override = Column(Boolean, default=False)
    override_reason = Column(Text, nullable=True)
    decided_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    decided_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    analysis = relationship("Analysis", back_populates="decision_record")
    port = relationship("ReferencePort")
    user = relationship("User")
    regret_score = relationship("RegretScore", uselist=False, back_populates="decision_record", cascade="all, delete-orphan")


class RegretScore(Base):
    __tablename__ = "regret_scores"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    decision_record_id = Column(Integer, ForeignKey("decision_records.id"), unique=True, nullable=True, index=True)
    regret_pct = Column(Float, default=0.0)
    chosen_day_rate = Column(Float, default=0.0)
    best_rate_in_window = Column(Float, default=0.0)
    window_start = Column(Date, nullable=True)
    window_end = Column(Date, nullable=True)
    computed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    decision_record = relationship("DecisionRecord", back_populates="regret_score")

    def to_dict(self) -> Dict[str, Any]:
        r_pct = getattr(self, "regret_pct", 0.0)
        c_rate = getattr(self, "chosen_day_rate", 0.0)
        b_rate = getattr(self, "best_rate_in_window", 0.0)
        w_start = getattr(self, "window_start", None)
        w_end = getattr(self, "window_end", None)
        c_at = getattr(self, "computed_at", None)
        return {
            "regret_pct": round(_to_float(r_pct), 2),
            "chosen_day_rate": round(_to_float(c_rate), 2),
            "best_rate_in_window": round(_to_float(b_rate), 2),
            "window_start": w_start.isoformat() if hasattr(w_start, "isoformat") else None,
            "window_end": w_end.isoformat() if hasattr(w_end, "isoformat") else None,
            "computed_at": c_at.isoformat() if hasattr(c_at, "isoformat") else None,
        }


class DisruptionAlert(Base):
    __tablename__ = "disruption_alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    keyword_matched = Column(String, nullable=True)
    headline_text = Column(Text, nullable=True)
    source_url = Column(String, nullable=True)
    matched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    action_type = Column(String, nullable=False)
    affected_record_id = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    logged_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    user = relationship("User")


class VendorQuote(Base):
    __tablename__ = "vendor_quotes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    quote_request_label = Column(String, nullable=True)
    broker_name = Column(String, nullable=False)
    vessel_type = Column(String, nullable=False)
    quoted_rate_usd_per_mt = Column(Float, nullable=False)
    delivery_days = Column(Integer, nullable=False)
    valid_until = Column(Date, nullable=False)
    is_sample_data = Column(Boolean, default=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "quote_request_label": self.quote_request_label,
            "broker_name": self.broker_name,
            "vessel_type": self.vessel_type,
            "quoted_rate_usd_per_mt": self.quoted_rate_usd_per_mt,
            "delivery_days": self.delivery_days,
            "valid_until": self.valid_until.isoformat() if hasattr(self.valid_until, "isoformat") else str(self.valid_until),
            "is_sample_data": True,
            "sample_data_notice": "These quotes are sample data. Real broker integration is not connected.",
        }


class CargoRequest(Base):
    __tablename__ = "cargo_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    plant_id = Column(Integer, ForeignKey("reference_plants.id"), nullable=True)
    cargo_type_id = Column(Integer, ForeignKey("reference_cargo_types.id"), nullable=True)
    quantity_mt = Column(Float, nullable=False)
    destination_port_id = Column(Integer, ForeignKey("reference_ports.id"), nullable=True)
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="OPEN")  # OPEN, MERGED, CANCELLED
    merged_into_id = Column(Integer, ForeignKey("cargo_requests.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    plant = relationship("ReferencePlant")
    port = relationship("ReferencePort")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "plant_id": self.plant_id,
            "plant_name": self.plant.plant_name if self.plant else None,
            "cargo_type_id": self.cargo_type_id,
            "quantity_mt": self.quantity_mt,
            "destination_port_id": self.destination_port_id,
            "port_name": self.port.port_name if self.port else None,
            "status": self.status,
            "merged_into_id": self.merged_into_id,
            "created_at": self.created_at.isoformat() if hasattr(self.created_at, "isoformat") else str(self.created_at),
        }


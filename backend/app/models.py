from datetime import datetime, timezone
from typing import cast
import uuid
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from app.database import Base

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
    max_dwt_mt = Column(Integer, nullable=True)
    has_lightering = Column(Boolean, default=False)
    lightering_note = Column(Text, nullable=True)
    source = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)


class ReferenceVesselClass(Base):
    __tablename__ = "reference_vessel_classes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    class_name = Column(String, unique=True, index=True, nullable=False)
    dwt_min = Column(Integer, nullable=True)
    dwt_max = Column(Integer, nullable=True)
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
    location_city = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    plant_id = Column(Integer, ForeignKey("reference_plants.id"), nullable=True)
    cargo_type_id = Column(Integer, ForeignKey("reference_cargo_types.id"), nullable=True)
    quantity_mt = Column(Float, nullable=True)
    origin_port = Column(String, nullable=False)
    destination_port_id = Column(Integer, ForeignKey("reference_ports.id"), nullable=True)
    delivery_start = Column(Date, nullable=True)
    delivery_end = Column(Date, nullable=True)
    status = Column(String, default="draft", nullable=False)
    current_stock_mt = Column(Float, nullable=True)
    daily_consumption_mt = Column(Float, nullable=True)

    # Legacy / convenience fields for immediate API compatibility
    title = Column(String, nullable=True)
    origin_country = Column(String, nullable=True)
    destination_port = Column(String, nullable=True)
    commodity = Column(String, nullable=True)
    parcel_tonnage = Column(Float, nullable=True)
    recommended_vessel = Column(String, nullable=True)
    predicted_rate_pmt = Column(Float, nullable=True)
    benchmark_spot_pmt = Column(Float, nullable=True)
    estimated_savings_usd = Column(Float, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="analyses")
    plant = relationship("ReferencePlant")
    cargo_type = relationship("ReferenceCargoType")
    destination_port_rel = relationship("ReferencePort", foreign_keys=[destination_port_id])

    context_object = relationship("ContextObject", uselist=False, back_populates="analysis", cascade="all, delete-orphan")
    forecast_result = relationship("ForecastResult", uselist=False, back_populates="analysis", cascade="all, delete-orphan")
    landed_cost = relationship("LandedCost", uselist=False, back_populates="analysis", cascade="all, delete-orphan")
    decision_record = relationship("DecisionRecord", uselist=False, back_populates="analysis", cascade="all, delete-orphan")

    feasibility_results = relationship("FeasibilityResult", back_populates="analysis", cascade="all, delete-orphan")
    risk_results = relationship("RiskResult", back_populates="analysis", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="analysis", cascade="all, delete-orphan")


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

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(Integer, ForeignKey("analyses.id"), unique=True, nullable=False, index=True)
    p10_usd_per_mt = Column(Float, nullable=True)
    p50_usd_per_mt = Column(Float, nullable=True)
    p90_usd_per_mt = Column(Float, nullable=True)
    arima_baseline_usd_per_mt = Column(Float, nullable=True)
    confidence_label = Column(String, nullable=True)
    model_used = Column(String, nullable=True)
    forecast_generated_at = Column(DateTime, nullable=True, default=lambda: datetime.now(timezone.utc))

    analysis = relationship("Analysis", back_populates="forecast_result")


class FeasibilityResult(Base):
    __tablename__ = "feasibility_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False, index=True)
    vessel_class = Column(String, nullable=True)
    port_id = Column(Integer, ForeignKey("reference_ports.id"), nullable=True)
    draft_pass = Column(Boolean, nullable=True)
    loa_pass = Column(Boolean, nullable=True)
    beam_pass = Column(Boolean, nullable=True)
    dwt_pass = Column(Boolean, nullable=True)
    overall_feasible = Column(Boolean, nullable=True)
    requires_lightering = Column(Boolean, nullable=True)
    failure_reason = Column(Text, nullable=True)

    analysis = relationship("Analysis", back_populates="feasibility_results")
    port = relationship("ReferencePort")


class LandedCost(Base):
    __tablename__ = "landed_costs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(Integer, ForeignKey("analyses.id"), unique=True, nullable=False, index=True)
    freight_rate_usd_per_mt = Column(Float, nullable=True)
    baf_surcharge_usd_per_mt = Column(Float, nullable=True)
    usd_inr_rate = Column(Float, nullable=True)
    total_usd_per_mt = Column(Float, nullable=True)
    total_inr_per_mt = Column(Float, nullable=True)
    total_inr = Column(Float, nullable=True)
    computed_at = Column(DateTime, nullable=True, default=lambda: datetime.now(timezone.utc))

    analysis = relationship("Analysis", back_populates="landed_cost")


class RiskResult(Base):
    __tablename__ = "risk_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False, index=True)
    risk_category = Column(String, nullable=True)
    severity = Column(String, nullable=True)
    signal_description = Column(Text, nullable=True)
    data_source = Column(String, nullable=True)

    analysis = relationship("Analysis", back_populates="risk_results")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False, index=True)
    rank = Column(Integer, nullable=True)
    vessel_class = Column(String, nullable=True)
    port_id = Column(Integer, ForeignKey("reference_ports.id"), nullable=True)
    cost_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    coverage_fit_score = Column(Float, nullable=True)
    total_score = Column(Float, nullable=True)
    cost_score_breakdown = Column(Text, nullable=True)
    is_emergency_mode = Column(Boolean, default=False)

    analysis = relationship("Analysis", back_populates="recommendations")
    port = relationship("ReferencePort")


class DecisionRecord(Base):
    __tablename__ = "decision_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(Integer, ForeignKey("analyses.id"), unique=True, nullable=False, index=True)
    chosen_vessel_class = Column(String, nullable=True)
    chosen_port_id = Column(Integer, ForeignKey("reference_ports.id"), nullable=True)
    was_override = Column(Boolean, default=False)
    override_reason = Column(Text, nullable=True)
    decided_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    decided_at = Column(DateTime, nullable=True, default=lambda: datetime.now(timezone.utc))

    analysis = relationship("Analysis", back_populates="decision_record")
    port = relationship("ReferencePort")
    user = relationship("User")
    regret_score = relationship("RegretScore", uselist=False, back_populates="decision_record", cascade="all, delete-orphan")


class RegretScore(Base):
    __tablename__ = "regret_scores"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    decision_record_id = Column(String, ForeignKey("decision_records.id"), unique=True, nullable=False, index=True)
    regret_pct = Column(Float, nullable=True)
    chosen_day_rate = Column(Float, nullable=True)
    best_rate_in_window = Column(Float, nullable=True)
    window_start = Column(Date, nullable=True)
    window_end = Column(Date, nullable=True)
    computed_at = Column(DateTime, nullable=True, default=lambda: datetime.now(timezone.utc))

    decision_record = relationship("DecisionRecord", back_populates="regret_score")


class DisruptionAlert(Base):
    __tablename__ = "disruption_alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    keyword_matched = Column(String, nullable=True)
    headline_text = Column(Text, nullable=True)
    source_url = Column(String, nullable=True)
    matched_at = Column(DateTime, nullable=True, default=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    action_type = Column(String, nullable=False)
    affected_record_id = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    logged_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    detail = Column(Text, nullable=True)

    user = relationship("User")

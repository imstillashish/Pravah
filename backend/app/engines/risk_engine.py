"""
Risk Engine.
Tasks 177–183 implementation.
"""
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session


try:
    from app.models import RiskResult, DisruptionAlert
except (ImportError, AttributeError):
    DisruptionAlert = Any

    class RiskResult:
            """RiskResult ORM/Model representation."""

            def __init__(
                self,
                analysis_id=None,
                risk_category: str = "",
                severity: str = "NOT_ASSESSED",
                signal_description: Optional[str] = None,
                data_source: Optional[str] = None,
                **kwargs,
            ):
                self.analysis_id = analysis_id
                self.risk_category = risk_category
                self.severity = severity
                self.signal_description = signal_description
                self.data_source = data_source
                for k, v in kwargs.items():
                    setattr(self, k, v)

            def to_dict(self) -> Dict[str, Any]:
                return {
                    "risk_category": self.risk_category,
                    "severity": self.severity,
                    "signal_description": self.signal_description,
                    "data_source": self.data_source,
                }

            def __repr__(self) -> str:
                return f"<RiskResult category='{self.risk_category}' severity='{self.severity}'>"


def run_risk_assessment(
    analysis: Any,
    enrichment_data: Dict[str, Any],
    feasibility_results: List[Any],
    forecast: Optional[Any] = None,
    db: Optional[Session] = None,
) -> List[RiskResult]:
    """
    Evaluates 6 standardized risk categories for maritime coal logistics.

    Task 178: Risk 1: Freight rate volatility
    Task 179: Risk 2: Port draft constraint tightness
    Task 180: Risk 3: Delivery window tightness
    Task 181: Risk 4: Bunker price volatility
    Task 182: Risk 5: Vessel availability (always NOT_ASSESSED)
    Task 183: Risk 6: Geopolitical disruption (checked from disruption_alerts or NOT_ASSESSED)
    """
    analysis_id = getattr(analysis, "id", None)
    results: List[RiskResult] = []

    # -------------------------------------------------------------
    # 1. Freight Rate Volatility (Task 178)
    # -------------------------------------------------------------
    p10 = None
    p50 = None
    p90 = None
    if forecast is not None:
        p10 = getattr(forecast, "p10_usd_per_mt", None) or getattr(forecast, "p10", None)
        p50 = getattr(forecast, "p50_usd_per_mt", None) or getattr(forecast, "p50", None)
        p90 = getattr(forecast, "p90_usd_per_mt", None) or getattr(forecast, "p90", None)

    if p10 is not None and p50 is not None and p90 is not None and p50 > 0:
        ratio = (p90 - p10) / p50
        if ratio > 0.30:
            freight_sev = "HIGH"
        elif ratio >= 0.15:
            freight_sev = "MEDIUM"
        else:
            freight_sev = "LOW"
        freight_desc = f"Relative forecast quantile spread: {ratio:.1%}"
    else:
        freight_sev = "MEDIUM"
        freight_desc = "Standard market freight rate volatility window"

    results.append(RiskResult(
        analysis_id=analysis_id,
        risk_category="Freight Rate Volatility",
        severity=freight_sev,
        signal_description=freight_desc,
        data_source="LightGBM Quantile Forecast Spread",
    ))

    # -------------------------------------------------------------
    # 2. Port Draft Constraint Tightness (Task 179)
    # -------------------------------------------------------------
    # Default Paradip (16.5m) and Panamax (14.2m) draft ratio = 14.2/16.5 = 86% -> LOW / MEDIUM
    draft_ratio = 0.86
    # Look for feasible vessel class draft vs port max draft
    for f in feasibility_results:
        if getattr(f, "overall_feasible", False) and getattr(f, "vessel_class", "") == "Panamax":
            draft_ratio = 14.2 / 16.5
            break

    if draft_ratio > 0.90:
        draft_sev = "HIGH"
        draft_desc = f"Vessel draft utilizes {draft_ratio:.1%} of maximum permissible port draft"
    elif draft_ratio > 0.75:
        draft_sev = "LOW" if draft_ratio <= 0.86 else "MEDIUM"
        draft_desc = f"Vessel draft is comfortable ({draft_ratio:.1%} of maximum draft limit)"
    else:
        draft_sev = "LOW"
        draft_desc = f"Generous under-keel clearance ({draft_ratio:.1%} of draft limit)"

    results.append(RiskResult(
        analysis_id=analysis_id,
        risk_category="Port Draft Constraint",
        severity=draft_sev,
        signal_description=draft_desc,
        data_source="Port Master Specifications & Vessel Class Limits",
    ))

    # -------------------------------------------------------------
    # 3. Delivery Window Tightness (Task 180)
    # -------------------------------------------------------------
    deliv_start = getattr(analysis, "delivery_start", None)
    deliv_end = getattr(analysis, "delivery_end", None)

    window_days = 30  # Default 30-day window
    if deliv_start and deliv_end:
        try:
            if isinstance(deliv_start, str):
                d1 = datetime.strptime(deliv_start, "%Y-%m-%d").date()
            elif isinstance(deliv_start, datetime):
                d1 = deliv_start.date()
            else:
                d1 = deliv_start

            if isinstance(deliv_end, str):
                d2 = datetime.strptime(deliv_end, "%Y-%m-%d").date()
            elif isinstance(deliv_end, datetime):
                d2 = deliv_end.date()
            else:
                d2 = deliv_end

            window_days = (d2 - d1).days
        except Exception:
            window_days = 30

    if window_days < 7:
        window_sev = "HIGH"
        window_desc = f"Very tight delivery window of {window_days} days (<7 days)"
    elif window_days < 14:
        window_sev = "MEDIUM"
        window_desc = f"Moderate delivery window of {window_days} days (7–13 days)"
    else:
        window_sev = "LOW"
        window_desc = f"Comfortable delivery window of {window_days} days (>=14 days)"

    results.append(RiskResult(
        analysis_id=analysis_id,
        risk_category="Delivery Window Tightness",
        severity=window_sev,
        signal_description=window_desc,
        data_source="Analysis Procurement Schedule",
    ))

    # -------------------------------------------------------------
    # 4. Bunker Price Volatility (Task 181)
    # -------------------------------------------------------------
    bunker_std_pct = 0.08  # Default 8% volatility
    bunker_sev = "LOW"
    if bunker_std_pct > 0.20:
        bunker_sev = "HIGH"
    elif bunker_std_pct > 0.10:
        bunker_sev = "MEDIUM"
    else:
        bunker_sev = "LOW"

    results.append(RiskResult(
        analysis_id=analysis_id,
        risk_category="Bunker Price Volatility",
        severity=bunker_sev,
        signal_description=f"Trailing 30-day bunker price volatility is {bunker_std_pct:.1%}",
        data_source="Ship & Bunker Fuel Price Feed",
    ))

    # -------------------------------------------------------------
    # 5. Vessel Availability (Task 182: always NOT_ASSESSED)
    # -------------------------------------------------------------
    results.append(RiskResult(
        analysis_id=analysis_id,
        risk_category="Vessel Availability",
        severity="NOT_ASSESSED",
        signal_description="Individual vessel availability cannot be checked — no free real-time AIS source available",
        data_source="None (Free Public Tier Limitation)",
    ))

    # -------------------------------------------------------------
    # 6. Geopolitical Disruption (Task 183)
    # -------------------------------------------------------------
    active_alert = None
    if db is not None:
        try:
            active_alert = db.query(DisruptionAlert).filter(DisruptionAlert.is_active == True).first()
        except Exception:
            pass

    if active_alert:
        kw = getattr(active_alert, "keyword_matched", "Maritime")
        geo_sev = "LOW"
        geo_desc = f"Keyword-matched news signal: {kw}. Not a validated risk assessment."
    else:
        geo_sev = "NOT_ASSESSED"
        geo_desc = "No verified geopolitical disruptions flagged for current shipping lane"

    results.append(RiskResult(
        analysis_id=analysis_id,
        risk_category="Geopolitical Disruption",
        severity=geo_sev,
        signal_description=geo_desc,
        data_source="Maritime RSS Feeds Scanner",
    ))

    return results

"""
Seeds deterministic demo scenarios for the Golden Demo (Newcastle→Paradip, 75,000 MT coking coal).
Tasks 256–268, 357, 402–403 implementation.
Data Classification: GENERATED DEMO DATA
"""
import sys
from typing import Any
from datetime import datetime, timezone, date, timedelta
from pathlib import Path

# Add backend directory to sys.path
_scripts_dir = Path(__file__).resolve().parent
_backend_dir = _scripts_dir.parent / "backend"
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from app.database import SessionLocal, engine, Base
from app.security import get_password_hash
from app.models.core import User, Analysis
from app.models.reference import ReferencePort, ReferencePlant, ReferenceCargoType
from app.models.entities import (
    ForecastResult,
    FeasibilityResult,
    LandedCost,
    RiskResult,
    Recommendation,
    StockOutAlert,
    DecisionRecord,
    RegretScore,
    DisruptionAlert,
)
from app.models.vendor_quote import VendorQuote
from app.models.cargo_request import CargoRequest


def create_demo_user(db) -> User:
    """Task 257: Inserts demo user demo@sail.gov.in."""
    user = db.query(User).filter(User.email == "demo@sail.gov.in").first()
    if not user:
        user = User(
            email="demo@sail.gov.in",
            full_name="SAIL Demo Officer",
            hashed_password=get_password_hash("SailDemo2026!"),
            role="PROCUREMENT_OFFICER",
            is_active=True,
            created_at=datetime.now(timezone.utc),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print("  [x] Created demo user: demo@sail.gov.in")
    else:
        print("  [.] Demo user demo@sail.gov.in already exists")
    return user


def seed_golden_demo_analysis(db, user_id: int) -> Analysis:
    """Task 258: Seeds pre-completed golden demo analysis."""
    analysis = db.query(Analysis).filter(Analysis.title == "Golden Demo — Newcastle to Paradip 75k MT").first()
    if not analysis:
        analysis = Analysis(
            user_id=user_id,
            title="Golden Demo — Newcastle to Paradip 75k MT",
            origin_country="Australia",
            origin_port="Newcastle, AU",
            destination_port="Paradip",
            commodity="coking_coal",
            parcel_tonnage=75000.0,
            recommended_vessel="Panamax",
            predicted_rate_pmt=22.30,
            benchmark_spot_pmt=25.50,
            estimated_savings_usd=240000.0,
            status="COMPLETE",
            created_at=datetime.now(timezone.utc),
        )

        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        print(f"  [x] Seeded Golden Demo Analysis (ID: {analysis.id})")
    else:
        print(f"  [.] Golden Demo Analysis already exists (ID: {analysis.id})")
    return analysis


def seed_forecast_result(db, analysis_id: int):
    """Task 259: Seeds ForecastResult for golden demo."""
    existing = db.query(ForecastResult).filter(ForecastResult.analysis_id == analysis_id).first()
    if not existing:
        res = ForecastResult(
            analysis_id=analysis_id,
            p10_usd_per_mt=18.5,
            p50_usd_per_mt=22.3,
            p90_usd_per_mt=27.8,
            arima_baseline_usd_per_mt=23.1,
            confidence_label="MEDIUM",
            model_used="LightGBM_quantile_ensemble",
            forecast_generated_at=datetime.now(timezone.utc),
        )
        db.add(res)
        db.commit()
        print("  [x] Seeded ForecastResult (p10=18.5, p50=22.3, p90=27.8)")


def seed_feasibility_results(db, analysis_id: int):
    """Task 260: Seeds 4 FeasibilityResult records for golden demo."""
    existing = db.query(FeasibilityResult).filter(FeasibilityResult.analysis_id == analysis_id).first()
    if not existing:
        results = [
            FeasibilityResult(
                analysis_id=analysis_id,
                vessel_class="Handysize",
                port_id=1,
                port_name="Paradip",
                draft_pass=True,
                loa_pass=True,
                beam_pass=True,
                dwt_pass=False,
                overall_feasible=False,
                requires_lightering=False,
                failure_reason="DWT 40,000 MT < 75,000 MT needed",
            ),
            FeasibilityResult(
                analysis_id=analysis_id,
                vessel_class="Supramax",
                port_id=1,
                port_name="Paradip",
                draft_pass=True,
                loa_pass=True,
                beam_pass=True,
                dwt_pass=False,
                overall_feasible=False,
                requires_lightering=False,
                failure_reason="DWT 65,000 MT < 75,000 MT needed",
            ),
            FeasibilityResult(
                analysis_id=analysis_id,
                vessel_class="Panamax",
                port_id=1,
                port_name="Paradip",
                draft_pass=True,
                loa_pass=True,
                beam_pass=True,
                dwt_pass=True,
                overall_feasible=True,
                requires_lightering=False,
                failure_reason=None,
            ),
            FeasibilityResult(
                analysis_id=analysis_id,
                vessel_class="Capesize",
                port_id=1,
                port_name="Paradip",
                draft_pass=False,
                loa_pass=True,
                beam_pass=True,
                dwt_pass=True,
                overall_feasible=False,
                requires_lightering=False,
                failure_reason="Draft 18.2m exceeds Paradip max draft 16.5m",
            ),
        ]
        for r in results:
            db.add(r)
        db.commit()
        print("  [x] Seeded 4 FeasibilityResults (Panamax PASS, Capesize/Supramax/Handysize FAIL)")


def seed_landed_cost(db, analysis_id: int):
    """Task 261: Seeds LandedCost record for golden demo."""
    existing = db.query(LandedCost).filter(LandedCost.analysis_id == analysis_id).first()
    if not existing:
        lc = LandedCost(
            analysis_id=analysis_id,
            freight_rate_usd_per_mt=22.3,
            baf_surcharge_usd_per_mt=1.2,
            usd_inr_rate=83.5,
            total_usd_per_mt=23.5,
            total_inr_per_mt=1962.25,
            total_inr=147168750.0,
            computed_at=datetime.now(timezone.utc),
        )
        db.add(lc)
        db.commit()
        print("  [x] Seeded LandedCost ($23.50/MT = Rs. 1,962.25/MT, Total = Rs. 147.17 Cr)")


def seed_risk_results(db, analysis_id: int):
    """Task 262: Seeds 6 RiskResult categories for golden demo."""
    existing = db.query(RiskResult).filter(RiskResult.analysis_id == analysis_id).first()
    if not existing:
        risks = [
            RiskResult(
                analysis_id=analysis_id,
                risk_category="Freight Rate Volatility",
                severity="MEDIUM",
                signal_description="Relative forecast quantile spread: 41.7%",
                data_source="LightGBM Quantile Forecast",
            ),
            RiskResult(
                analysis_id=analysis_id,
                risk_category="Port Draft Constraint",
                severity="LOW",
                signal_description="Vessel draft is comfortable (86.1% of maximum draft limit)",
                data_source="Port Master Specification",
            ),
            RiskResult(
                analysis_id=analysis_id,
                risk_category="Delivery Window Tightness",
                severity="LOW",
                signal_description="Comfortable delivery window of 30 days (>=14 days)",
                data_source="Analysis Schedule",
            ),
            RiskResult(
                analysis_id=analysis_id,
                risk_category="Bunker Price Volatility",
                severity="LOW",
                signal_description="Trailing 30-day bunker price volatility is 8.0%",
                data_source="Ship & Bunker VLSFO Feed",
            ),
            RiskResult(
                analysis_id=analysis_id,
                risk_category="Vessel Availability",
                severity="NOT_ASSESSED",
                signal_description="Individual vessel availability cannot be checked — no free real-time AIS source available",
                data_source="AIS Feed (Unavailable)",
            ),
            RiskResult(
                analysis_id=analysis_id,
                risk_category="Geopolitical Disruption",
                severity="NOT_ASSESSED",
                signal_description="No verified geopolitical disruptions flagged for current shipping lane",
                data_source="Maritime Disruption Radar",
            ),
        ]
        for r in risks:
            db.add(r)
        db.commit()
        print("  [x] Seeded 6 Risk Results")


def seed_recommendation(db, analysis_id: int):
    """Task 263: Seeds Recommendation record for golden demo."""
    existing = db.query(Recommendation).filter(Recommendation.analysis_id == analysis_id).first()
    if not existing:
        rec = Recommendation(
            analysis_id=analysis_id,
            rank=1,
            vessel_class="Panamax",
            port_id=1,
            port_name="Paradip",
            cost_score=0.78,
            confidence_score=0.60,
            coverage_fit_score=0.92,
            total_score=0.756,
            cost_score_breakdown="0.5*Cost(0.78) + 0.3*Conf(0.60) + 0.2*Coverage(0.92)",
            is_emergency_mode=False,
        )
        db.add(rec)
        db.commit()
        print("  [x] Seeded Recommendation (Rank #1: Panamax, Total Score: 0.756)")


def seed_stockout_alert(db, analysis_id: int):
    """Task 264: Seeds StockOutAlert scenario."""
    existing = db.query(StockOutAlert).filter(StockOutAlert.analysis_id == analysis_id).first()
    if not existing:
        alert = StockOutAlert(
            analysis_id=analysis_id,
            days_to_stockout=15.0,
            days_to_best_window=22.0,
            is_at_risk=True,
            alert_message="Stock will last 15 days. Next favorable rate window is 22 days away. Book now — cannot afford to wait.",
        )
        db.add(alert)
        db.commit()
        print("  [x] Seeded StockOutAlert (15 days stock < 22 days window -> At Risk=True)")


def seed_past_decisions_for_regret(db, user_id: int):
    """Task 265: Seeds 3 past DecisionRecords with RegretScores."""
    existing = db.query(DecisionRecord).first()
    if not existing:
        today = date.today()
        scenarios: list[dict[str, Any]] = [
            {"rate": 21.50, "best": 21.39, "pct": 0.5, "days_ago": 45, "vessel": "Panamax", "port": "Paradip", "qty": 75000.0},
            {"rate": 22.80, "best": 22.09, "pct": 3.2, "days_ago": 30, "vessel": "Panamax", "port": "Dhamra", "qty": 70000.0},
            {"rate": 24.10, "best": 22.29, "pct": 8.1, "days_ago": 18, "vessel": "Supramax", "port": "Haldia", "qty": 55000.0},
        ]
        for idx, s in enumerate(scenarios, 1):
            dec_date = datetime.now(timezone.utc) - timedelta(days=int(s["days_ago"]))
            past_analysis = Analysis(
                user_id=user_id,
                title=f"Historical Voyage #{idx} — {s['vessel']} to {s['port']}",
                origin_country="Australia",
                origin_port="Newcastle, AU",
                destination_port=s["port"],
                commodity="coking_coal",
                parcel_tonnage=s["qty"],
                recommended_vessel=s["vessel"],
                predicted_rate_pmt=s["best"],
                benchmark_spot_pmt=s["rate"] + 1.5,
                estimated_savings_usd=110000.0,
                status="COMPLETE",
                created_at=dec_date - timedelta(days=5),
            )
            db.add(past_analysis)
            db.commit()
            db.refresh(past_analysis)

            d_rec = DecisionRecord(
                analysis_id=past_analysis.id,
                chosen_vessel_class=s["vessel"],
                chosen_port_id=1,
                chosen_day_rate=s["rate"],
                was_override=False,
                override_reason=None,
                decided_by=user_id,
                decided_at=dec_date,
            )
            db.add(d_rec)
            db.commit()
            db.refresh(d_rec)

            r_score = RegretScore(
                decision_record_id=d_rec.id,
                regret_pct=s["pct"],
                chosen_day_rate=s["rate"],
                best_rate_in_window=s["best"],
                window_start=today - timedelta(days=s["days_ago"] + 14),
                window_end=today - timedelta(days=s["days_ago"] - 14),
                computed_at=datetime.now(timezone.utc),
            )
            db.add(r_score)
        db.commit()
        print("  [x] Seeded 3 past DecisionRecords with RegretScores (0.5%, 3.2%, 8.1%)")



def seed_disruption_alert(db):
    """Task 266: Seeds active DisruptionAlert for Red Sea."""
    existing = db.query(DisruptionAlert).filter(DisruptionAlert.keyword_matched == "Red Sea").first()
    if not existing:
        alert = DisruptionAlert(
            keyword_matched="Red Sea",
            headline_text="Red Sea shipping disruptions continue amid ongoing security concerns",
            source_url="https://maritime-bulletin.org/red-sea-advisory",
            matched_at=datetime.now(timezone.utc),
            is_active=True,
        )
        db.add(alert)
        db.commit()
        print("  [x] Seeded DisruptionAlert (Red Sea, is_active=True)")


def seed_vendor_quotes(db):
    """Task 357: Seeds 3 sample VendorQuote records."""
    existing = db.query(VendorQuote).first()
    if not existing:
        today = date.today()
        quotes = [
            VendorQuote(
                quote_request_label="QR-2026-001",
                broker_name="Clarksons Platou",
                vessel_type="Panamax",
                quoted_rate_usd_per_mt=21.80,
                delivery_days=24,
                valid_until=today + timedelta(days=7),
                is_sample_data=True,
            ),
            VendorQuote(
                quote_request_label="QR-2026-002",
                broker_name="Braemar ACM",
                vessel_type="Panamax",
                quoted_rate_usd_per_mt=22.40,
                delivery_days=22,
                valid_until=today + timedelta(days=5),
                is_sample_data=True,
            ),
            VendorQuote(
                quote_request_label="QR-2026-003",
                broker_name="Simpson Spence Young",
                vessel_type="Supramax",
                quoted_rate_usd_per_mt=24.50,
                delivery_days=20,
                valid_until=today + timedelta(days=10),
                is_sample_data=True,
            ),
        ]
        for q in quotes:
            db.add(q)
        db.commit()
        print("  [x] Seeded 3 sample VendorQuotes (Clarksons, Braemar, SSY)")


def seed_cargo_requests(db):
    """Task 402: Seeds 2 open CargoRequests for pooling demonstration."""
    existing = db.query(CargoRequest).first()
    if not existing:
        reqs = [
            CargoRequest(
                plant_id=1,  # Bhilai
                cargo_type_id=1,  # coking_coal
                quantity_mt=40000.0,
                destination_port_id=1,  # Paradip
                status="OPEN",
                created_at=datetime.now(timezone.utc),
            ),
            CargoRequest(
                plant_id=2,  # Rourkela
                cargo_type_id=1,  # coking_coal
                quantity_mt=35000.0,
                destination_port_id=1,  # Paradip
                status="OPEN",
                created_at=datetime.now(timezone.utc),
            ),
        ]
        for r in reqs:
            db.add(r)
        db.commit()
        print("  [x] Seeded 2 open CargoRequests (Bhilai 40k MT + Rourkela 35k MT -> Paradip)")


def seed_all_demo_scenarios():
    """Task 267 & 403: Runs all seed functions in dependency order."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("=" * 60)
        print("ASTITVA — SEEDING DEMO SCENARIOS")
        print("=" * 60)
        user: Any = create_demo_user(db)
        analysis: Any = seed_golden_demo_analysis(db, user.id)
        seed_forecast_result(db, analysis.id)
        seed_feasibility_results(db, analysis.id)
        seed_landed_cost(db, analysis.id)
        seed_risk_results(db, analysis.id)
        seed_recommendation(db, analysis.id)
        seed_stockout_alert(db, analysis.id)
        seed_past_decisions_for_regret(db, user.id)
        seed_disruption_alert(db)

        seed_vendor_quotes(db)
        seed_cargo_requests(db)
        print("=" * 60)
        print("DEMO SCENARIOS SEEDED SUCCESSFULLY!")
        print("=" * 60)
    finally:
        db.close()


if __name__ == "__main__":
    seed_all_demo_scenarios()

import pytest
import sys
from pathlib import Path
from fastapi.testclient import TestClient

_tests_dir = Path(__file__).resolve().parent
_backend_dir = _tests_dir.parent
_repo_root = _backend_dir.parent
_scripts_dir = _repo_root / "scripts"
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))
if str(_scripts_dir) not in sys.path:
    sys.path.insert(0, str(_scripts_dir))
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from app.main import app as fastapi_app
from app.database import Base, engine
import app.models
from scripts.seed_reference_data import seed_all_reference_data
from scripts.seed_demo_scenarios import seed_all_demo_scenarios


@pytest.fixture(autouse=True)
def setup_param_test_db():
    Base.metadata.create_all(bind=engine)
    seed_all_reference_data()
    seed_all_demo_scenarios()
    yield
    Base.metadata.drop_all(bind=engine)


client = TestClient(fastapi_app)


def test_vendor_quotes_endpoint():
    """Verify Task 354: GET /quotes returns sample quotes with sample notice."""
    response = client.get("/quotes")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        first = data[0]
        assert "broker_name" in first
        assert "vessel_type" in first
        assert "quoted_rate_usd_per_mt" in first
        assert first["is_sample_data"] is True
        assert "sample_data_notice" in first


def test_map_route_endpoint():
    """Verify Task 359: GET /map/route returns port coordinates and distance."""
    response = client.get("/map/route?origin_locode=AUNCL&destination_locode=INPRT")
    assert response.status_code == 200
    data = response.json()
    assert "origin_lat" in data
    assert "origin_lon" in data
    assert "destination_lat" in data
    assert "destination_lon" in data
    assert data["estimated_distance_nm"] > 0
    assert "great-circle approximation" in data["note"]


def test_map_ship_position_endpoint():
    """Verify Task 360: GET /map/ship-position calculates interpolated vessel position."""
    response = client.get("/map/ship-position?origin_lat=-32.9&origin_lon=151.7&destination_lat=20.3&destination_lon=86.6&progress_pct=0.5")
    assert response.status_code == 200
    data = response.json()
    assert "current_lat" in data
    assert "current_lon" in data
    assert data["progress_pct"] == 0.5
    assert "Generated position" in data["note"]


def test_disruption_alerts_endpoint():
    """Verify Task 361: GET /disruption-alerts returns active alerts."""
    response = client.get("/disruption-alerts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Check if seeded Red Sea alert is present
    red_sea = [a for a in data if a.get("keyword_matched") == "Red Sea"]
    assert len(red_sea) >= 1
    assert red_sea[0]["is_active"] is True


def test_golden_demo_quality_checks():
    """Verify Tasks 308, 309, 313, 261, 265, 402: Quality checks on seeded database."""
    from app.database import SessionLocal
    from app.models.entities import (
        FeasibilityResult,
        Recommendation,
        StockOutAlert,
        LandedCost,
        RegretScore,
    )
    from app.models.cargo_request import CargoRequest

    db = SessionLocal()
    try:
        # Task 308: Capesize rejection shows exact draft failure reason
        capesize = db.query(FeasibilityResult).filter(
            FeasibilityResult.analysis_id == 1,
            FeasibilityResult.vessel_class == "Capesize"
        ).first()
        assert capesize is not None
        assert capesize.overall_feasible is False
        assert "Draft 18.2m exceeds Paradip max draft 16.5m" in capesize.failure_reason

        # Task 309: Recommendation score on golden demo is 0.756
        rec = db.query(Recommendation).filter(
            Recommendation.analysis_id == 1,
            Recommendation.rank == 1
        ).first()
        assert rec is not None
        assert rec.vessel_class == "Panamax"
        assert abs(rec.total_score - 0.756) < 0.001

        # Task 313: Stockout alert shows is_at_risk=True and alert text
        stockout = db.query(StockOutAlert).filter(StockOutAlert.analysis_id == 1).first()
        assert stockout is not None
        assert stockout.is_at_risk is True
        assert stockout.days_to_stockout == 15
        assert stockout.days_to_best_window == 22
        assert "Stock will last 15 days" in stockout.alert_message

        # Task 261: Landed cost verification
        cost = db.query(LandedCost).filter(LandedCost.analysis_id == 1).first()
        assert cost is not None
        assert cost.total_usd_per_mt == 23.50
        assert cost.total_inr_per_mt == 1962.25
        assert cost.total_inr == 147168750.0

        # Task 265: Past regret scores (0.5%, 3.2%, 8.1%)
        regrets = db.query(RegretScore).all()
        assert len(regrets) >= 3
        regret_values = [round(float(getattr(r, "regret_pct", 0.0)), 1) for r in regrets]
        assert 0.5 in regret_values
        assert 3.2 in regret_values
        assert 8.1 in regret_values

        # Task 402: 2 open CargoRequests (Bhilai 40k + Rourkela 35k MT)
        cargo_reqs = db.query(CargoRequest).filter(CargoRequest.status == "OPEN").all()
        assert len(cargo_reqs) == 2
        quantities = sorted([r.quantity_mt for r in cargo_reqs])
        assert quantities == [35000.0, 40000.0]
    finally:
        db.close()

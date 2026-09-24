"""
Comprehensive Test Suite for SIH26006 Problem Statement Gap Enhancements:
1. Origin Ports Infrastructure & Congestion
2. Dual-Port Vessel Feasibility Engine
3. Climatological & Seasonal Demand-Supply Factor Engine
4. Vessel Idle Turnaround & Alternative Employment Recommender
5. Global Baltic, Commodity & Macroeconomic Indicators API
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.reference import ReferencePort
from app.engines.feasibility_engine import run_feasibility_check
from app.engines.seasonal_engine import compute_seasonal_factor
from app.engines.idle_employment_engine import (
    compute_turnaround_and_demurrage,
    generate_alternative_employments,
)
from scripts.seed_reference_data import seed_all_reference_data


@pytest.fixture(scope="module", autouse=True)
def setup_test_data():
    seed_all_reference_data()


@pytest.fixture
def client():
    return TestClient(app)


def test_origin_ports_seeded():
    db = SessionLocal()
    try:
        origin_ports = db.query(ReferencePort).filter(ReferencePort.port_type == "ORIGIN").all()
        assert len(origin_ports) >= 8, f"Expected at least 8 origin ports, found {len(origin_ports)}"

        hay_point = db.query(ReferencePort).filter(ReferencePort.port_name == "Hay Point (DBCT)").first()
        assert hay_point is not None
        assert hay_point.country == "Australia"
        assert hay_point.max_draft_m >= 19.0
        assert hay_point.current_vessels_in_queue > 0

        norfolk = db.query(ReferencePort).filter(ReferencePort.port_name == "Hampton Roads (Norfolk)").first()
        assert norfolk is not None
        assert norfolk.country == "USA"
        assert norfolk.port_type == "ORIGIN"

        maputo = db.query(ReferencePort).filter(ReferencePort.port_name == "Maputo (Matola Coal)").first()
        assert maputo is not None
        assert maputo.country == "Mozambique"
    finally:
        db.close()


def test_dual_port_feasibility_engine():
    # Test 1: Capesize on Hay Point (19.5m draft) to Gangavaram (21.0m draft)
    class MockAnalysisDeepwater:
        origin_port = "Hay Point (DBCT)"
        destination_port = "Gangavaram"
        parcel_tonnage = 150000.0
        id = 999

    results = run_feasibility_check(MockAnalysisDeepwater)
    assert len(results) == 4

    # Capesize should pass both Hay Point and Gangavaram
    cape = next(r for r in results if r.vessel_class == "Capesize")
    assert cape.overall_feasible is True
    assert cape.draft_pass is True

    # Test 2: Panamax on Hay Point to Paradip (16.5m draft)
    class MockAnalysisPanamax:
        origin_port = "Hay Point (DBCT)"
        destination_port = "Paradip"
        parcel_tonnage = 75000.0
        id = 998

    results_panamax = run_feasibility_check(MockAnalysisPanamax)
    panamax = next(r for r in results_panamax if r.vessel_class == "Panamax")
    assert panamax.overall_feasible is True
    assert panamax.draft_pass is True

    # Test 3: Capesize on Maputo (13.0m draft) must fail origin draft check
    class MockAnalysisMaputoCape:
        origin_port = "Maputo (Matola Coal)"
        destination_port = "Gangavaram"
        parcel_tonnage = 150000.0
        id = 997

    results_maputo = run_feasibility_check(MockAnalysisMaputoCape)
    maputo_cape = next(r for r in results_maputo if r.vessel_class == "Capesize")
    assert maputo_cape.overall_feasible is False
    assert "origin Maputo" in maputo_cape.failure_reason



def test_seasonal_engine_all_months():
    for month in range(1, 13):
        res = compute_seasonal_factor(month, "Hay Point (DBCT)", "Paradip")
        assert "factor" in res
        assert 0.95 <= res["factor"] <= 1.40
        assert "narrative_en" in res and len(res["narrative_en"]) > 10
        assert "narrative_hi" in res and len(res["narrative_hi"]) > 10

    # Monsoon month test
    july = compute_seasonal_factor(7, "Hay Point (DBCT)", "Paradip")
    assert july["risk_level"] == "HIGH"
    assert july["factor"] >= 1.20

    # Haldia monsoon lightering penalty
    haldia_july = compute_seasonal_factor(7, "Hay Point (DBCT)", "Haldia")
    assert haldia_july["factor"] > july["factor"]


def test_idle_turnaround_and_alternative_employment():
    turnaround = compute_turnaround_and_demurrage(
        origin_port="Hay Point (DBCT)",
        destination_port="Paradip",
        vessel_class="Capesize",
        quantity_mt=150000.0,
        laycan_month=7,
    )
    assert turnaround["origin_waiting_days"] > 0
    assert turnaround["destination_waiting_days"] > 0
    assert turnaround["laytime_allowed_days"] > 0
    assert turnaround["demurrage_exposure_usd"] > 0
    assert turnaround["ballast_deadhead_days"] >= 14.0

    alternatives = generate_alternative_employments(
        origin_port="Hay Point (DBCT)",
        destination_port="Paradip",
        vessel_class="Capesize",
        quantity_mt=150000.0,
        turnaround_metrics=turnaround,
    )
    assert len(alternatives) == 4
    strategy_ids = [opt["id"] for opt in alternatives]
    assert "coastal_cabotage" in strategy_ids
    assert "backhaul_iron_ore" in strategy_ids
    assert "period_relet" in strategy_ids
    assert "eco_speed" in strategy_ids

    # All options must provide positive financial benefit
    for opt in alternatives:
        assert opt["net_benefit_usd"] > 0
        assert opt["absorbed_idle_days"] > 0


def test_market_indicators_api(client):
    response = client.get("/api/market/indicators")
    assert response.status_code == 200
    data = response.json()

    assert "baltic_indices" in data
    assert data["baltic_indices"]["bdi"]["current"] > 0
    assert data["baltic_indices"]["bci"]["current"] > 0

    assert "commodity_prices" in data
    assert data["commodity_prices"]["coking_coal_fob_usd"]["current"] > 100
    assert data["commodity_prices"]["iron_ore_cfr_usd"]["current"] > 50

    assert "macro_indicators" in data
    assert data["macro_indicators"]["global_manufacturing_pmi"] > 40
    assert data["macro_indicators"]["usd_inr_rate"] > 70


def test_idle_employment_api(client):
    payload = {
        "origin_port": "Hay Point (DBCT)",
        "destination_port": "Paradip",
        "vessel_class": "Capesize",
        "quantity_mt": 160000.0,
        "laycan_month": 7,
    }
    response = client.post("/api/analyses/idle-employment", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "turnaround" in data
    assert "alternative_employments" in data
    assert len(data["alternative_employments"]) == 4


def test_reference_ports_filter_api(client):
    # Filter by origin
    res_origin = client.get("/api/admin/reference/ports?port_type=ORIGIN")
    assert res_origin.status_code == 200
    origin_ports = res_origin.json()
    assert len(origin_ports) >= 8
    for p in origin_ports:
        assert p["port_type"] == "ORIGIN"

    # Filter by destination
    res_dest = client.get("/api/admin/reference/ports?port_type=DESTINATION")
    assert res_dest.status_code == 200
    dest_ports = res_dest.json()
    assert len(dest_ports) >= 4
    for p in dest_ports:
        assert p["port_type"] == "DESTINATION"

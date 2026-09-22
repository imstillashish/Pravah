import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_global_metrics_endpoint():
    res = client.get("/api/metrics/global")
    assert res.status_code == 200
    data = res.json()
    assert data["bdi_index"] == 1842
    assert data["bdi_change_pct"] == 2.4
    assert data["current_avg_freight_pmt"] == 14.85
    assert data["freight_change_pct"] == -6.8
    assert data["bunker_vlsfo_pmt"] == 612.50
    assert data["capesize_daily_usd"] == 22450
    assert data["panamax_daily_usd"] == 14120

def test_analyses_requires_auth():
    recent_res = client.get("/api/analyses/recent")
    assert recent_res.status_code == 401

    post_res = client.post("/api/analyses", json={
        "origin_country": "Australia",
        "origin_port": "Hay Point",
        "destination_port": "Paradip",
        "commodity": "Coking Coal",
        "parcel_tonnage": 75000
    })
    assert post_res.status_code == 401

def test_analyses_crud_and_seeding():
    # 1. Register & login user
    reg = client.post("/api/auth/signup", json={
        "full_name": "Priya Sharma",
        "email": "priya@sail.gov.in",
        "password": "Password123"
    })
    assert reg.status_code == 200
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get initial recent analyses (should auto-seed 3 demo items)
    rec_res = client.get("/api/analyses/recent", headers=headers)
    assert rec_res.status_code == 200
    recent = rec_res.json()
    assert len(recent) == 3

    titles = [item["title"] for item in recent]
    assert "Hay Point to Paradip Coking Coal" in titles
    assert "Maputo to Vizag Thermal Coal" in titles
    assert "Balikpapan to Haldia Steam Coal" in titles

    item1 = next(item for item in recent if item["title"] == "Hay Point to Paradip Coking Coal")
    assert item1["origin_country"] == "Australia"
    assert item1["origin_port"] == "Hay Point"
    assert item1["destination_port"] == "Paradip"
    assert item1["commodity"] == "Coking Coal"
    assert item1["parcel_tonnage"] == 75000
    assert item1["recommended_vessel"] == "Panamax"
    assert item1["predicted_rate_pmt"] == 13.85
    assert item1["benchmark_spot_pmt"] == 16.20
    assert item1["estimated_savings_usd"] == 176250.0
    assert item1["status"] == "finalized"

    # 3. Create new analysis
    create_res = client.post("/api/analyses", headers=headers, json={
        "origin_country": "Australia",
        "origin_port": "Hay Point",
        "destination_port": "Paradip",
        "commodity": "Coking Coal",
        "parcel_tonnage": 75000,
        "status": "finalized"
    })
    assert create_res.status_code == 200
    created = create_res.json()
    assert created["recommended_vessel"] == "Panamax"
    assert created["status"] == "finalized"
    assert created["estimated_savings_usd"] > 0
    assert created["predicted_rate_pmt"] > 0

    # 4. Recent analyses now has 4 items, with newest first
    rec_res2 = client.get("/api/analyses/recent", headers=headers)
    assert rec_res2.status_code == 200
    recent2 = rec_res2.json()
    assert len(recent2) == 4
    assert recent2[0]["id"] == created["id"]

def test_vessel_recommendation_and_haldia_constraint():
    reg = client.post("/api/auth/signup", json={
        "full_name": "Rohan Das",
        "email": "rohan@sail.gov.in",
        "password": "Password123"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Capesize route to Paradip (>= 100k MT)
    res_cape = client.post("/api/analyses", headers=headers, json={
        "origin_country": "Australia",
        "origin_port": "Port Hedland",
        "destination_port": "Paradip",
        "commodity": "Iron Ore",
        "parcel_tonnage": 150000,
        "status": "draft"
    })
    assert res_cape.status_code == 200
    assert res_cape.json()["recommended_vessel"] == "Capesize"

    # Route to Haldia with >= 100k MT should fallback due to draft limitation
    res_haldia = client.post("/api/analyses", headers=headers, json={
        "origin_country": "Australia",
        "origin_port": "Hay Point",
        "destination_port": "Haldia",
        "commodity": "Coking Coal",
        "parcel_tonnage": 120000,
        "status": "overridden"
    })
    assert res_haldia.status_code == 200
    assert res_haldia.json()["recommended_vessel"] in ["Panamax", "Handysize"]
    assert res_haldia.json()["status"] == "overridden"

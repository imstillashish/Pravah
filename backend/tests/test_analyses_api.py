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
    series = data["series"]
    assert len(series["bdi"]) == 30
    assert len(series["freight"]) == 30
    assert len(series["bunker"]) == 30
    assert series["bdi"][-1] == 1842
    assert series["freight"][-1] == 14.85
    assert series["bunker"][-1] == 612.50

def test_metrics_series_deterministic():
    a = client.get("/api/metrics/global").json()["series"]
    b = client.get("/api/metrics/global").json()["series"]
    assert a == b

def test_metrics_series_shape():
    data = client.get("/api/metrics/global").json()["series"]
    for key in ("bdi", "freight", "bunker"):
        vals = data[key]
        assert all(v > 0 for v in vals)
        assert any(v != vals[-1] for v in vals[:-1])

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


def test_decision_record_and_booking_lifecycle():
    reg = client.post("/api/auth/signup", json={
        "full_name": "Decision Officer",
        "email": "officer@sail.gov.in",
        "password": "Password123"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post("/api/analyses", headers=headers, json={
        "origin_country": "Australia",
        "origin_port": "Newcastle",
        "destination_port": "Paradip",
        "commodity": "Coking Coal",
        "parcel_tonnage": 75000,
    })
    analysis_id = create_res.json()["id"]

    # 1. Reject without reason -> 400
    rej_fail = client.post(f"/api/analyses/{analysis_id}/decision/reject", json={})
    assert rej_fail.status_code == 400

    # 2. Reject with reason -> 200
    rej = client.post(f"/api/analyses/{analysis_id}/decision/reject", json={"reason": "Berth occupied"})
    assert rej.status_code == 200
    assert rej.json()["status"] == "rejected"

    # 3. Cannot book unapproved decision -> 400
    book_fail = client.post("/api/bookings", json={"decision_record_id": analysis_id})
    assert book_fail.status_code == 400

    # 4. Approve decision -> 200
    appr = client.post(f"/api/analyses/{analysis_id}/decision/approve", json={"notes": "Approved for Paradip"})
    assert appr.status_code == 200
    assert appr.json()["status"] == "approved"

    # 5. Export decision record -> 200 plain text
    export = client.get(f"/api/analyses/{analysis_id}/export")
    assert export.status_code == 200
    assert "ASTITVA" in export.text

    # 6. Book approved decision -> 201
    book_res = client.post("/api/bookings", json={"decision_record_id": analysis_id})
    assert book_res.status_code == 201
    booking_id = book_res.json()["id"]

    # 7. Confirm booking -> 200
    conf_res = client.patch(f"/api/bookings/{booking_id}/confirm", json={"note": "Signed laycan"})
    assert conf_res.status_code == 200
    assert conf_res.json()["status"] == "CONFIRMED"


def test_demand_board_pooling():
    # 1. Create two requests for Paradip (port 1)
    req1 = client.post("/api/demand", json={
        "plant_id": 1,
        "cargo_type_id": 1,
        "quantity_mt": 40000,
        "destination_port_id": 1
    }).json()

    req2 = client.post("/api/demand", json={
        "plant_id": 2,
        "cargo_type_id": 1,
        "quantity_mt": 35000,
        "destination_port_id": 1
    }).json()

    # 2. Create third request for Haldia (port 4)
    req3 = client.post("/api/demand", json={
        "plant_id": 3,
        "cargo_type_id": 1,
        "quantity_mt": 25000,
        "destination_port_id": 4
    }).json()

    # 3. Merge different ports -> 400
    merge_diff = client.post("/api/demand/merge", json={
        "request_id_a": req1["id"],
        "request_id_b": req3["id"]
    })
    assert merge_diff.status_code == 400
    assert "different ports" in merge_diff.json()["detail"]

    # 4. Merge same port -> 200 (combined 75,000 MT)
    merge_ok = client.post("/api/demand/merge", json={
        "request_id_a": req1["id"],
        "request_id_b": req2["id"]
    })
    assert merge_ok.status_code == 200
    assert merge_ok.json()["combined_quantity_mt"] == 75000


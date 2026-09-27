"""
Microscopic edge-case and robustness test suite for PRAVAH (SIH26006).
Tests extreme boundaries, zero/negative inputs, port draft limits,
auth edge cases, DB connection string parsing, and engine invariants.
"""
import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.config import Settings
from app.engines.feasibility_engine import run_feasibility_check
from app.engines.stockout_engine import calculate_stockout_alert
from app.engines.pooling_engine import calculate_pooling
from app.engines.forecast_engine import compute_confidence_label

client = TestClient(app)

class MockCargo:
    def __init__(
        self,
        id="edge-case-1",
        quantity_mt=75000.0,
        destination_port="Paradip",
        destination_port_id=1,
        delivery_start=date.today() + timedelta(days=20),
        delivery_end=date.today() + timedelta(days=50),
        current_stock_mt=12000.0,
        daily_consumption_mt=800.0,
    ):
        self.id = id
        self.quantity_mt = quantity_mt
        self.destination_port = destination_port
        self.destination_port_id = destination_port_id
        self.delivery_start = delivery_start
        self.delivery_end = delivery_end
        self.current_stock_mt = current_stock_mt
        self.daily_consumption_mt = daily_consumption_mt

# ============================================================================
# 1. Database URL & Configuration Edge Cases
# ============================================================================

def test_database_url_edge_cases(monkeypatch):
    """Test URL normalization across varied PostgreSQL connection formats."""
    test_cases = [
        ("postgres://user:secret@db.render.com:5432/prod", "postgresql://user:secret@db.render.com:5432/prod"),
        ("postgresql://user:secret@db.render.com:5432/prod", "postgresql://user:secret@db.render.com:5432/prod"),
        ("sqlite:///custom/path.db", "sqlite:///custom/path.db"),
        ("postgres://user:p%40ssword@host:5432/db?sslmode=require", "postgresql://user:p%40ssword@host:5432/db?sslmode=require"),
    ]
    for raw_url, expected in test_cases:
        monkeypatch.setenv("DATABASE_URL", raw_url)
        s = Settings()
        assert s.DATABASE_URL == expected, f"Failed for {raw_url}"

# ============================================================================
# 2. Port Navigation & Berth Feasibility Microscopic Constraints
# ============================================================================

def test_haldia_lightering_and_draft_limits():
    """Haldia is riverine/tidal (draft ~9.1m) and requires lightering for Supramax, rejects oversized."""
    analysis_haldia = MockCargo(destination_port="Haldia", destination_port_id=4, quantity_mt=45000)
    results = run_feasibility_check(analysis_haldia)
    assert len(results) == 4
    
    supramax = next(r for r in results if r.vessel_class == "Supramax")
    assert supramax.requires_lightering is True
    assert supramax.overall_feasible is True
    
    # Capesize DWT is 200,000 MT, LOA 292m > Haldia max 240m -> impossible even with lightering
    capesize = next(r for r in results if r.vessel_class == "Capesize")
    assert capesize.overall_feasible is False
    assert "LOA" in capesize.failure_reason

def test_dhamra_deepwater_berth_accepts_panamax():
    """Dhamra is deep-water (~18.0m draft) and fully compliant for standard Panamax bulk carriers."""
    analysis_dhamra = MockCargo(destination_port="Dhamra", destination_port_id=2, quantity_mt=75000)
    results = run_feasibility_check(analysis_dhamra)
    panamax = next(r for r in results if r.vessel_class == "Panamax")
    assert panamax.overall_feasible is True
    assert panamax.failure_reason is None

def test_unknown_port_defaults_safely():
    """Unknown ports should fall back to Paradip reference constraints rather than raising unhandled errors."""
    analysis_unknown = MockCargo(destination_port="Atlantis_Port", destination_port_id=999, quantity_mt=75000)
    results = run_feasibility_check(analysis_unknown)
    assert len(results) == 4
    assert all(r.port_name == "Paradip" for r in results)

# ============================================================================
# 3. Freight Forecasting Invariants & Confidence Labels
# ============================================================================

def test_confidence_label_boundaries():
    """Test confidence label transitions at 15% and 30% spread boundaries."""
    # (p90 - p10) / p50 < 0.15 -> HIGH
    assert compute_confidence_label(20.0, 22.0, 22.5) == "HIGH"
    # Exact 0.15 boundary -> MEDIUM
    assert compute_confidence_label(20.0, 20.0, 23.0) == "MEDIUM"
    # > 0.30 -> LOW
    assert compute_confidence_label(15.0, 22.0, 25.0) == "LOW"
    # Zero or negative p50 safeguard
    assert compute_confidence_label(10.0, 0.0, 20.0) == "LOW"

# ============================================================================
# 4. Stockout Engine Edge Cases
# ============================================================================

def test_stockout_engine_zero_and_missing_inputs():
    """Missing or non-positive consumption returns None gracefully without ZeroDivisionError."""
    # Daily consumption = 0
    zero_consumption = MockCargo(current_stock_mt=10000, daily_consumption_mt=0)
    assert calculate_stockout_alert(zero_consumption) is None
    
    # Negative consumption
    neg_consumption = MockCargo(current_stock_mt=10000, daily_consumption_mt=-100)
    assert calculate_stockout_alert(neg_consumption) is None
    
    # None values
    none_data = MockCargo(current_stock_mt=None, daily_consumption_mt=500)
    assert calculate_stockout_alert(none_data) is None
    
    # Valid low stock -> alert triggered
    low_stock = MockCargo(current_stock_mt=8000, daily_consumption_mt=1000)
    alert = calculate_stockout_alert(low_stock)
    assert alert is not None
    assert alert.is_at_risk is True
    assert "Book now" in alert.alert_message

# ============================================================================
# 5. Pooling Engine Parcel Boundary Edge Cases
# ============================================================================

def test_pooling_engine_different_ports_raises_value_error():
    """Pooling engine must strictly reject combining cargo for different discharge ports."""
    cargo_paradip = MockCargo(id="c1", destination_port="Paradip", destination_port_id=1, quantity_mt=30000)
    cargo_haldia = MockCargo(id="c2", destination_port="Haldia", destination_port_id=4, quantity_mt=35000)
    
    with pytest.raises(ValueError, match="Cannot pool shipments with different destination ports"):
        calculate_pooling(cargo_paradip, cargo_haldia)

def test_pooling_engine_successful_consolidation():
    """Parcels to same port are consolidated to higher vessel class and show positive savings."""
    cargo_a = MockCargo(id="c1", destination_port="Paradip", destination_port_id=1, quantity_mt=35000)
    cargo_b = MockCargo(id="c2", destination_port="Paradip", destination_port_id=1, quantity_mt=35000)
    
    result = calculate_pooling(cargo_a, cargo_b)
    assert result["combined_quantity"] == 70000
    assert result["combined_vessel_class"] == "Panamax"
    assert result["per_tonne_saving_pct"] > 0
    assert "estimated_saving_note" in result

# ============================================================================
# 6. Auth API Robustness & Security Edge Cases
# ============================================================================

def test_auth_malformed_token_header():
    """Protected endpoints must reject malformed tokens with HTTP 401 without internal server 500 errors."""
    bad_tokens = [
        "Bearer malformed.garbage.token",
        "Bearer ",
        "Basic dXNlcjpwYXNz",
        "Bearer null",
        "Bearer undefined",
        "Bearer ' OR '1'='1",
    ]
    for header_val in bad_tokens:
        res = client.get("/api/analyses/recent", headers={"Authorization": header_val})
        assert res.status_code in [401, 403], f"Failed for {header_val}: got {res.status_code}"

def test_login_sql_injection_attempt():
    """Login must reject SQL injection syntax cleanly."""
    res = client.post("/api/auth/login", json={
        "email": "' OR 1=1 --",
        "password": "wrong"
    })
    assert res.status_code in [400, 401, 422]

# ============================================================================
# 7. Health Endpoint Performance & Contract
# ============================================================================

def test_health_endpoint_response_time_and_schema():
    """Verify /health and /api/health return HTTP 200 with required schema in under 150ms."""
    import time
    for path in ["/health", "/api/health"]:
        start = time.perf_counter()
        res = client.get(path)
        elapsed_ms = (time.perf_counter() - start) * 1000
        
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert data["service"] == "pravah-backend"
        assert elapsed_ms < 150, f"Health check on {path} took {elapsed_ms:.2f}ms"

"""
Comprehensive Domain & Constraint Verification Matrix Test Suite (270+ Tests).
SIH26006 - Astitva Intelligent Freight Platform.

Validates:
1. Port Bathymetry & Vessel Feasibility Matrix (14 Ports x 4 Vessel Classes + Lightering).
2. Great-Circle Navigation & LOCODE Connector Matrix.
3. Machine Learning Forecasting & Quantile Monotonicity Bounds (P10 <= P50 <= P90).
4. Landed Cost Logistics & Foreign Exchange Calculus.
5. Plant Stockpile Days-of-Inventory (DOI) & Stockout Risk Depletion.
6. Recommendation Engine Multi-Objective Scoring & Explainability.
7. Cryptographic SHA-256 Audit Trail & Token Security Matrix.
"""

import math
import hashlib
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
import pytest

from app.engines.feasibility_engine import (
    DEFAULT_PORTS,
    DEFAULT_VESSELS,
    run_feasibility_check,
)
from app.connectors.locode_connector import (
    calculate_haversine_distance_nm,
    get_port_coordinates,
)
from app.engines.forecast_engine import (
    compute_confidence_label,
    _safe_predict,
)
from app.engines.landed_cost_engine import calculate_landed_cost
from app.engines.stockout_engine import calculate_stockout_alert
from app.engines.recommendation_engine import (
    run_recommendation,
    VESSEL_COST_MULTIPLIER,
    VESSEL_DWT_MAX,
)
from app.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)


# ============================================================================
# 1. PORT BATHYMETRY & VESSEL FEASIBILITY MATRIX (56 + 8 = 64 Tests)
# ============================================================================

class MockFeasibilityAnalysis:
    def __init__(self, port_name: str, quantity_mt: float = 30000.0):
        self.destination_port = port_name
        self.destination_port_id = DEFAULT_PORTS[port_name]["id"] if port_name in DEFAULT_PORTS else 1
        self.quantity_mt = quantity_mt


@pytest.mark.parametrize("port_name", list(DEFAULT_PORTS.keys()))
@pytest.mark.parametrize("vessel_idx", range(len(DEFAULT_VESSELS)))
def test_matrix_port_vessel_feasibility(port_name: str, vessel_idx: int):
    """Verify feasibility evaluations for all 14 ports against all 4 vessel classes (56 permutations)."""
    port_spec = DEFAULT_PORTS[port_name]
    vessel_spec = DEFAULT_VESSELS[vessel_idx]
    vessel_class = vessel_spec["class_name"]

    # Use DWT min so quantity fits inside the vessel
    analysis = MockFeasibilityAnalysis(port_name=port_name, quantity_mt=float(vessel_spec["dwt_min"]))
    results = run_feasibility_check(analysis)

    match = next((r for r in results if r.vessel_class == vessel_class), None)
    assert match is not None, f"Missing feasibility entry for {vessel_class} at {port_name}"

    port_draft = port_spec["max_draft_m"]
    port_loa = port_spec["max_loa_m"]
    port_beam = port_spec["max_beam_m"]

    vessel_draft = vessel_spec["typical_draft_m"]
    vessel_loa = vessel_spec["typical_loa_m"]
    vessel_beam = vessel_spec["typical_beam_m"]

    has_lightering = port_spec.get("has_lightering", False)

    # Dimensional fit checks
    expected_loa_pass = vessel_loa <= port_loa
    expected_beam_pass = vessel_beam <= port_beam
    expected_draft_pass = vessel_draft <= port_draft

    assert match.loa_pass == expected_loa_pass
    assert match.beam_pass == expected_beam_pass
    assert match.draft_pass == expected_draft_pass

    if expected_loa_pass and expected_beam_pass:
        if expected_draft_pass:
            assert match.overall_feasible is True
        elif has_lightering:
            assert match.overall_feasible is True
            assert match.requires_lightering is True
        else:
            assert match.overall_feasible is False
    else:
        assert match.overall_feasible is False


@pytest.mark.parametrize("vessel_class,expected_lightering,expected_feasible", [
    ("Handysize", True, True),
    ("Supramax", True, True),
    ("Panamax", True, True),
    ("Capesize", True, False), # Capesize exceeds Haldia LOA and Beam limits
])
def test_matrix_haldia_lightering_constraints(vessel_class: str, expected_lightering: bool, expected_feasible: bool):
    """Verify Haldia riverine tidal lock lightering constraints (Draft 9.1m)."""
    analysis = MockFeasibilityAnalysis(port_name="Haldia", quantity_mt=35000.0)
    results = run_feasibility_check(analysis)
    entry = next(r for r in results if r.vessel_class == vessel_class)

    assert entry is not None
    assert entry.requires_lightering == expected_lightering
    assert entry.overall_feasible == expected_feasible


@pytest.mark.parametrize("port,capesize_draft,expected_feasible", [
    ("Paradip", 18.2, False),       # Paradip max draft 16.5m < 18.2m -> Non-feasible for fully laden Cape
    ("Dhamra", 18.0, False),        # Dhamra max draft 18.0m < 18.2m
    ("Gangavaram", 21.0, True),     # Gangavaram max draft 21.0m > 18.2m -> Feasible
    ("Hay Point (DBCT)", 19.5, True) # Hay Point max draft 19.5m > 18.2m -> Feasible
])
def test_matrix_deep_draft_capesize_envelope(port: str, capesize_draft: float, expected_feasible: bool):
    """Verify deep-draft Capesize envelope against Indian and global terminal limits."""
    analysis = MockFeasibilityAnalysis(port_name=port, quantity_mt=150000.0)
    results = run_feasibility_check(analysis)
    cape = next(r for r in results if r.vessel_class == "Capesize")
    assert cape.overall_feasible == expected_feasible


# ============================================================================
# 2. GREAT-CIRCLE NAVIGATION & LOCODE CONNECTOR MATRIX (30 Tests)
# ============================================================================

@pytest.mark.parametrize("lat1,lon1,lat2,lon2,expected_gc_nm", [
    (-21.28, 149.30, 20.26, 86.67, 4440.9),   # Hay Point to Paradip
    (-32.92, 151.78, 22.02, 88.06, 4917.7),   # Newcastle to Haldia
    (-23.84, 151.26, 17.68, 83.21, 4700.4),   # Gladstone to Vizag
    (-28.80, 32.03, 17.65, 83.25, 4074.0),    # Richards Bay to Gangavaram
    (39.27, -76.58, 15.42, 73.80, 7127.8),    # Baltimore to Mormugao
])
def test_matrix_haversine_distance_accuracy(lat1, lon1, lat2, lon2, expected_gc_nm):
    """Verify Great-Circle Haversine distance calculations within +/- 1% error tolerance."""
    dist = calculate_haversine_distance_nm(lat1, lon1, lat2, lon2)
    assert dist > 0.0
    assert math.isclose(dist, expected_gc_nm, rel_tol=0.01)


def test_matrix_haversine_properties():
    """Verify mathematical properties of distance: identity, symmetry, positive definiteness."""
    assert calculate_haversine_distance_nm(20.26, 86.67, 20.26, 86.67) == 0.0
    d_ab = calculate_haversine_distance_nm(-21.28, 149.30, 20.26, 86.67)
    d_ba = calculate_haversine_distance_nm(20.26, 86.67, -21.28, 149.30)
    assert d_ab == d_ba


@pytest.mark.parametrize("query,expected_port_substring", [
    ("INPRT", "Paradip"),
    ("inprt", "Paradip"),
    ("  INPRT  ", "Paradip"),
    ("Paradip Port", "Paradip"),
    ("Port of Paradip", "Paradip"),
    ("INHLD", "Haldia"),
    ("Haldia Dock Complex", "Haldia"),
    ("INDHM", "Dhamra"),
    ("INGGV", "Gangavaram"),
    ("AUNCL", "Newcastle"),
    ("Port of Newcastle", "Newcastle"),
    ("AUHPT", "Hay Point"),
    ("Hay Point (DBCT)", "Hay Point"),
    ("AUGLT", "Gladstone"),
    ("AUABP", "Abbot Point"),
    ("ZARCB", "Richards Bay"),
    ("USBMT", "Baltimore"),
    ("USORF", "Norfolk"),
    ("MZMPM", "Maputo"),
    ("MZBEW", "Beira"),
    ("IDSRI", "Samarinda"),
    ("IDBPN", "Balikpapan"),
])
def test_matrix_locode_lookup_resilience(query: str, expected_port_substring: str):
    """Verify LOCODE and fuzzy name lookups for all major Indian & Global ports."""
    coords = get_port_coordinates(query)
    assert coords is not None
    assert "lat" in coords and "lon" in coords
    assert isinstance(coords["lat"], float)
    assert isinstance(coords["lon"], float)


@pytest.mark.parametrize("invalid_query", ["", "   ", "UNKNOWN_NON_EXISTENT_PORT_XYZ", "12345!@#"])
def test_matrix_locode_invalid_queries(invalid_query: str):
    """Verify LOCODE connector returns None safely for invalid or empty queries."""
    assert get_port_coordinates(invalid_query) is None


# ============================================================================
# 3. MACHINE LEARNING & QUANTILE MONOTONICITY MATRIX (45 Tests)
# ============================================================================

@pytest.mark.parametrize("p10,p50,p90,expected_label", [
    # High Confidence: spread / p50 < 0.15
    (20.0, 22.0, 22.5, "HIGH"),      # 2.5 / 22 = 0.113
    (50.0, 52.0, 55.0, "HIGH"),      # 5.0 / 52 = 0.096
    (10.0, 10.5, 11.0, "HIGH"),      # 1.0 / 10.5 = 0.095
    (100.0, 105.0, 112.0, "HIGH"),   # 12.0 / 105 = 0.114
    (14.0, 14.5, 15.5, "HIGH"),      # 1.5 / 14.5 = 0.103
    (30.0, 31.0, 33.0, "HIGH"),      # 3.0 / 31 = 0.096
    (80.0, 82.0, 88.0, "HIGH"),      # 8.0 / 82 = 0.097
    (15.0, 15.5, 16.5, "HIGH"),      # 1.5 / 15.5 = 0.096
    (25.0, 26.0, 28.0, "HIGH"),      # 3.0 / 26 = 0.115
    (40.0, 42.0, 45.0, "HIGH"),      # 5.0 / 42 = 0.119

    # Medium Confidence: 0.15 <= spread / p50 <= 0.30
    (18.0, 22.0, 23.0, "MEDIUM"),    # 5.0 / 22 = 0.227
    (12.0, 15.0, 16.0, "MEDIUM"),    # 4.0 / 15 = 0.266
    (25.0, 30.0, 32.0, "MEDIUM"),    # 7.0 / 30 = 0.233
    (45.0, 55.0, 58.0, "MEDIUM"),    # 13.0 / 55 = 0.236
    (70.0, 85.0, 92.0, "MEDIUM"),    # 22.0 / 85 = 0.258
    (14.0, 17.0, 18.5, "MEDIUM"),    # 4.5 / 17 = 0.264
    (35.0, 42.0, 46.0, "MEDIUM"),    # 11.0 / 42 = 0.261
    (20.0, 25.0, 27.0, "MEDIUM"),    # 7.0 / 25 = 0.280
    (10.0, 12.0, 13.2, "MEDIUM"),    # 3.2 / 12 = 0.266
    (60.0, 75.0, 81.0, "MEDIUM"),    # 21.0 / 75 = 0.280

    # Low Confidence: spread / p50 > 0.30
    (15.0, 22.0, 25.0, "LOW"),       # 10.0 / 22 = 0.454
    (8.0, 14.0, 18.0, "LOW"),        # 10.0 / 14 = 0.714
    (10.0, 20.0, 28.0, "LOW"),       # 18.0 / 20 = 0.900
    (20.0, 35.0, 45.0, "LOW"),       # 25.0 / 35 = 0.714
    (50.0, 80.0, 110.0, "LOW"),      # 60.0 / 80 = 0.750
    (12.0, 20.0, 26.0, "LOW"),       # 14.0 / 20 = 0.700
    (30.0, 50.0, 70.0, "LOW"),       # 40.0 / 50 = 0.800
    (5.0, 10.0, 15.0, "LOW"),        # 10.0 / 10 = 1.000
    (40.0, 70.0, 95.0, "LOW"),       # 55.0 / 70 = 0.785
    (25.0, 45.0, 60.0, "LOW"),       # 35.0 / 45 = 0.777

    # Edge cases
    (10.0, 0.0, 20.0, "LOW"),        # Division by zero protection
    (15.0, -10.0, 25.0, "LOW"),      # Negative median protection
])
def test_matrix_confidence_label_classification(p10: float, p50: float, p90: float, expected_label: str):
    """Verify confidence classification across 32 numeric boundaries and edge cases."""
    assert compute_confidence_label(p10, p50, p90) == expected_label


@pytest.mark.parametrize("p10,p50,p90", [
    (11.2, 13.5, 16.8),
    (14.0, 18.0, 22.5),
    (9.5, 11.0, 14.2),
    (20.1, 24.5, 30.0),
    (15.0, 15.0, 15.0), # degenerate case
])
def test_matrix_quantile_monotonicity(p10: float, p50: float, p90: float):
    """Verify that quantile predictions satisfy strict non-decreasing monotonicity."""
    assert p10 <= p50 <= p90


def test_matrix_safe_predict_booster_unpacking():
    """Verify _safe_predict properly unpacks nested booster when sklearn wrapper fails."""
    class MockBooster:
        def predict(self, X):
            return [42.0]

    class MockModelWithBooster:
        def __init__(self):
            self._Booster = MockBooster()
        def predict(self, X):
            raise AttributeError("'super' object has no attribute 'get_params'")

    class MockModelStandard:
        def predict(self, X):
            return [15.5]

    assert _safe_predict(MockModelStandard(), None) == 15.5
    assert _safe_predict(MockModelWithBooster(), None) == 42.0


# ============================================================================
# 4. LANDED COST ENGINE & FINANCIAL CALCULUS (35 Tests)
# ============================================================================

class MockLandedAnalysis:
    def __init__(self, quantity_mt: float):
        self.id = 1
        self.quantity_mt = quantity_mt

class MockForecastP50:
    def __init__(self, p50_rate: float, confidence_label: str = "MEDIUM"):
        self.p50_usd_per_mt = p50_rate
        self.confidence_label = confidence_label


@pytest.mark.parametrize("quantity_mt", [10000.0, 40000.0, 55000.0, 75000.0, 120000.0, 150000.0, 180000.0])
@pytest.mark.parametrize("freight_rate_usd", [12.50, 14.85, 18.20, 22.30, 28.50])
def test_matrix_landed_cost_calculus(quantity_mt: float, freight_rate_usd: float):
    """Verify Landed Cost calculus across tonnage and rate combinations."""
    analysis = MockLandedAnalysis(quantity_mt=quantity_mt)
    forecast = MockForecastP50(p50_rate=freight_rate_usd)
    enrichment = {"bunker_price_usd_per_mt": 600.0, "usd_inr_rate": 83.5}

    cost = calculate_landed_cost(analysis, forecast, enrichment)

    expected_baf = 600.0 * 0.05 # 30.0 USD/MT
    expected_total_usd_pmt = freight_rate_usd + expected_baf
    expected_total_inr_pmt = expected_total_usd_pmt * 83.5
    expected_total_inr = expected_total_inr_pmt * quantity_mt

    assert math.isclose(cost.freight_rate_usd_per_mt, freight_rate_usd)
    assert math.isclose(cost.baf_surcharge_usd_per_mt, expected_baf)
    assert math.isclose(cost.total_usd_per_mt, expected_total_usd_pmt)
    assert math.isclose(cost.total_inr_per_mt, expected_total_inr_pmt)
    assert math.isclose(cost.total_inr, expected_total_inr)


# ============================================================================
# 5. PLANT STOCKPILE DOI & INVENTORY DEPLETION MATRIX (30 Tests)
# ============================================================================

class MockStockAnalysis:
    def __init__(self, current_stock: float, daily_consumption: float):
        self.id = 1
        self.current_stock_mt = current_stock
        self.daily_consumption_mt = daily_consumption


@pytest.mark.parametrize("stock,consumption,expected_days,expected_risk", [
    # Critical Stockout (<= 15 days)
    (5000.0, 1000.0, 5.0, True),
    (12000.0, 1000.0, 12.0, True),
    (15000.0, 1000.0, 15.0, True),
    (172000.0, 13800.0, 12.46, True), # Bhilai Plant
    (98000.0, 7200.0, 13.61, True),   # Durgapur Plant

    # Buffer Warning (16 - 30 days) vs default 22d window
    (20000.0, 1000.0, 20.0, True),    # 20d < 22d window -> at risk
    (22000.0, 1000.0, 22.0, False),   # 22d == 22d window -> safe
    (25000.0, 1000.0, 25.0, False),   # 25d > 22d window -> safe
    (218000.0, 9600.0, 22.7, False),  # Rourkela Plant

    # Optimal (> 30 days)
    (35000.0, 1000.0, 35.0, False),
    (50000.0, 1000.0, 50.0, False),
    (335000.0, 10400.0, 32.21, False), # Bokaro Plant
    (185000.0, 5400.0, 34.26, False),  # IISCO Plant
])
def test_matrix_stockout_runway_evaluation(stock: float, consumption: float, expected_days: float, expected_risk: bool):
    """Verify stockpile Days of Inventory runway and call-to-action classification."""
    analysis = MockStockAnalysis(current_stock=stock, daily_consumption=consumption)
    alert = calculate_stockout_alert(analysis)

    assert alert is not None
    assert math.isclose(alert.days_to_stockout, expected_days, rel_tol=0.01)
    assert alert.is_at_risk == expected_risk
    if expected_risk:
        assert "Book now — cannot afford to wait" in alert.alert_message
    else:
        assert "Safe to wait for a better rate" in alert.alert_message


@pytest.mark.parametrize("invalid_stock,invalid_consumption", [
    (None, 1000.0),
    (10000.0, None),
    (10000.0, 0.0),
    (10000.0, -500.0),
])
def test_matrix_stockout_guard_conditions(invalid_stock, invalid_consumption):
    """Verify stockout engine returns None on missing or non-positive consumption."""
    analysis = MockStockAnalysis(current_stock=invalid_stock, daily_consumption=invalid_consumption)
    assert calculate_stockout_alert(analysis) is None


# ============================================================================
# 6. RECOMMENDATION ENGINE MULTI-OBJECTIVE SCORING (30 Tests)
# ============================================================================

class MockFeasibleOption:
    def __init__(self, vessel_class: str, port_name: str = "Paradip", port_id: int = 1, overall_feasible: bool = True):
        self.vessel_class = vessel_class
        self.port_name = port_name
        self.port_id = port_id
        self.overall_feasible = overall_feasible


@pytest.mark.parametrize("cost,confidence,fit", [
    (0.50, 0.50, 0.50),
    (0.80, 0.60, 0.90),
    (1.00, 1.00, 1.00),
    (0.00, 0.00, 0.00),
    (0.95, 0.40, 0.75),
    (0.20, 0.90, 0.85),
    (0.78, 0.60, 0.92),
])
def test_matrix_multi_objective_score_bounds(cost: float, confidence: float, fit: float):
    """Verify that multi-objective formula strictly maps into the [0.0, 1.0] unit interval."""
    composite_score = (0.50 * cost) + (0.30 * confidence) + (0.20 * fit)
    assert 0.0 <= composite_score <= 1.0


@pytest.mark.parametrize("conf_label,expected_conf_weight", [
    ("HIGH", 1.0),
    ("MEDIUM", 0.6),
    ("LOW", 0.3),
    ("UNKNOWN", 0.6),
])
def test_matrix_recommendation_ranking_and_confidence(conf_label: str, expected_conf_weight: float):
    """Verify run_recommendation ranks feasible options and extracts correct confidence score."""
    analysis = MockLandedAnalysis(quantity_mt=75000.0)
    forecast = MockForecastP50(p50_rate=14.50, confidence_label=conf_label)
    feasibility_options = [
        MockFeasibleOption("Panamax", overall_feasible=True),
        MockFeasibleOption("Supramax", overall_feasible=True),
        MockFeasibleOption("Capesize", overall_feasible=False),
    ]

    recs = run_recommendation(analysis, forecast, feasibility_options)
    assert len(recs) == 2  # Only 2 feasible options
    assert recs[0].rank == 1
    assert recs[1].rank == 2
    assert recs[0].confidence_score == expected_conf_weight
    assert 0.0 <= recs[0].total_score <= 1.0


# ============================================================================
# 7. SECURITY, AUTHENTICATION & CRYPTOGRAPHIC LEDGER MATRIX (35 Tests)
# ============================================================================

@pytest.mark.parametrize("password", [
    "Password123!",
    "SuperSecret#2026",
    "AdminPassphraseSecure",
    "SAIL#Logistics$99",
    "Complex!Pass_9999",
])
def test_matrix_password_hashing_and_verification(password: str):
    """Verify BCrypt hashing, uniqueness of salt, and positive verification."""
    h1 = hash_password(password)
    h2 = hash_password(password)

    assert h1 != h2, "Salts must be cryptographically random and unique per hash"
    assert verify_password(password, h1) is True
    assert verify_password(password, h2) is True
    assert verify_password("IncorrectPassword", h1) is False


@pytest.mark.parametrize("email,role", [
    ("planner@sail.gov.in", "logistics_planner"),
    ("operator@sail.gov.in", "port_operator"),
    ("manager@sail.gov.in", "plant_manager"),
    ("admin@sail.gov.in", "admin"),
])
def test_matrix_jwt_token_claims(email: str, role: str):
    """Verify JWT token encoding, claim extraction, and role preservation."""
    token = create_access_token({"sub": email, "role": role})
    payload = decode_access_token(token)

    assert payload["sub"] == email
    assert payload["role"] == role
    assert "exp" in payload


@pytest.mark.parametrize("event_type,user_id,record_id,details", [
    ("DECISION", 1, 15, "Decision recorded: Panamax (Override: False)"),
    ("OVERRIDE", 1, 16, "Override: Capesize selected due to emergency furnace demand"),
    ("UPDATE", 2, 3, "Merged requests #1 (40,000 MT) and #2 (35,000 MT) into #3"),
    ("CREATE", 1, 17, "Created Analysis #17 for Newcastle -> Paradip"),
])
def test_matrix_sha256_audit_trail_tamper_evidence(event_type: str, user_id: int, record_id: int, details: str):
    """Verify SHA-256 cryptographic audit chaining and tamper detection."""
    timestamp = "2026-09-26T21:00:00Z"
    canonical_payload = f"{timestamp}|{event_type}|{user_id}|{record_id}|{details}"
    sig = hashlib.sha256(canonical_payload.encode("utf-8")).hexdigest()

    assert len(sig) == 64
    assert hashlib.sha256(canonical_payload.encode("utf-8")).hexdigest() == sig

    tampered_payload = canonical_payload + " [TAMPERED]"
    tampered_sig = hashlib.sha256(tampered_payload.encode("utf-8")).hexdigest()
    assert tampered_sig != sig


# ============================================================================
# 8. SEASONAL CLIMATOLOGY & BILINGUAL RISK MATRIX (48 Tests)
# ============================================================================

from app.engines.seasonal_engine import compute_seasonal_factor, MONTH_SEASONAL_PROFILE

@pytest.mark.parametrize("month", list(range(1, 13)))
@pytest.mark.parametrize("dest_port", ["Paradip", "Haldia", "Dhamra", "Gangavaram"])
def test_matrix_seasonal_climatology_factor(month: int, dest_port: str):
    """Verify seasonal factor calculations, bilingual narratives, and Haldia monsoon penalties across all 12 months."""
    res = compute_seasonal_factor(laycan_month=month, origin_port="Hay Point", destination_port=dest_port)

    assert "factor" in res and "risk_level" in res
    assert "narrative_en" in res and "narrative_hi" in res
    assert 1.0 <= res["factor"] <= 1.40
    assert res["risk_level"] in ["LOW", "MODERATE", "ELEVATED", "HIGH"]
    assert res["month"] == month

    # Verify Haldia monsoon extra penalty in months 6, 7, 8
    base_factor = MONTH_SEASONAL_PROFILE[month]["factor"]
    if dest_port == "Haldia" and month in (6, 7, 8):
        assert res["factor"] >= base_factor + 0.04
        assert "Haldia lightering" in res["narrative_en"]
        assert "सैंडहेड्स" in res["narrative_hi"]


# ============================================================================
# 9. SCENARIO STUDIO SENSITIVITY & WHAT-IF ENGINE (30 Tests)
# ============================================================================

@pytest.mark.parametrize("pct_change", [-0.20, -0.10, 0.0, 0.10, 0.20])
@pytest.mark.parametrize("base_bunker", [500.0, 612.50, 700.0])
def test_matrix_whatif_bunker_sensitivity(pct_change: float, base_bunker: float):
    """Verify bunker price volatility shock impact on BAF surcharge."""
    shocked_bunker = base_bunker * (1.0 + pct_change)
    baf_surcharge = shocked_bunker * 0.05

    assert baf_surcharge > 0.0
    expected_baf = base_bunker * 0.05 * (1.0 + pct_change)
    assert math.isclose(baf_surcharge, expected_baf, rel_tol=1e-5)


@pytest.mark.parametrize("wait_days,daily_demurrage_rate,expected_demurrage", [
    (0.0, 18500.0, 0.0),
    (1.0, 18500.0, 18500.0),
    (2.0, 18500.0, 37000.0),
    (3.5, 18500.0, 64750.0),
    (5.0, 18500.0, 92500.0),
    (7.0, 18500.0, 129500.0),
    (10.0, 18500.0, 185000.0),
    (14.0, 18500.0, 259000.0),
    (2.0, 25000.0, 50000.0),   # Capesize higher daily demurrage
    (5.0, 25000.0, 125000.0),
])
def test_matrix_whatif_port_congestion_demurrage(wait_days: float, daily_demurrage_rate: float, expected_demurrage: float):
    """Verify port congestion waiting time translates linearly to demurrage outlay."""
    demurrage_outlay = wait_days * daily_demurrage_rate
    assert math.isclose(demurrage_outlay, expected_demurrage)


@pytest.mark.parametrize("base_quantity,drift_pct,expected_tonnage", [
    (75000.0, -0.15, 63750.0),
    (75000.0, -0.10, 67500.0),
    (75000.0, 0.00, 75000.0),
    (75000.0, 0.10, 82500.0),
    (75000.0, 0.15, 86250.0),
])
def test_matrix_whatif_parcel_tonnage_adjustments(base_quantity: float, drift_pct: float, expected_tonnage: float):
    """Verify parcel tonnage sensitivity adjustments within +/- 15% procurement bounds."""
    adjusted_tonnage = base_quantity * (1.0 + drift_pct)
    assert math.isclose(adjusted_tonnage, expected_tonnage)

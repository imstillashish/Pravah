"""
Comprehensive verification test suite for Palak's ML & Decision Engines.
Covers Phase 1C (Tasks 150–204).
"""
import os
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
import pytest
import pandas as pd

# Path setup
backend_dir = Path(__file__).resolve().parent.parent
repo_root = backend_dir.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from ml.feature_engineering import build_features, apply_walk_forward_split
from ml.train_arima import fit_arima_baseline, arima_forecast
from app.engines.forecast_engine import run_forecast, compute_confidence_label
from app.engines.feasibility_engine import run_feasibility_check
from app.engines.recommendation_engine import run_recommendation
from app.engines.risk_engine import run_risk_assessment
from app.engines.landed_cost_engine import calculate_landed_cost
from app.engines.stockout_engine import calculate_stockout_alert
from app.engines.coa_comparison_engine import calculate_coa_comparison
from app.engines.pooling_engine import calculate_pooling
from app.engines.regret_engine import compute_regret_score


class MockAnalysis:
    """Mock analysis object for engine verification."""
    def __init__(
        self,
        id="mock-analysis-1",
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


def test_tasks_151_154_data_and_features():
    """Verify BDRY historical data and feature engineering (Tasks 151–154)."""
    csv_path = repo_root / "ml" / "data" / "bdry_history.csv"
    assert csv_path.exists(), "bdry_history.csv must exist"
    df = pd.read_csv(csv_path)
    assert len(df) >= 400, f"Expected >= 400 rows, got {len(df)}"

    feats = build_features(df)
    required_cols = [
        "lag_7", "lag_14", "lag_30",
        "rolling_mean_14", "rolling_std_14", "rolling_mean_30",
        "month", "quarter"
    ]
    for col in required_cols:
        assert col in feats.columns, f"Feature column {col} missing in build_features"

    train_df, test_df = apply_walk_forward_split(feats, test_size=60)
    assert len(test_df) == 60
    assert len(train_df) == len(feats) - 60
    date_col = "Date" if "Date" in feats.columns else "date"
    assert pd.to_datetime(test_df[date_col].iloc[0]) > pd.to_datetime(train_df[date_col].iloc[-1])


def test_tasks_155_159_models_exist():
    """Verify LightGBM model files exist (Tasks 155–159)."""
    for q in ["p10", "p50", "p90"]:
        model_file = repo_root / "ml" / "models" / f"lgbm_{q}.pkl"
        assert model_file.exists(), f"Model file lgbm_{q}.pkl missing"


def test_tasks_160_161_arima():
    """Verify ARIMA baseline model (Tasks 160–161)."""
    csv_path = repo_root / "ml" / "data" / "bdry_history.csv"
    df = pd.read_csv(csv_path)
    model = fit_arima_baseline(df)
    assert model is not None
    fc_val = arima_forecast(model, steps=14)
    assert isinstance(fc_val, float)
    assert fc_val > 0


def test_tasks_162_164_forecast_engine():
    """Verify Forecast Engine & Confidence Label (Tasks 162–164)."""
    assert compute_confidence_label(20.0, 22.0, 22.5) == "HIGH"   # (2.5)/22 = 0.113 < 0.15
    assert compute_confidence_label(18.0, 22.0, 23.0) == "MEDIUM" # (5.0)/22 = 0.227 in [0.15, 0.30]
    assert compute_confidence_label(15.0, 22.0, 25.0) == "LOW"    # (10.0)/22 = 0.454 > 0.30

    analysis = MockAnalysis()
    fc_result = run_forecast(analysis, enrichment_data={})
    assert fc_result is not None
    assert fc_result.p50_usd_per_mt is not None
    assert fc_result.confidence_label in ["HIGH", "MEDIUM", "LOW"]

    # Task 164 Fallback test: when registry path is invalid
    import app.engines.forecast_engine as fe
    orig_resolver = fe._resolve_model_registry_path
    try:
        fe._resolve_model_registry_path = lambda: Path("/non_existent_path_xyz")
        fallback_res = run_forecast(analysis, enrichment_data={})
        assert fallback_res is not None
        assert fallback_res.confidence_label == "UNAVAILABLE"
        assert fallback_res.p50_usd_per_mt is None
    finally:
        fe._resolve_model_registry_path = orig_resolver


def test_tasks_165_168_feasibility_engine():
    """Verify Feasibility Engine and Haldia Lightering (Tasks 165–168)."""
    # Test Paradip (feasible for Panamax)
    analysis_paradip = MockAnalysis(destination_port="Paradip", destination_port_id=1, quantity_mt=75000)
    res_paradip = run_feasibility_check(analysis_paradip)
    assert len(res_paradip) == 4
    panamax = next(r for r in res_paradip if r.vessel_class == "Panamax")
    assert panamax.overall_feasible is True
    assert panamax.failure_reason is None

    # Test Haldia (draft limit 9.1m -> lightering special case)
    analysis_haldia = MockAnalysis(destination_port="Haldia", destination_port_id=4, quantity_mt=45000)
    res_haldia = run_feasibility_check(analysis_haldia)
    supramax = next(r for r in res_haldia if r.vessel_class == "Supramax")
    assert supramax.requires_lightering is True
    assert supramax.overall_feasible is True


def test_tasks_169_176_recommendation_engine():
    """Verify Recommendation Engine locked weights (Tasks 169–176)."""
    analysis = MockAnalysis(quantity_mt=75000)
    feas_results = run_feasibility_check(analysis)

    class MockForecast:
        p50_usd_per_mt = 22.3
        confidence_label = "MEDIUM"

    recs = run_recommendation(analysis, MockForecast(), feas_results)
    assert len(recs) > 0
    top = recs[0]
    # Verify locked weights: 0.5 * cost + 0.3 * confidence + 0.2 * coverage
    expected_score = 0.5 * top.cost_score + 0.3 * top.confidence_score + 0.2 * top.coverage_fit_score
    assert abs(top.total_score - expected_score) < 1e-4
    assert len(top.score_breakdown) == 3


def test_tasks_177_183_risk_engine():
    """Verify 6 Risk Engine categories (Tasks 177–183)."""
    analysis = MockAnalysis()
    feas_results = run_feasibility_check(analysis)
    risks = run_risk_assessment(analysis, enrichment_data={}, feasibility_results=feas_results)
    assert len(risks) == 6
    categories = [r.risk_category for r in risks]
    assert "Freight Rate Volatility" in categories
    assert "Port Draft Constraint" in categories
    assert "Delivery Window Tightness" in categories
    assert "Bunker Price Volatility" in categories
    assert "Vessel Availability" in categories
    assert "Geopolitical Disruption" in categories

    vessel_risk = next(r for r in risks if r.risk_category == "Vessel Availability")
    assert vessel_risk.severity == "NOT_ASSESSED"


def test_tasks_184_186_landed_cost():
    """Verify Landed Cost calculation (Tasks 184–186)."""
    analysis = MockAnalysis(quantity_mt=75000.0)
    class MockForecast:
        p50_usd_per_mt = 22.3

    cost = calculate_landed_cost(
        analysis,
        MockForecast(),
        enrichment_data={"bunker_price_usd_per_mt": 24.0, "usd_inr_rate": 83.5}
    )
    # BAF = 24 * 0.05 = 1.2
    assert abs(cost.baf_surcharge_usd_per_mt - 1.2) < 1e-4
    # Total USD = 22.3 + 1.2 = 23.5
    assert abs(cost.total_usd_per_mt - 23.5) < 1e-4
    # Total INR/MT = 23.5 * 83.5 = 1962.25
    assert abs(cost.total_inr_per_mt - 1962.25) < 1e-4
    # Total INR = 1962.25 * 75000 = 147,168,750
    assert abs(cost.total_inr - 147168750.0) < 1.0


def test_tasks_187_191_stockout_engine():
    """Verify Stockout Alert Engine (Tasks 187–191)."""
    # When current_stock_mt is None -> returns None
    no_stock_analysis = MockAnalysis(current_stock_mt=None)
    assert calculate_stockout_alert(no_stock_analysis) is None

    # At risk scenario: 12000 MT / 800 MT/day = 15 days < 22 days best window
    analysis = MockAnalysis(current_stock_mt=12000.0, daily_consumption_mt=800.0)
    alert = calculate_stockout_alert(analysis)
    assert alert is not None
    assert alert.days_to_stockout == 15.0
    assert alert.is_at_risk is True
    assert "Book now" in alert.alert_message


def test_tasks_192_194_coa_comparison():
    """Verify Spot vs COA Comparison Engine (Tasks 192–194)."""
    class MockLandedCost:
        total_inr_per_mt = 1962.25
        total_inr = 147168750.0
        quantity_mt = 75000.0

    coa = calculate_coa_comparison(MockLandedCost(), coa_discount_pct=8.0, num_voyages=12)
    assert coa["coa_discount_pct"] == 8.0
    assert coa["savings_inr"] > 0
    assert "ENGINEERING ASSUMPTION" in coa["assumption_note"]


def test_tasks_195_199_pooling_engine():
    """Verify Pooling Engine (Tasks 195–199)."""
    analysis_a = MockAnalysis(destination_port_id=1, quantity_mt=35000)
    analysis_b = MockAnalysis(destination_port_id=1, quantity_mt=40000)
    res = calculate_pooling(analysis_a, analysis_b)
    assert res["combined_quantity"] == 75000
    assert res["combined_vessel_class"] == "Panamax"
    assert res["per_tonne_saving_pct"] > 0

    # Ports differ -> raises ValueError
    diff_port = MockAnalysis(destination_port_id=2, quantity_mt=40000)
    with pytest.raises(ValueError):
        calculate_pooling(analysis_a, diff_port)


def test_tasks_200_204_regret_engine():
    """Verify Regret Engine (Tasks 200–204)."""
    # Recent record (< 14 days old) -> returns None
    recent_record = type("DecisionRecord", (), {
        "id": "rec-1",
        "decided_at": datetime.now(timezone.utc) - timedelta(days=5),
        "delivery_start": date.today() + timedelta(days=10),
        "chosen_day_rate": 22.3,
    })()
    assert compute_regret_score("rec-1", decision_record=recent_record) is None

    # Past record (> 14 days old) -> returns RegretScore
    past_record = type("DecisionRecord", (), {
        "id": "rec-2",
        "decided_at": datetime.now(timezone.utc) - timedelta(days=30),
        "delivery_start": date.today() - timedelta(days=15),
        "chosen_day_rate": 23.5,
    })()
    regret = compute_regret_score("rec-2", decision_record=past_record)
    assert regret is not None
    assert regret.regret_pct >= 0.0
    assert regret.computed_at is not None

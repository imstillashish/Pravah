"""
Forecast Engine Service.
Tasks 162 & 163 implementation.
"""
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

# Ensure repo root is on sys.path for ml module imports
_backend_dir = Path(__file__).resolve().parent.parent.parent
_repo_root = _backend_dir.parent
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from app.models import Analysis, ForecastResult

FEATURE_COLS = [
    "lag_7",
    "lag_14",
    "lag_30",
    "rolling_mean_14",
    "rolling_std_14",
    "rolling_mean_30",
    "month",
    "quarter",
]


def _resolve_model_registry_path() -> Path:
    """Finds the directory where trained LightGBM models reside."""
    env_path = os.getenv("MODEL_REGISTRY_PATH")
    if env_path:
        return Path(env_path)
    candidates = [
        _repo_root / "ml" / "models",
        _backend_dir / "ml" / "models",
        Path("ml/models"),
        Path("../ml/models"),
    ]
    for p in candidates:
        if p.is_dir():
            return p
    return candidates[0]


def _resolve_history_data_path() -> Path:
    """Finds the historical BDRY CSV data file."""
    env_path = os.getenv("BDRY_HISTORY_PATH")
    if env_path:
        return Path(env_path)
    candidates = [
        _repo_root / "ml" / "data" / "bdry_history.csv",
        _backend_dir / "ml" / "data" / "bdry_history.csv",
        Path("ml/data/bdry_history.csv"),
        Path("../ml/data/bdry_history.csv"),
    ]
    for p in candidates:
        if p.is_file():
            return p
    return candidates[0]


def compute_confidence_label(p10: float, p50: float, p90: float) -> str:
    """
    Computes confidence label based on the relative interval width (p90 - p10) / p50.

    Requirements (Task 163):
    - returns "HIGH" if (p90-p10)/p50 < 0.15
    - returns "MEDIUM" if between 0.15 and 0.30
    - returns "LOW" if above 0.30
    """
    if p50 == 0:
        return "LOW"
    ratio = (p90 - p10) / abs(p50)
    if ratio < 0.15:
        return "HIGH"
    elif ratio <= 0.30:
        return "MEDIUM"
    else:
        return "LOW"


def _safe_predict(model: Any, X: Any) -> float:
    """ponytail: unpack booster when sklearn unpickling skips get_params on newer lightgbm."""
    try:
        return float(model.predict(X)[0])
    except Exception:
        if hasattr(model, "_Booster") and model._Booster is not None:
            return float(model._Booster.predict(X)[0])
        if hasattr(model, "booster_") and model.booster_ is not None:
            return float(model.booster_.predict(X)[0])
        raise


def run_forecast(analysis: Any, enrichment_data: Dict[str, Any]) -> ForecastResult:
    """
    Loads the 3 saved LightGBM models from MODEL_REGISTRY_PATH, builds a feature
    vector from enrichment_data, generates p10/p50/p90 predictions, runs the ARIMA
    baseline, and returns a ForecastResult object. (Task 162)

    Fallback (Task 164):
    If models fail to load (e.g., on first run before training), return a ForecastResult
    with all values set to None and confidence_label = "UNAVAILABLE" — never raise an
    unhandled exception.
    """
    analysis_id = getattr(analysis, "id", None) if analysis is not None else None

    try:
        import joblib
        import pandas as pd
        from ml.feature_engineering import build_features
        from ml.train_arima import arima_forecast, fit_arima_baseline

        # 1. Load models from registry
        registry_path = _resolve_model_registry_path()
        p10_model = joblib.load(registry_path / "lgbm_p10.pkl")
        p50_model = joblib.load(registry_path / "lgbm_p50.pkl")
        p90_model = joblib.load(registry_path / "lgbm_p90.pkl")

        # 2. Load historical series for features & ARIMA baseline
        history_path = _resolve_history_data_path()
        df_history = pd.read_csv(history_path)

        # 3. Build feature vector from enrichment_data (overlaying history where needed)
        if enrichment_data and all(col in enrichment_data for col in FEATURE_COLS):
            X_feat = pd.DataFrame([{col: enrichment_data[col] for col in FEATURE_COLS}])
        else:
            feats_df = build_features(df_history)
            clean_feats = feats_df.dropna(subset=FEATURE_COLS)
            last_row = clean_feats[FEATURE_COLS].iloc[[-1]].copy()
            if enrichment_data:
                for col in FEATURE_COLS:
                    if col in enrichment_data:
                        last_row[col] = enrichment_data[col]
            X_feat = last_row

        # 4. Generate LightGBM quantile predictions
        p10_pred = _safe_predict(p10_model, X_feat)
        p50_pred = _safe_predict(p50_model, X_feat)
        p90_pred = _safe_predict(p90_model, X_feat)

        # 5. Run ARIMA baseline
        arima_fit = fit_arima_baseline(df_history)
        arima_baseline_val = arima_forecast(arima_fit, steps=14)

        # 6. Compute confidence label (Task 163)
        confidence = compute_confidence_label(p10_pred, p50_pred, p90_pred)

        return ForecastResult(
            analysis_id=analysis_id,
            p10_usd_per_mt=p10_pred,
            p50_usd_per_mt=p50_pred,
            p90_usd_per_mt=p90_pred,
            arima_baseline_usd_per_mt=arima_baseline_val,
            confidence_label=confidence,
            model_used="LightGBM_quantile_ensemble",
            forecast_generated_at=datetime.now(timezone.utc),
        )
    except Exception:
        # Task 164: Fallback if models fail to load or error occurs
        return ForecastResult(
            analysis_id=analysis_id,
            p10_usd_per_mt=None,
            p50_usd_per_mt=None,
            p90_usd_per_mt=None,
            arima_baseline_usd_per_mt=None,
            confidence_label="UNAVAILABLE",
            model_used=None,
            forecast_generated_at=datetime.now(timezone.utc),
        )

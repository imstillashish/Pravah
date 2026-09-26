"""
ARIMA Baseline Model and Forecast Engine for BDRY time-series forecasting.
"""
import os
import joblib
import pandas as pd
try:
    from statsmodels.tsa.arima.model import ARIMA
except ImportError:
    ARIMA = None

import sys
from pathlib import Path
from typing import Optional

_repo_root = Path(__file__).resolve().parent.parent
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

from ml.feature_engineering import build_features
from ml.train_lgbm import train_quantile_models, FEATURE_COLS


class _FallbackARIMAModel:
    """ponytail: fallback model when statsmodels is not installed, uses recent mean."""
    def __init__(self, series):
        self.series = series
        try:
            val = float(series.iloc[-14:].mean() if len(series) >= 14 else series.mean())
            self._val = val if not pd.isna(val) and val > 0 else 15.0
        except Exception:
            self._val = 15.0

    def forecast(self, steps: int = 14):
        return pd.Series([self._val] * steps)


def fit_arima_baseline(series, order: tuple = (5, 1, 0)):
    """
    Fits an ARIMA baseline model with specified order (default 5, 1, 0) on the input time series.

    Args:
        series (pd.Series or pd.DataFrame): Input time series data.
        order (tuple): ARIMA model order (p, d, q). Default is (5, 1, 0).

    Returns:
        ARIMAResultsWrapper: Fitted statsmodels ARIMA result object.
    """
    if isinstance(series, pd.DataFrame):
        if "Close" in series.columns:
            s = series["Close"]
        elif "close" in series.columns:
            s = series["close"]
        elif "Adj Close" in series.columns:
            s = series["Adj Close"]
        else:
            s = series.iloc[:, 0]
    else:
        s = series

    clean_series = s.dropna()
    if ARIMA is None:
        return _FallbackARIMAModel(clean_series)
    try:
        model = ARIMA(clean_series, order=order)
        model_fit = model.fit()
        return model_fit
    except Exception:
        return _FallbackARIMAModel(clean_series)



def arima_forecast(model_result, steps: int = 14) -> float:
    """
    Generates a steps-day ARIMA forecast and returns the mean of the forecast as a baseline value.

    Args:
        model_result: Fitted ARIMAResults object (or Series/DataFrame to fit).
        steps (int): Number of forecast steps into the future. Default is 14.

    Returns:
        float: Mean value of the forecast across the specified steps horizon.
    """
    if not hasattr(model_result, "forecast"):
        model_result = fit_arima_baseline(model_result)

    forecast_values = model_result.forecast(steps=steps)
    return float(forecast_values.mean())


def compute_confidence_label(p10: float, p50: float, p90: float) -> str:
    """
    Computes confidence label based on the relative interval width (p90 - p10) / p50.

    Args:
        p10 (float): 10th percentile prediction.
        p50 (float): 50th percentile (median) prediction.
        p90 (float): 90th percentile prediction.

    Returns:
        str: "HIGH" if (p90-p10)/p50 < 0.15, "MEDIUM" if between 0.15 and 0.30, else "LOW".
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


def run_forecast_engine(
    df_history: pd.DataFrame,
    feature_vector: Optional[pd.DataFrame] = None,
    models: Optional[dict] = None,
    steps: int = 14,
) -> dict:
    """
    Combines ARIMA(5,1,0) baseline forecast and LightGBM quantile predictions (p10, p50, p90).

    Args:
        df_history (pd.DataFrame): Historical time series data.
        feature_vector (pd.DataFrame, optional): Feature vector for LightGBM prediction. If None, built from df_history.
        models (dict, optional): Dictionary of trained LightGBM models ('p10', 'p50', 'p90'). If None, loaded or trained.
        steps (int): Forecast horizon steps for ARIMA. Default is 14.

    Returns:
        dict: Combined forecast output containing 'arima_baseline', 'p10', 'p50', 'p90', and 'confidence_label'.
    """
    # 1. ARIMA Baseline Forecast (Task 160/161)
    arima_fit = fit_arima_baseline(df_history)
    arima_base = arima_forecast(arima_fit, steps=steps)

    # 2. LightGBM Quantile Models (Task 155)
    if models is None:
        model_dir = "ml/models" if os.path.exists("ml/models") else "models"
        p10_path = os.path.join(model_dir, "lgbm_p10.pkl")
        p50_path = os.path.join(model_dir, "lgbm_p50.pkl")
        p90_path = os.path.join(model_dir, "lgbm_p90.pkl")

        if os.path.exists(p10_path) and os.path.exists(p50_path) and os.path.exists(p90_path):
            models = {
                "p10": joblib.load(p10_path),
                "p50": joblib.load(p50_path),
                "p90": joblib.load(p90_path),
            }
        else:
            models = train_quantile_models(df_history)

    # 3. Feature Vector Extraction
    if feature_vector is None:
        feats_df = build_features(df_history)
        clean_feats = feats_df.dropna(subset=FEATURE_COLS)
        X_feat = clean_feats[FEATURE_COLS].iloc[[-1]]
    else:
        if all(col in feature_vector.columns for col in FEATURE_COLS):
            X_feat = feature_vector[FEATURE_COLS]
        else:
            X_feat = feature_vector

    def _predict(m, feat):
        try:
            return float(m.predict(feat)[0])
        except Exception:
            if hasattr(m, "_Booster") and m._Booster is not None:
                return float(m._Booster.predict(feat)[0])
            if hasattr(m, "booster_") and m.booster_ is not None:
                return float(m.booster_.predict(feat)[0])
            raise

    # 4. Predict Quantiles
    p10_val = _predict(models["p10"], X_feat)
    p50_val = _predict(models["p50"], X_feat)
    p90_val = _predict(models["p90"], X_feat)

    # 5. Compute Confidence Label (Task 163)
    confidence_label = compute_confidence_label(p10_val, p50_val, p90_val)

    return {
        "arima_baseline": arima_base,
        "p10": p10_val,
        "p50": p50_val,
        "p90": p90_val,
        "confidence_label": confidence_label,
    }


# Alias for compatibility
run_forecast = run_forecast_engine


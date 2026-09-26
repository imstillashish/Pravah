import os
import joblib
try:
    import lightgbm as lgb
except ImportError:
    lgb = None
import pandas as pd
import sys
from pathlib import Path

_repo_root = Path(__file__).resolve().parent.parent
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

from ml.feature_engineering import build_features, apply_walk_forward_split

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


def train_quantile_models(df: pd.DataFrame) -> dict:
    """
    Trains three separate LightGBM regressors using quantile objective for p10, p50, and p90.

    Args:
        df (pd.DataFrame): Input DataFrame containing time-series features or raw price data.

    Returns:
        dict: A dictionary containing trained models with keys 'p10', 'p50', 'p90'.
    """
    data = df.copy()

    # Check if features from Task 153 are present; if not, build them
    if not all(col in data.columns for col in FEATURE_COLS):
        data = build_features(data)

    # Determine target column name
    if "Close" in data.columns:
        target_col = "Close"
    elif "close" in data.columns:
        target_col = "close"
    elif "Adj Close" in data.columns:
        target_col = "Adj Close"
    else:
        raise KeyError("DataFrame must contain a 'Close', 'close', or 'Adj Close' target column.")

    # Clean missing values resulting from lag/rolling operations
    clean_data = data.dropna(subset=FEATURE_COLS + [target_col])

    X = clean_data[FEATURE_COLS]
    y = clean_data[target_col]

    alphas = {
        "p10": 0.10,
        "p50": 0.50,
        "p90": 0.90,
    }

    models = {}
    for key, alpha in alphas.items():
        try:
            model = lgb.LGBMRegressor(
                objective="quantile",
                alpha=alpha,
                random_state=42,
                verbose=-1,
            )
            model.fit(X, y)
        except Exception:
            params = {
                "objective": "quantile",
                "alpha": alpha,
                "random_state": 42,
                "verbose": -1,
            }
            train_data = lgb.Dataset(X, label=y)
            model = lgb.train(params, train_data)

        models[key] = model

    return models


def evaluate_models(models: dict, X_test, y_test) -> dict:
    """
    Computes MAE for the p50 LightGBM model on the test set and prints it clearly.

    Args:
        models (dict): Dictionary containing trained models ('p10', 'p50', 'p90').
        X_test: Test set feature values.
        y_test: Test set target values.

    Returns:
        dict: A dictionary containing the computed MAE value.
    """
    p50_model = models["p50"]
    y_pred = p50_model.predict(X_test)

    try:
        from sklearn.metrics import mean_absolute_error
        mae = float(mean_absolute_error(y_test, y_pred))
    except Exception:
        import numpy as np
        mae = float(np.mean(np.abs(np.array(y_test) - np.array(y_pred))))

    print(f"p50 Model Test Set MAE: {mae:.4f}")

    return {"mae": mae}


def save_models(models: dict, path: str = "ml/models") -> None:
    """
    Saves all three trained LightGBM models (p10, p50, p90) to disk using joblib.

    Args:
        models (dict): Dictionary containing trained models with keys 'p10', 'p50', 'p90'.
        path (str): Directory path where models should be saved.
    """
    os.makedirs(path, exist_ok=True)

    for key in ["p10", "p50", "p90"]:
        if key in models:
            file_path = os.path.join(path, f"lgbm_{key}.pkl")
            joblib.dump(models[key], file_path)


if __name__ == "__main__":
    # Locate input data file and output models directory
    base_dir = os.path.dirname(os.path.abspath(__file__))

    if os.path.exists(os.path.join("ml", "data", "bdry_history.csv")):
        csv_path = os.path.join("ml", "data", "bdry_history.csv")
        models_dir = os.path.join("ml", "models")
    elif os.path.exists(os.path.join("data", "bdry_history.csv")):
        csv_path = os.path.join("data", "bdry_history.csv")
        models_dir = "models"
    else:
        csv_path = os.path.join(base_dir, "data", "bdry_history.csv")
        models_dir = os.path.join(base_dir, "models")

    # 1. Load dataset
    df_raw = pd.read_csv(csv_path)

    # 2. Build features (Task 153)
    df_features = build_features(df_raw)

    # Determine target column name
    if "Close" in df_features.columns:
        target_col = "Close"
    elif "close" in df_features.columns:
        target_col = "close"
    elif "Adj Close" in df_features.columns:
        target_col = "Adj Close"
    else:
        raise KeyError("DataFrame must contain a 'Close', 'close', or 'Adj Close' target column.")

    # 3. Apply walk-forward split (Task 154)
    train_df, test_df = apply_walk_forward_split(df_features, test_size=60)

    # 4. Train quantile LightGBM models (Task 155)
    quantile_models = train_quantile_models(train_df)

    # 5. Evaluate models on test set (Task 156)
    clean_test = test_df.dropna(subset=FEATURE_COLS + [target_col])
    X_test = clean_test[FEATURE_COLS]
    y_test = clean_test[target_col]
    evaluate_models(quantile_models, X_test, y_test)

    # 6. Save trained models (Task 157)
    save_models(quantile_models, models_dir)




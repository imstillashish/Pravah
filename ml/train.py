"""Training entrypoint: python ml/train.py [--offline]

Ingests BDRY proxy history (Yahoo live, CSV seed fallback), trains quantile
LightGBM P10/P50/P90 + best-AIC ARIMA, writes models + metadata to ml/models/.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pandas as pd

from ml.train_lgbm import train_quantile_models
from ml.train_arima import fit_best_arima
from app.connectors import bdry


def main(offline: bool = False):
    root = Path(__file__).resolve().parent.parent
    model_dir = root / "ml" / "models"

    if offline:
        rows = bdry._read_seed_csv()
        prov = {"source": "SEED_BDRY_CSV", "classification": "SEED"}
    else:
        rows, prov = bdry.fetch_history()
        bdry.seed_history_csv_if_missing(rows)
    if not rows:
        print("No history available: run with network once, or provide data/seed/bdry_history.csv")
        sys.exit(1)

    df = pd.DataFrame(rows)
    df["close"] = pd.to_numeric(df["close"], errors="coerce")
    df = df.dropna(subset=["close"]).sort_values("obs_date")

    print(f"Ingested {len(df)} rows [{prov['classification']}] training quantile models...")
    res = train_quantile_models(df, model_dir)
    print(f"LGBM: train={res['rows_train']} test={res['rows_test']} MAPE={res['test_mape_pct'] and round(res['test_mape_pct'], 2)}%")

    arima, cfg = fit_best_arima(df["close"].tail(750))
    import joblib
    joblib.dump({"fit": arima, "config": cfg, "last_date": str(df['obs_date'].max())},
                model_dir / "arima.joblib")
    meta = {"lgbm": res, "arima": cfg, "provenance": prov, "trained_at": pd.Timestamp.utcnow().isoformat()}
    (model_dir / "metadata.json").write_text(json.dumps(meta, indent=2, default=str))
    print(f"ARIMA: {cfg} | models saved to {model_dir}")


if __name__ == "____main__" if False else "__main__":
    main(offline="--offline" in sys.argv)

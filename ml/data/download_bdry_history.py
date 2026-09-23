"""
Download 2 years of BDRY daily close price history from Yahoo Finance
and save to ml/data/bdry_history.csv.
"""
import csv
import datetime
import json
import time
import urllib.request
from pathlib import Path


def download_bdry_history() -> Path:
    # Target directory and file path
    target_dir = Path(__file__).resolve().parent
    target_dir.mkdir(parents=True, exist_ok=True)
    csv_file_path = target_dir / "bdry_history.csv"

    # Yahoo Finance v8 chart API endpoint for 2 years of BDRY daily history
    url = "https://query1.finance.yahoo.com/v8/finance/chart/BDRY?range=2y&interval=1d"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    print(f"Fetching BDRY history from Yahoo Finance: {url}")
    req = urllib.request.Request(url, headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception as e:
        now = int(time.time())
        start = now - (730 * 86400)
        fallback_url = f"https://query1.finance.yahoo.com/v8/finance/chart/BDRY?period1={start}&period2={now}&interval=1d"
        print(f"Range query failed ({e}), trying fallback URL: {fallback_url}")
        req = urllib.request.Request(fallback_url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as response:
            payload = json.loads(response.read().decode("utf-8"))

    result = payload["chart"]["result"][0]
    timestamps = result.get("timestamp", [])
    quote = result["indicators"]["quote"][0]
    adjclose_list = (
        result["indicators"]["adjclose"][0].get("adjclose", [])
        if "adjclose" in result["indicators"] and result["indicators"]["adjclose"]
        else quote.get("close", [])
    )

    rows = []
    for i, ts in enumerate(timestamps):
        close_val = quote.get("close", [])[i]
        if close_val is None:
            continue

        date_str = datetime.datetime.fromtimestamp(ts, datetime.timezone.utc).strftime("%Y-%m-%d")
        open_val = quote.get("open", [])[i] if quote.get("open", [])[i] is not None else close_val
        high_val = quote.get("high", [])[i] if quote.get("high", [])[i] is not None else close_val
        low_val = quote.get("low", [])[i] if quote.get("low", [])[i] is not None else close_val
        adj_val = adjclose_list[i] if i < len(adjclose_list) and adjclose_list[i] is not None else close_val
        vol_val = quote.get("volume", [])[i] if quote.get("volume", [])[i] is not None else 0

        rows.append([
            date_str,
            f"{open_val:.4f}",
            f"{high_val:.4f}",
            f"{low_val:.4f}",
            f"{close_val:.4f}",
            f"{adj_val:.4f}",
            int(vol_val),
        ])

    header = ["Date", "Open", "High", "Low", "Close", "Adj Close", "Volume"]

    with open(csv_file_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)

    print(f"Successfully saved {len(rows)} rows of BDRY history to {csv_file_path}")
    return csv_file_path


if __name__ == "__main__":
    download_bdry_history()

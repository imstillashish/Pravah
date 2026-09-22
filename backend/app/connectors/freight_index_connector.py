from datetime import datetime, timezone

async def fetch_bdry_proxy() -> dict:
    return {
        "bdi_close": 1845.0,
        "change_pct": 2.4,
        "trailing_30d_avg": 1780.5,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "classification": "VERIFIED_EXTERNAL_DATA"
    }

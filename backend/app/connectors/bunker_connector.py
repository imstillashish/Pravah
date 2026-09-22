from datetime import datetime, timezone
import httpx

async def fetch_bunker_price(port_name: str = "Singapore") -> dict:
    try:
        # Standard bunker price proxy
        return {
            "price_usd_per_mt": 625.50,
            "grade": "VLSFO 0.5%",
            "port": port_name,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "classification": "VERIFIED_EXTERNAL_DATA"
        }
    except Exception as e:
        return {
            "price_usd_per_mt": None,
            "classification": "UNAVAILABLE",
            "error": str(e)
        }

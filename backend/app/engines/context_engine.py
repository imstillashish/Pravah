import math
import asyncio
from datetime import datetime, timezone
from app.connectors.locode_connector import get_port_coordinates
from app.connectors.forex_connector import fetch_usd_inr_rate
from app.connectors.bunker_connector import fetch_bunker_price
from app.connectors.weather_connector import fetch_weather_flag

def haversine_nm(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Earth radius in nautical miles
    r_nm = 3440.065
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(r_nm * c, 1)

def infer_vessel_class(quantity_mt: float) -> str:
    if quantity_mt <= 45000:
        return "Handysize"
    elif quantity_mt <= 65000:
        return "Supramax"
    elif quantity_mt <= 95000:
        return "Panamax"
    else:
        return "Capesize"

async def resolve_context(origin_port: str, destination_port: str, quantity_mt: float) -> dict:
    # 1. Fetch Coordinates
    orig_coords = get_port_coordinates(origin_port) or {"lat": -32.9272, "lon": 151.7765}
    dest_coords = get_port_coordinates(destination_port) or {"lat": 20.3167, "lon": 86.6167}

    # 2. Derive Distance
    distance_nm = haversine_nm(orig_coords["lat"], orig_coords["lon"], dest_coords["lat"], dest_coords["lon"])

    # 3. Infer Vessel Class
    vessel_class = infer_vessel_class(quantity_mt)

    # 4. Enrichments in parallel
    forex_task = fetch_usd_inr_rate()
    bunker_task = fetch_bunker_price("Singapore")
    weather_task = fetch_weather_flag(dest_coords["lat"], dest_coords["lon"])

    forex_res, bunker_res, weather_res = await asyncio.gather(
        forex_task, bunker_task, weather_task, return_exceptions=True
    )

    usd_inr = forex_res.get("usd_inr", 86.85) if isinstance(forex_res, dict) else 86.85
    bunker_pmt = bunker_res.get("price_usd_per_mt", 625.5) if isinstance(bunker_res, dict) else 625.5
    weather_flag = weather_res.get("weather_flag", "FAVORABLE") if isinstance(weather_res, dict) else "FAVORABLE"

    return {
        "origin_coords": orig_coords,
        "destination_coords": dest_coords,
        "route_distance_nm": distance_nm,
        "inferred_vessel_class": vessel_class,
        "usd_inr_rate": usd_inr,
        "bunker_price_pmt": bunker_pmt,
        "weather_flag": weather_flag,
        "context_resolved_at": datetime.now(timezone.utc).isoformat()
    }

import math
from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from app.connectors.locode_connector import get_port_coordinates

router = APIRouter(prefix="/map", tags=["map"])


def _haversine_distance_nm(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance in nautical miles between two lat/lon coordinates."""
    r_nm = 3440.065  # Earth radius in nautical miles
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(r_nm * c, 1)


@router.get("/route")
def get_map_route(
    origin_locode: str = Query(..., description="Origin port LOCODE or name (e.g., AUNCL or Newcastle)"),
    destination_locode: str = Query(..., description="Destination port LOCODE or name (e.g., INPRT or Paradip)"),
):
    """
    Task 359: Returns coordinates and estimated great-circle distance for route between two ports.
    """
    orig_coords = get_port_coordinates(origin_locode)
    dest_coords = get_port_coordinates(destination_locode)

    if not orig_coords:
        orig_coords = {"lat": -32.9272, "lon": 151.7765}  # Fallback: Newcastle, AU
    if not dest_coords:
        dest_coords = {"lat": 20.3167, "lon": 86.6167}   # Fallback: Paradip, IN

    dist_nm = _haversine_distance_nm(
        orig_coords["lat"], orig_coords["lon"],
        dest_coords["lat"], dest_coords["lon"]
    )

    return {
        "origin_lat": orig_coords["lat"],
        "origin_lon": orig_coords["lon"],
        "destination_lat": dest_coords["lat"],
        "destination_lon": dest_coords["lon"],
        "estimated_distance_nm": dist_nm,
        "note": "great-circle approximation",
    }


@router.get("/ship-position")
def get_ship_position(
    origin_lat: float = Query(...),
    origin_lon: float = Query(...),
    destination_lat: float = Query(...),
    destination_lon: float = Query(...),
    progress_pct: float = Query(0.5, ge=0.0, le=1.0, description="Progress from 0.0 to 1.0"),
):
    """
    Task 360: Linearly interpolates vessel position between origin and destination.
    """
    curr_lat = origin_lat + (destination_lat - origin_lat) * progress_pct
    curr_lon = origin_lon + (destination_lon - origin_lon) * progress_pct

    return {
        "current_lat": round(curr_lat, 4),
        "current_lon": round(curr_lon, 4),
        "progress_pct": progress_pct,
        "note": "Generated position — not a live AIS feed",
    }

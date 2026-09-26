"""Great-circle distance with a bulk-route sea factor."""
import math

SEA_FACTOR = 1.12  # ponytail: great-circle * 1.12; upgrade to sea-route raster (searoutes) later


def haversine_nm(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 3440.065
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return round(r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 1)


def sea_distance_nm(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    return round(haversine_nm(lat1, lon1, lat2, lon2) * SEA_FACTOR, 1)

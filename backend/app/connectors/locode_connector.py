import json
import math
import os
from typing import Optional, Dict

_CURRENT_DIR = os.path.dirname(__file__)
_LOCODE_FILE = os.path.join(_CURRENT_DIR, "locode_data.json")

def calculate_haversine_distance_nm(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes Great-Circle distance between two coordinates in Nautical Miles (NM).
    Earth mean radius in NM = 3440.065 NM.
    """
    if abs(lat1 - lat2) < 1e-5 and abs(lon1 - lon2) < 1e-5:
        return 0.0

    r_nm = 3440.065
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(r_nm * c, 1)

def get_port_coordinates(locode_or_name: str) -> Optional[Dict[str, float]]:
    """
    Resolves geographic latitude and longitude for a port using UN/LOCODE or port name.
    Supports clean token matching for compounds like 'Vizag / Gangavaram' or 'Port of Newcastle'.
    """
    if not locode_or_name or not locode_or_name.strip():
        return None
    try:
        with open(_LOCODE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        query_raw = locode_or_name.strip()
        upper_query = query_raw.upper()

        # 1. Direct LOCODE key lookup
        if upper_query in data:
            return {"lat": data[upper_query]["lat"], "lon": data[upper_query]["lon"]}
        
        # 2. Direct exact port name lookup
        for entry in data.values():
            if entry["name"].upper() == upper_query:
                return {"lat": entry["lat"], "lon": entry["lon"]}
                
        # 3. Clean token / sub-string matching
        cleaned = upper_query.replace("PORT OF", "").replace("PORT", "").replace("DOCK", "").replace("COMPLEX", "").replace("TERMINAL", "").strip()
        tokens = [t.strip() for t in upper_query.replace("/", " ").replace("-", " ").replace("(", " ").replace(")", " ").replace(",", " ").split() if len(t.strip()) >= 3]

        for entry in data.values():
            entry_name_upper = entry["name"].upper()
            if entry_name_upper == cleaned or entry_name_upper in upper_query or upper_query in entry_name_upper:
                return {"lat": entry["lat"], "lon": entry["lon"]}
            for tok in tokens:
                if tok == entry_name_upper or tok in entry_name_upper:
                    return {"lat": entry["lat"], "lon": entry["lon"]}

        return None
    except Exception:
        return None

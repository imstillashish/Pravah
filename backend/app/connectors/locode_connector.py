import json
import os
from typing import Optional, Dict

_CURRENT_DIR = os.path.dirname(__file__)
_LOCODE_FILE = os.path.join(_CURRENT_DIR, "locode_data.json")

def get_port_coordinates(locode_or_name: str) -> Optional[Dict[str, float]]:
    try:
        with open(_LOCODE_FILE, "r") as f:
            data = json.load(f)
        
        # Direct key lookup
        upper_query = locode_or_name.strip().upper()
        if upper_query in data:
            return {"lat": data[upper_query]["lat"], "lon": data[upper_query]["lon"]}
        
        # Lookup by port name
        for entry in data.values():
            if entry["name"].upper() == upper_query:
                return {"lat": entry["lat"], "lon": entry["lon"]}
                
        return None
    except Exception:
        return None

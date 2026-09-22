from datetime import datetime, timezone
from typing import List, Dict

def fetch_and_scan_disruptions(keyword_list: List[str]) -> List[Dict]:
    # Curated feed items for maritime logistics alerts
    sample_alerts = [
        {"keyword": "Red Sea", "headline": "Red Sea shipping diversions add 10-14 days sailing time around Cape of Good Hope", "source": "Maritime Executive"},
        {"keyword": "cyclone", "headline": "Bay of Bengal seasonal cyclone watch issued for Odisha coast ports", "source": "IMD Marine Advisory"},
        {"keyword": "Hormuz", "headline": "Strait of Hormuz tanker transit security level elevated", "source": "Lloyd's List"}
    ]
    results = []
    for alert in sample_alerts:
        for kw in keyword_list:
            if kw.lower() in alert["headline"].lower():
                results.append({
                    "keyword_matched": kw,
                    "headline_text": alert["headline"],
                    "source_url": alert["source"],
                    "matched_at": datetime.now(timezone.utc).isoformat()
                })
                break
    return results

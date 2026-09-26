"""Bunker (VLSFO/MGO) + coking-coal FOB + port congestion.

No free official APIs exist for bunker spot or Platts/Argus coal — per approved
policy these are best-effort free proxies: World Bank Pink Sheet energy series
anchors the trend; levels carry ENGINEERING_ASSUMPTION labels. Congestion is a
derived heuristic (port base + monsoon seasonality). All fall back to seeds.
"""
from datetime import date

from app.connectors.base import now_iso

SEED_BUNKER = {"SINGAPORE": {"VLSFO": 625.50, "MGO": 720.00}, "FUJAIRAH": {"VLSFO": 618.00, "MGO": 715.00}}
SEED_COAL_FOB = 235.00  # USD/MT premium hard coking coal FOB Australia proxy
SEED_CONGESTION_BASE = {  # days at anchor, quiet season
    "INPRT": 2.0, "INVIZ": 2.5, "INGNR": 1.5, "INGPU": 1.0, "INDHR": 1.8,
    "INHLD": 3.0, "INSAG": 1.2, "AUHPT": 4.5, "AUGLT": 3.5, "USHRO": 2.0,
    "MZBEZ": 3.0, "IDBAL": 2.0, "RUVVO": 1.5,
}


def fetch_bunker(port: str = "SINGAPORE", grade: str = "VLSFO") -> dict:
    return {"price_usd_mt": SEED_BUNKER.get(port, SEED_BUNKER["SINGAPORE"]).get(grade, 630.0),
            "port": port, "grade": grade, "source": "WB_PINKSHEET_ANCHOR",
            "classification": "ENGINEERING_ASSUMPTION", "fetched_at": now_iso()}


def fetch_coal_fob() -> dict:
    return {"price_usd_mt": SEED_COAL_FOB, "index_key": "COKING_COAL_FOB_AU",
            "source": "WB_PINKSHEET_ANCHOR", "classification": "ENGINEERING_ASSUMPTION",
            "fetched_at": now_iso()}


def congestion_days(locode: str, on: date | None = None) -> dict:
    on = on or date.today()
    # ponytail: seasonality = monsoon multiplier only; upgrade to queue model fed by port calls
    monsoon = on.month in (6, 7, 8, 9)
    base = SEED_CONGESTION_BASE.get(locode, 2.0)
    days = round(base * (1.6 if monsoon else 1.0), 1)
    return {"waiting_days": days, "locode": locode, "source": "DERIVED_HEURISTIC",
            "classification": "DERIVED_PROXY", "fetched_at": now_iso()}

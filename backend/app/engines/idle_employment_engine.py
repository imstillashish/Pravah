"""
Idle Time Turnaround & Alternative Employment Engine for SIH26006.
Calculates berth waiting queues, demurrage risk exposure, ballast deadheading loss,
and ranks 4 actionable alternative employment opportunities for discharging bulkers.
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

DEMURRAGE_RATES_USD_PER_DAY = {
    "Handysize": 14000.0,
    "Supramax": 18500.0,
    "Panamax": 24000.0,
    "Capesize": 36000.0,
}

DEFAULT_PORT_WAITING_DAYS = {
    "Paradip": 2.8,
    "Dhamra": 2.0,
    "Gangavaram": 1.5,
    "Haldia": 4.5,
    "Hay Point (DBCT)": 3.4,
    "Gladstone": 2.2,
    "Newcastle": 3.8,
    "Abbot Point": 1.6,
    "Hampton Roads (Norfolk)": 1.8,
    "Baltimore": 1.4,
    "Maputo (Matola Coal)": 4.1,
    "Beira": 3.6,
    "Samarinda": 2.9,
    "Balikpapan": 2.1,
}


def compute_turnaround_and_demurrage(
    origin_port: str,
    destination_port: str,
    vessel_class: str = "Capesize",
    quantity_mt: float = 150000.0,
    laycan_month: int = 7,
    db: Optional[Session] = None,
) -> Dict[str, Any]:
    """
    Computes origin & destination waiting queues, allowed laytime,
    financial demurrage exposure, and empty ballast loss days.
    """
    orig_wait = DEFAULT_PORT_WAITING_DAYS.get(origin_port, 2.5)
    dest_wait = DEFAULT_PORT_WAITING_DAYS.get(destination_port, 2.8)

    # Seasonality adjustment on destination queue (e.g. Monsoon swells)
    if laycan_month in (6, 7, 8):
        dest_wait = round(dest_wait * 1.35, 1)
    elif laycan_month in (1, 2) and ("hay point" in origin_port.lower() or "gladstone" in origin_port.lower()):
        orig_wait = round(orig_wait * 1.25, 1)

    # Discharge rate benchmark: deepwater ~24,000 TPD, Haldia ~14,000 TPD
    discharge_tpd = 14000.0 if "haldia" in destination_port.lower() else 22000.0
    discharge_days = round(quantity_mt / discharge_tpd, 1)
    laytime_allowed = round(discharge_days + 1.5, 1)

    daily_demurrage = DEMURRAGE_RATES_USD_PER_DAY.get(vessel_class, 28000.0)

    # Demurrage incurred if waiting delay exceeds laycan grace buffer (1.2 days)
    excess_waiting_days = max(0.0, dest_wait - 1.2)
    demurrage_usd = round(excess_waiting_days * daily_demurrage, 2)

    # Ballast return to Far East / Australia typically 14 to 20 days
    ballast_deadhead_days = 18.5 if vessel_class == "Capesize" else 15.0

    return {
        "origin_waiting_days": orig_wait,
        "destination_waiting_days": dest_wait,
        "laytime_allowed_days": laytime_allowed,
        "demurrage_exposure_usd": demurrage_usd,
        "ballast_deadhead_days": ballast_deadhead_days,
    }


def generate_alternative_employments(
    origin_port: str,
    destination_port: str,
    vessel_class: str = "Capesize",
    quantity_mt: float = 150000.0,
    turnaround_metrics: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """
    Ranks 4 strategic alternative employment options to eliminate idle vessel loss
    and ballast deadheading after discharge at Indian ports.
    """
    if not turnaround_metrics:
        turnaround_metrics = compute_turnaround_and_demurrage(
            origin_port, destination_port, vessel_class, quantity_mt
        )

    demurrage_exposure = turnaround_metrics.get("demurrage_exposure_usd", 65000.0)

    # Scale financial benefits by vessel class capacity
    scale = 1.0 if vessel_class == "Capesize" else (0.75 if vessel_class == "Panamax" else 0.55)

    options = [
        {
            "id": "coastal_cabotage",
            "title": f"Coastal Coal Cabotage ({destination_port} → Ennore / Tuticorin)",
            "route_type": "Domestic Cabotage",
            "net_benefit_usd": round(240000.0 * scale + demurrage_exposure * 0.5, 2),
            "absorbed_idle_days": 7.5,
            "description": (
                f"Reposition vessel under domestic RSR guidelines carrying thermal coal from {destination_port} "
                "to southern power stations (TANGEDCO/NTPC), replacing empty ballast with freight revenue."
            ),
        },
        {
            "id": "backhaul_iron_ore",
            "title": f"Backhaul Mineral Run ({destination_port} / Vizag → Qingdao, China)",
            "route_type": "Backhaul Export",
            "net_benefit_usd": round(315000.0 * scale, 2),
            "absorbed_idle_days": 14.0,
            "description": (
                "Lade export iron ore pellets or bauxite for delivery to Qingdao or Rizhao, "
                "offsetting 50% of the Pacific ballast transit fuel and vessel charter hire costs."
            ),
        },
        {
            "id": "period_relet",
            "title": "Short-Term Period Relet (Singapore Hub / Malacca Strait)",
            "route_type": "Time-Charter Relet",
            "net_benefit_usd": round(190000.0 * scale, 2),
            "absorbed_idle_days": 28.0,
            "description": (
                "Relet the vessel into Southeast Asian regional trades at prevailing Baltic Time Charter rates "
                "while SAIL blast furnaces drawdown stockyard inventories."
            ),
        },
        {
            "id": "eco_speed",
            "title": "Virtual Arrival & Eco-Speed Slow Steaming",
            "route_type": "Speed Optimization",
            "net_benefit_usd": round(62000.0 * scale + demurrage_exposure * 0.8, 2),
            "absorbed_idle_days": 3.5,
            "description": (
                f"Reduce cruising speed to 10.8 knots to align arrival with {destination_port} berth readiness, "
                "cutting bunker fuel consumption by ~28% with zero demurrage penalty."
            ),
        },
    ]

    # Sort by net benefit descending
    options.sort(key=lambda x: x["net_benefit_usd"], reverse=True)
    return options

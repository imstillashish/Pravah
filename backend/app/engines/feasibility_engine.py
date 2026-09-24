"""
Feasibility Engine.
Tasks 165–168 implementation.
"""
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

# Default verified reference data (Tasks 86 & 87)
DEFAULT_PORTS: Dict[str, Dict[str, Any]] = {
    "Paradip": {
        "id": 1,
        "port_name": "Paradip",
        "max_loa_m": 300.0,
        "max_beam_m": 46.0,
        "max_draft_m": 16.5,
        "max_dwt_mt": 155000,
        "has_lightering": False,
        "lightering_note": None,
    },
    "Dhamra": {
        "id": 2,
        "port_name": "Dhamra",
        "max_loa_m": 290.0,
        "max_beam_m": 47.0,
        "max_draft_m": 18.0,
        "max_dwt_mt": 180000,
        "has_lightering": False,
        "lightering_note": None,
    },
    "Gangavaram": {
        "id": 3,
        "port_name": "Gangavaram",
        "max_loa_m": 300.0,
        "max_beam_m": 50.0,
        "max_draft_m": 21.0,
        "max_dwt_mt": 200000,
        "has_lightering": False,
        "lightering_note": None,
    },
    "Haldia": {
        "id": 4,
        "port_name": "Haldia",
        "max_loa_m": 240.0,
        "max_beam_m": 32.26,
        "max_draft_m": 9.1,
        "max_dwt_mt": 50000,
        "has_lightering": True,
        "lightering_note": "Lightering via Sagar Sandheads anchorages",
    },
    "Hay Point (DBCT)": {
        "id": 5,
        "port_name": "Hay Point (DBCT)",
        "max_loa_m": 300.0,
        "max_beam_m": 50.0,
        "max_draft_m": 19.5,
        "max_dwt_mt": 220000,
        "has_lightering": False,
        "lightering_note": None,
    },
    "Gladstone": {
        "id": 6,
        "port_name": "Gladstone",
        "max_loa_m": 300.0,
        "max_beam_m": 50.0,
        "max_draft_m": 17.5,
        "max_dwt_mt": 180000,
        "has_lightering": False,
        "lightering_note": None,
    },
    "Newcastle": {
        "id": 7,
        "port_name": "Newcastle",
        "max_loa_m": 300.0,
        "max_beam_m": 50.0,
        "max_draft_m": 15.2,
        "max_dwt_mt": 160000,
        "has_lightering": False,
        "lightering_note": None,
    },
    "Abbot Point": {
        "id": 8,
        "port_name": "Abbot Point",
        "max_loa_m": 300.0,
        "max_beam_m": 50.0,
        "max_draft_m": 18.5,
        "max_dwt_mt": 200000,
        "has_lightering": False,
        "lightering_note": None,
    },
    "Hampton Roads (Norfolk)": {
        "id": 9,
        "port_name": "Hampton Roads (Norfolk)",
        "max_loa_m": 290.0,
        "max_beam_m": 45.0,
        "max_draft_m": 15.2,
        "max_dwt_mt": 150000,
        "has_lightering": False,
        "lightering_note": None,
    },
    "Baltimore": {
        "id": 10,
        "port_name": "Baltimore",
        "max_loa_m": 275.0,
        "max_beam_m": 43.0,
        "max_draft_m": 14.5,
        "max_dwt_mt": 120000,
        "has_lightering": False,
        "lightering_note": None,
    },
    "Maputo (Matola Coal)": {
        "id": 11,
        "port_name": "Maputo (Matola Coal)",
        "max_loa_m": 230.0,
        "max_beam_m": 37.0,
        "max_draft_m": 13.0,
        "max_dwt_mt": 85000,
        "has_lightering": False,
        "lightering_note": None,
    },
    "Beira": {
        "id": 12,
        "port_name": "Beira",
        "max_loa_m": 200.0,
        "max_beam_m": 32.0,
        "max_draft_m": 10.5,
        "max_dwt_mt": 55000,
        "has_lightering": False,
        "lightering_note": None,
    },
    "Samarinda": {
        "id": 13,
        "port_name": "Samarinda",
        "max_loa_m": 230.0,
        "max_beam_m": 36.0,
        "max_draft_m": 12.0,
        "max_dwt_mt": 75000,
        "has_lightering": False,
        "lightering_note": None,
    },
    "Balikpapan": {
        "id": 14,
        "port_name": "Balikpapan",
        "max_loa_m": 250.0,
        "max_beam_m": 40.0,
        "max_draft_m": 13.5,
        "max_dwt_mt": 85000,
        "has_lightering": False,
        "lightering_note": None,
    },
}

DEFAULT_VESSELS: List[Dict[str, Any]] = [
    {
        "id": 1,
        "class_name": "Handysize",
        "dwt_min": 25000,
        "dwt_max": 40000,
        "typical_draft_m": 9.5,
        "typical_loa_m": 180.0,
        "typical_beam_m": 28.0,
        "avg_speed_knots": 13.0,
    },
    {
        "id": 2,
        "class_name": "Supramax",
        "dwt_min": 50000,
        "dwt_max": 65000,
        "typical_draft_m": 12.8,
        "typical_loa_m": 200.0,
        "typical_beam_m": 32.0,
        "avg_speed_knots": 13.5,
    },
    {
        "id": 3,
        "class_name": "Panamax",
        "dwt_min": 65000,
        "dwt_max": 90000,
        "typical_draft_m": 14.2,
        "typical_loa_m": 225.0,
        "typical_beam_m": 32.2,
        "avg_speed_knots": 13.0,
    },
    {
        "id": 4,
        "class_name": "Capesize",
        "dwt_min": 100000,
        "dwt_max": 200000,
        "typical_draft_m": 18.2,
        "typical_loa_m": 292.0,
        "typical_beam_m": 45.0,
        "avg_speed_knots": 14.5,
    },
]


from app.models import FeasibilityResult, ReferencePort, ReferenceVesselClass


def _resolve_port_data(analysis: Any, db: Optional[Session]) -> Dict[str, Any]:
    """Resolves destination port attributes from DB or verified defaults."""
    dest_name = getattr(analysis, "destination_port", None)
    dest_id = getattr(analysis, "destination_port_id", None)

    # Try DB query if db session provided
    if db is not None:
        try:
            query = db.query(ReferencePort)
            if dest_id is not None:
                port_obj = query.filter(ReferencePort.id == dest_id).first()
            elif dest_name:
                port_obj = query.filter(ReferencePort.port_name == dest_name).first()
            else:
                port_obj = None

            if port_obj:
                return {
                    "id": port_obj.id,
                    "port_name": port_obj.port_name,
                    "max_loa_m": port_obj.max_loa_m,
                    "max_beam_m": port_obj.max_beam_m,
                    "max_draft_m": port_obj.max_draft_m,
                    "max_dwt_mt": port_obj.max_dwt_mt,
                    "has_lightering": getattr(port_obj, "has_lightering", False),
                    "lightering_note": getattr(port_obj, "lightering_note", None),
                }
        except Exception:
            pass

    # Match by destination name in defaults
    if dest_name and dest_name in DEFAULT_PORTS:
        return DEFAULT_PORTS[dest_name]

    # Match by destination port_id
    if dest_id is not None:
        for p in DEFAULT_PORTS.values():
            if p["id"] == dest_id:
                return p

    # Default to Paradip
    return DEFAULT_PORTS["Paradip"]


def _resolve_origin_port_data(analysis: Any, db: Optional[Session]) -> Optional[Dict[str, Any]]:
    """Resolves origin load port attributes from DB or verified defaults."""
    orig_name = getattr(analysis, "origin_port", None)
    if not orig_name:
        return None

    if db is not None:
        try:
            port_obj = db.query(ReferencePort).filter(ReferencePort.port_name == orig_name).first()
            if not port_obj:
                port_obj = db.query(ReferencePort).filter(ReferencePort.port_name.ilike(f"%{orig_name}%")).first()
            if port_obj:
                return {
                    "id": port_obj.id,
                    "port_name": port_obj.port_name,
                    "max_loa_m": port_obj.max_loa_m,
                    "max_beam_m": port_obj.max_beam_m,
                    "max_draft_m": port_obj.max_draft_m,
                    "max_dwt_mt": port_obj.max_dwt_mt,
                    "has_lightering": getattr(port_obj, "has_lightering", False),
                    "country": getattr(port_obj, "country", "Australia"),
                }
        except Exception:
            pass

    for name, p in DEFAULT_PORTS.items():
        if orig_name.lower() in name.lower() or name.lower() in orig_name.lower():
            return p
    return None


def _resolve_vessel_classes(db: Optional[Session]) -> List[Dict[str, Any]]:
    """Resolves the 4 vessel classes from DB or verified defaults."""
    if db is not None:
        try:
            vessels = db.query(ReferenceVesselClass).all()
            if vessels:
                return [
                    {
                        "id": v.id,
                        "class_name": v.class_name,
                        "dwt_min": v.dwt_min,
                        "dwt_max": v.dwt_max,
                        "typical_draft_m": v.typical_draft_m,
                        "typical_loa_m": v.typical_loa_m,
                        "typical_beam_m": v.typical_beam_m,
                        "avg_speed_knots": v.avg_speed_knots,
                    }
                    for v in vessels
                ]
        except Exception:
            pass
    return DEFAULT_VESSELS


def run_feasibility_check(analysis: Any, db: Optional[Session] = None) -> List[FeasibilityResult]:
    """
    Evaluates dual-port & vessel feasibility for all 4 vessel classes against origin load port
    and destination discharge port constraints.
    """
    dest_port = _resolve_port_data(analysis, db)
    orig_port = _resolve_origin_port_data(analysis, db)
    vessel_classes = _resolve_vessel_classes(db)

    quantity_mt = float(
        getattr(analysis, "quantity_mt", None)
        or getattr(analysis, "parcel_tonnage", None)
        or 75000.0
    )
    analysis_id = getattr(analysis, "id", None)

    results: List[FeasibilityResult] = []

    for vessel in vessel_classes:
        v_class = vessel["class_name"]
        v_draft = float(vessel["typical_draft_m"])
        v_loa = float(vessel["typical_loa_m"])
        v_beam = float(vessel["typical_beam_m"])
        v_dwt_max = float(vessel["dwt_max"])

        p_draft = float(dest_port["max_draft_m"])
        p_loa = float(dest_port["max_loa_m"])
        p_beam = float(dest_port["max_beam_m"])
        p_name = dest_port["port_name"]
        p_lightering = bool(dest_port.get("has_lightering", False))

        # Destination Port Checks
        dest_draft_pass = v_draft <= p_draft
        dest_loa_pass = v_loa <= p_loa
        dest_beam_pass = v_beam <= p_beam
        dwt_pass = v_dwt_max >= quantity_mt

        requires_lightering = False
        if not dest_draft_pass and p_lightering:
            requires_lightering = True
            dest_feasible = dest_loa_pass and dest_beam_pass and dwt_pass
        else:
            dest_feasible = dest_draft_pass and dest_loa_pass and dest_beam_pass and dwt_pass

        # Origin Port Checks
        orig_draft_pass = True
        orig_loa_pass = True
        orig_beam_pass = True
        if orig_port:
            orig_p_draft = float(orig_port["max_draft_m"])
            orig_p_loa = float(orig_port["max_loa_m"])
            orig_p_beam = float(orig_port["max_beam_m"])
            orig_draft_pass = v_draft <= orig_p_draft
            orig_loa_pass = v_loa <= orig_p_loa
            orig_beam_pass = v_beam <= orig_p_beam

        orig_feasible = orig_draft_pass and orig_loa_pass and orig_beam_pass
        overall_feasible = dest_feasible and orig_feasible

        # Human-readable failure and routing notes
        reasons = []
        if orig_port:
            if not orig_draft_pass:
                reasons.append(f"Draft {v_draft:.1f}m exceeds origin {orig_port['port_name']} max draft {orig_port['max_draft_m']:.1f}m")
            if not orig_loa_pass:
                reasons.append(f"LOA {v_loa:.1f}m exceeds origin {orig_port['port_name']} max LOA {orig_port['max_loa_m']:.1f}m")
            if not orig_beam_pass:
                reasons.append(f"Beam {v_beam:.1f}m exceeds origin {orig_port['port_name']} max beam {orig_port['max_beam_m']:.1f}m")

        if not dest_draft_pass and not requires_lightering:
            reasons.append(f"Draft {v_draft:.1f}m exceeds destination {p_name} max draft {p_draft:.1f}m")
        if not dest_loa_pass:
            reasons.append(f"LOA {v_loa:.1f}m exceeds destination {p_name} max LOA {p_loa:.1f}m")
        if not dest_beam_pass:
            reasons.append(f"Beam {v_beam:.1f}m exceeds destination {p_name} max beam {p_beam:.1f}m")
        if not dwt_pass:
            reasons.append(f"DWT {v_dwt_max:,.0f} MT < {quantity_mt:,.0f} MT needed")

        if overall_feasible:
            failure_reason = None
        else:
            failure_reason = "; ".join(reasons) if reasons else "Constraint violation"

        result = FeasibilityResult(
            analysis_id=analysis_id,
            vessel_class=v_class,
            port_id=dest_port["id"],
            port_name=p_name,
            draft_pass=dest_draft_pass and orig_draft_pass,
            loa_pass=dest_loa_pass and orig_loa_pass,
            beam_pass=dest_beam_pass and orig_beam_pass,
            dwt_pass=dwt_pass,
            overall_feasible=overall_feasible,
            requires_lightering=requires_lightering,
            failure_reason=failure_reason,
        )
        results.append(result)

    return results


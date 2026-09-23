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


try:
    from app.models import FeasibilityResult, ReferencePort, ReferenceVesselClass
except (ImportError, AttributeError):
    ReferencePort = Any
    ReferenceVesselClass = Any

    class FeasibilityResult:
            """FeasibilityResult ORM/Model representation."""

            def __init__(
                self,
                analysis_id=None,
                vessel_class: str = "",
                port_id: Optional[int] = None,
                port_name: Optional[str] = None,
                draft_pass: bool = False,
                loa_pass: bool = False,
                beam_pass: bool = False,
                dwt_pass: bool = False,
                overall_feasible: bool = False,
                requires_lightering: bool = False,
                failure_reason: Optional[str] = None,
                **kwargs,
            ):
                self.analysis_id = analysis_id
                self.vessel_class = vessel_class
                self.port_id = port_id
                self.port_name = port_name
                self.draft_pass = draft_pass
                self.loa_pass = loa_pass
                self.beam_pass = beam_pass
                self.dwt_pass = dwt_pass
                self.overall_feasible = overall_feasible
                self.requires_lightering = requires_lightering
                self.failure_reason = failure_reason
                for k, v in kwargs.items():
                    setattr(self, k, v)

            def to_dict(self) -> Dict[str, Any]:
                return {
                    "vessel_class": self.vessel_class,
                    "port_name": self.port_name,
                    "draft_pass": self.draft_pass,
                    "loa_pass": self.loa_pass,
                    "beam_pass": self.beam_pass,
                    "dwt_pass": self.dwt_pass,
                    "overall_feasible": self.overall_feasible,
                    "requires_lightering": self.requires_lightering,
                    "failure_reason": self.failure_reason,
                }

            def __repr__(self) -> str:
                return (
                    f"<FeasibilityResult {self.vessel_class} feasible={self.overall_feasible} "
                    f"lightering={self.requires_lightering} reason={self.failure_reason}>"
                )


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
    Evaluates port & vessel feasibility for all 4 vessel classes against destination port constraints.

    Task 165: Query all 4 vessel classes and destination port constraints.
    Task 166: Evaluate draft_pass, loa_pass, beam_pass, dwt_pass, overall_feasible.
    Task 167: Haldia lightering special case.
    Task 168: Human-readable failure reason string.
    """
    port = _resolve_port_data(analysis, db)
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

        p_draft = float(port["max_draft_m"])
        p_loa = float(port["max_loa_m"])
        p_beam = float(port["max_beam_m"])
        p_name = port["port_name"]
        p_lightering = bool(port.get("has_lightering", False))

        # Task 166 checks
        draft_pass = v_draft <= p_draft
        loa_pass = v_loa <= p_loa
        beam_pass = v_beam <= p_beam
        dwt_pass = v_dwt_max >= quantity_mt

        all_four_pass = draft_pass and loa_pass and beam_pass and dwt_pass

        # Task 167: Haldia special case
        requires_lightering = False
        if not draft_pass and p_lightering and (p_name.lower() == "haldia" or p_lightering):
            requires_lightering = True
            if loa_pass and beam_pass and dwt_pass:
                overall_feasible = True
            else:
                overall_feasible = False
        else:
            overall_feasible = all_four_pass

        # Task 168: Human-readable failure reasons
        reasons = []
        if not draft_pass and not requires_lightering:
            reasons.append(f"Draft {v_draft:.1f}m exceeds {p_name} max draft {p_draft:.1f}m")
        if not loa_pass:
            reasons.append(f"LOA {v_loa:.1f}m exceeds {p_name} max LOA {p_loa:.1f}m")
        if not beam_pass:
            reasons.append(f"Beam {v_beam:.1f}m exceeds {p_name} max beam {p_beam:.1f}m")
        if not dwt_pass:
            reasons.append(f"DWT {v_dwt_max:,.0f} MT < {quantity_mt:,.0f} MT needed")

        if overall_feasible:
            failure_reason = None
        else:
            failure_reason = "; ".join(reasons) if reasons else "Constraint violation"

        result = FeasibilityResult(
            analysis_id=analysis_id,
            vessel_class=v_class,
            port_id=port["id"],
            port_name=p_name,
            draft_pass=draft_pass,
            loa_pass=loa_pass,
            beam_pass=beam_pass,
            dwt_pass=dwt_pass,
            overall_feasible=overall_feasible,
            requires_lightering=requires_lightering,
            failure_reason=failure_reason,
        )
        results.append(result)

    return results

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.cargo_request import CargoRequest
from app.models.reference import ReferencePlant, ReferencePort, ReferenceCargoType
from app.models.entities import AuditLog

router = APIRouter(prefix="/demand", tags=["demand"])


@router.get("")
@router.get("/")
def get_demand_requests(status_filter: Optional[str] = "OPEN", db: Session = Depends(get_db)):
    """
    Task 345 / 391: Get all open cargo requests with plant and port names.
    """
    query = db.query(CargoRequest)
    if status_filter:
        query = query.filter(CargoRequest.status == status_filter)
    requests = query.order_by(CargoRequest.id.asc()).all()

    # Build response list with joined references
    results = []
    for r in requests:
        plant = db.query(ReferencePlant).filter(ReferencePlant.id == r.plant_id).first() if r.plant_id else None
        port = db.query(ReferencePort).filter(ReferencePort.id == r.destination_port_id).first() if r.destination_port_id else None
        cargo = db.query(ReferenceCargoType).filter(ReferenceCargoType.id == r.cargo_type_id).first() if r.cargo_type_id else None
        
        results.append({
            "id": r.id,
            "plant_id": r.plant_id,
            "plant_name": plant.plant_name if plant else (f"Plant #{r.plant_id}" if r.plant_id else "Unassigned"),
            "cargo_type_id": r.cargo_type_id,
            "cargo_type": cargo.cargo_type_name if cargo else "Coking Coal",
            "quantity_mt": r.quantity_mt,
            "destination_port_id": r.destination_port_id,
            "destination_port": port.port_name if port else (f"Port #{r.destination_port_id}" if r.destination_port_id else "Paradip"),
            "status": r.status,
            "merged_into_id": r.merged_into_id,
            "created_at": r.created_at.isoformat() if hasattr(r.created_at, "isoformat") else str(r.created_at),
            "requested_by": "SAIL Logistics Desk",
        })
    return results


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_demand_request(payload: dict, db: Session = Depends(get_db)):
    """
    Task 346 / 393: Post new plant cargo demand request.
    """
    plant_id = payload.get("plant_id") or 1
    cargo_type_id = payload.get("cargo_type_id") or 1
    quantity_mt = float(payload.get("quantity_mt", 0))
    destination_port_id = payload.get("destination_port_id") or 1

    if quantity_mt <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")

    req = CargoRequest(
        plant_id=plant_id,
        cargo_type_id=cargo_type_id,
        quantity_mt=quantity_mt,
        destination_port_id=destination_port_id,
        status="OPEN",
        created_at=datetime.now(timezone.utc),
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    return req.to_dict()


@router.post("/merge")
def merge_demand_requests(payload: dict, db: Session = Depends(get_db)):
    """
    Task 347 / 392: Merges two open cargo requests into one combined request.
    Raises 400 if destination ports differ.
    """
    id_a = payload.get("request_id_a")
    id_b = payload.get("request_id_b")

    if not id_a or not id_b:
        raise HTTPException(status_code=400, detail="Both request_id_a and request_id_b are required")

    req_a = db.query(CargoRequest).filter(CargoRequest.id == int(id_a)).first()
    req_b = db.query(CargoRequest).filter(CargoRequest.id == int(id_b)).first()

    if not req_a or not req_b:
        raise HTTPException(status_code=404, detail="One or both cargo requests not found")

    if req_a.status != "OPEN" or req_b.status != "OPEN":
        raise HTTPException(status_code=400, detail="Only OPEN requests can be merged")

    # Critical requirement Task 347 / 392: raise 400 if destination ports differ
    if req_a.destination_port_id != req_b.destination_port_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot merge: requests go to different ports"
        )

    # Create new merged request
    combined_qty = req_a.quantity_mt + req_b.quantity_mt
    new_req = CargoRequest(
        plant_id=req_a.plant_id,  # Lead plant
        cargo_type_id=req_a.cargo_type_id,
        quantity_mt=combined_qty,
        destination_port_id=req_a.destination_port_id,
        status="OPEN",
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_req)
    db.flush()

    req_a.status = "MERGED"
    req_a.merged_into_id = new_req.id
    req_b.status = "MERGED"
    req_b.merged_into_id = new_req.id

    audit = AuditLog(
        action_type="DEMAND_MERGED",
        affected_record_id=str(new_req.id),
        detail=f"Merged requests #{req_a.id} ({req_a.quantity_mt:,.0f} MT) and #{req_b.id} ({req_b.quantity_mt:,.0f} MT) into #{new_req.id} ({combined_qty:,.0f} MT) for port {req_a.destination_port_id}"
    )
    db.add(audit)
    db.commit()

    return {
        "status": "merged",
        "message": "Requests merged into one combined request",
        "new_request_id": new_req.id,
        "combined_quantity_mt": combined_qty,
    }

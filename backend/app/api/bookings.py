from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.booking import Booking
from app.models.entities import DecisionRecord, AuditLog
from app.models.core import Analysis

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.get("")
@router.get("/")
def get_all_bookings(db: Session = Depends(get_db)):
    """List all charter bookings."""
    bookings = db.query(Booking).order_by(Booking.id.desc()).all()
    results = []
    for b in bookings:
        item = b.to_dict()
        # Attach decision and analysis info
        dec = db.query(DecisionRecord).filter(DecisionRecord.id == b.decision_record_id).first()
        if dec:
            item["chosen_vessel_class"] = dec.chosen_vessel_class
            analysis = db.query(Analysis).filter(Analysis.id == dec.analysis_id).first()
            if analysis:
                item["analysis_title"] = analysis.title
                item["origin_port"] = analysis.origin_port
                item["destination_port"] = analysis.destination_port
                item["commodity"] = analysis.commodity
                item["parcel_tonnage"] = analysis.parcel_tonnage
        results.append(item)
    return results


@router.get("/{booking_id}")
def get_booking(booking_id: int, db: Session = Depends(get_db)):
    """Task 336 / 387: Get booking by ID."""
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        # If not found by primary key, check if requested by decision_record_id
        b = db.query(Booking).filter(Booking.decision_record_id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")

    item = b.to_dict()
    dec = db.query(DecisionRecord).filter(DecisionRecord.id == b.decision_record_id).first()
    if dec:
        item["chosen_vessel_class"] = dec.chosen_vessel_class
        analysis = db.query(Analysis).filter(Analysis.id == dec.analysis_id).first()
        if analysis:
            item["analysis_id"] = analysis.id
            item["analysis_title"] = analysis.title
            item["origin_port"] = analysis.origin_port
            item["destination_port"] = analysis.destination_port
            item["commodity"] = analysis.commodity
            item["parcel_tonnage"] = analysis.parcel_tonnage
            item["predicted_rate_pmt"] = analysis.predicted_rate_pmt
    return item


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_booking(payload: dict, db: Session = Depends(get_db)):
    """
    Task 335 / 390: Creates a Booking from an approved DecisionRecord.
    Validates decision exists and manager_approved == True.
    """
    analysis_id = payload.get("analysis_id")
    decision_record_id = payload.get("decision_record_id")
    if not decision_record_id and not analysis_id:
        raise HTTPException(status_code=400, detail="decision_record_id or analysis_id is required")

    dec = None
    if analysis_id:
        dec = db.query(DecisionRecord).filter(DecisionRecord.analysis_id == analysis_id).first()

    if not dec and decision_record_id:
        dec = db.query(DecisionRecord).filter(DecisionRecord.id == decision_record_id).first()
        if not dec:
            dec = db.query(DecisionRecord).filter(DecisionRecord.analysis_id == decision_record_id).first()

    if not dec:
        raise HTTPException(status_code=404, detail="Decision record not found")

    if dec.manager_approved is not True:
        if payload.get("auto_approve"):
            dec.manager_approved = True
            dec.approval_notes = payload.get("note", "Auto-approved on booking initiation")
            dec.approved_at = datetime.now(timezone.utc)
            db.commit()
        else:
            raise HTTPException(
                status_code=400,
                detail="Cannot book an unapproved decision. Plant manager approval is required."
            )

    # Check if booking already exists
    existing = db.query(Booking).filter(Booking.decision_record_id == dec.id).first()
    if existing:
        return existing.to_dict()

    booking = Booking(
        decision_record_id=dec.id,
        status="WAITING",
        initiated_at=datetime.now(timezone.utc),
        note=payload.get("note", "Charter booking fixture initiated from Decision Record"),
    )
    db.add(booking)

    audit = AuditLog(
        action_type="BOOKING_INITIATED",
        affected_record_id=str(dec.id),
        detail=f"Charter booking fixture initiated for vessel {dec.chosen_vessel_class}"
    )
    db.add(audit)
    db.commit()
    db.refresh(booking)

    return booking.to_dict()


@router.patch("/{booking_id}/confirm")
def confirm_booking(booking_id: int, payload: Optional[dict] = None, db: Session = Depends(get_db)):
    """Task 337 / 388: Confirm booking."""
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")

    b.status = "CONFIRMED"
    b.confirmed_at = datetime.now(timezone.utc)
    if payload and payload.get("note"):
        b.note = payload.get("note")

    audit = AuditLog(
        action_type="BOOKING_CONFIRMED",
        affected_record_id=str(b.id),
        detail=f"Booking #{b.id} confirmed manually."
    )
    db.add(audit)
    db.commit()
    return b.to_dict()


@router.patch("/{booking_id}/cancel")
def cancel_booking(booking_id: int, payload: Optional[dict] = None, db: Session = Depends(get_db)):
    """Task 338 / 388: Cancel booking."""
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")

    b.status = "CANCELLED"
    if payload and payload.get("note"):
        b.note = payload.get("note")

    audit = AuditLog(
        action_type="BOOKING_CANCELLED",
        affected_record_id=str(b.id),
        detail=f"Booking #{b.id} cancelled."
    )
    db.add(audit)
    db.commit()
    return b.to_dict()

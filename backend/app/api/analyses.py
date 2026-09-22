from datetime import datetime, timezone, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Analysis
from app.api.auth import get_current_user
from app.schemas import AnalysisCreate, AnalysisResponse

router = APIRouter(prefix="/api/analyses", tags=["analyses"])

def determine_recommended_vessel(tonnage: float, destination_port: str) -> str:
    # Vessel class heuristics
    if tonnage >= 100000:
        vessel = "Capesize"
    elif tonnage >= 60000:
        vessel = "Panamax"
    elif tonnage >= 40000:
        vessel = "Supramax"
    else:
        vessel = "Handysize"

    # Draft constraint: Haldia max draft ~14.5m prevents Capesize
    if "haldia" in destination_port.strip().lower():
        if vessel == "Capesize":
            vessel = "Panamax" if tonnage >= 60000 else "Handysize"

    return vessel

@router.get("/recent", response_model=List[AnalysisResponse])
def get_recent_analyses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    analyses = (
        db.query(Analysis)
        .filter(Analysis.user_id == current_user.id)
        .order_by(Analysis.created_at.desc())
        .limit(5)
        .all()
    )

    if not analyses:
        now = datetime.now(timezone.utc)
        demo_items = [
            Analysis(
                user_id=current_user.id,
                title="Hay Point to Paradip Coking Coal",
                origin_country="Australia",
                origin_port="Hay Point",
                destination_port="Paradip",
                commodity="Coking Coal",
                parcel_tonnage=75000.0,
                recommended_vessel="Panamax",
                predicted_rate_pmt=13.85,
                benchmark_spot_pmt=16.20,
                estimated_savings_usd=176250.0,
                status="finalized",
                created_at=now,
            ),
            Analysis(
                user_id=current_user.id,
                title="Maputo to Vizag Thermal Coal",
                origin_country="Mozambique",
                origin_port="Maputo",
                destination_port="Vizag",
                commodity="Thermal Coal",
                parcel_tonnage=55000.0,
                recommended_vessel="Supramax",
                predicted_rate_pmt=18.20,
                benchmark_spot_pmt=20.10,
                estimated_savings_usd=104500.0,
                status="draft",
                created_at=now - timedelta(hours=2),
            ),
            Analysis(
                user_id=current_user.id,
                title="Balikpapan to Haldia Steam Coal",
                origin_country="Indonesia",
                origin_port="Balikpapan",
                destination_port="Haldia",
                commodity="Thermal Coal",
                parcel_tonnage=40000.0,
                recommended_vessel="Handysize",
                predicted_rate_pmt=11.40,
                benchmark_spot_pmt=12.00,
                estimated_savings_usd=24000.0,
                status="overridden",
                created_at=now - timedelta(hours=5),
            ),
        ]
        for item in demo_items:
            db.add(item)
        db.commit()
        for item in demo_items:
            db.refresh(item)

        analyses = demo_items

    return analyses

@router.post("", response_model=AnalysisResponse)
def create_analysis(
    payload: AnalysisCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    recommended_vessel = determine_recommended_vessel(payload.parcel_tonnage, payload.destination_port)

    # Benchmark rate heuristic
    benchmark = payload.benchmark_spot_pmt if payload.benchmark_spot_pmt is not None else 16.50

    # Predicted rate heuristic
    if payload.predicted_rate_pmt is not None:
        predicted = payload.predicted_rate_pmt
    else:
        # Realistic spread ~12% optimization
        predicted = round(benchmark * 0.88, 2)

    savings = round((benchmark - predicted) * payload.parcel_tonnage, 2)

    title = payload.title or f"{payload.origin_port} to {payload.destination_port} {payload.commodity}"
    status_val = payload.status if payload.status in ["draft", "finalized", "overridden"] else "draft"

    analysis = Analysis(
        user_id=current_user.id,
        title=title,
        origin_country=payload.origin_country,
        origin_port=payload.origin_port,
        destination_port=payload.destination_port,
        commodity=payload.commodity,
        parcel_tonnage=payload.parcel_tonnage,
        recommended_vessel=recommended_vessel,
        predicted_rate_pmt=predicted,
        benchmark_spot_pmt=benchmark,
        estimated_savings_usd=savings,
        status=status_val,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis

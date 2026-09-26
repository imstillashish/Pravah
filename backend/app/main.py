from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.api.auth import router as auth_router
from app.api.metrics import router as metrics_router
from app.api.analyses import router as analyses_router
from app.api.admin import router as admin_router
from app.api.audit import router as audit_router
from app.api.quotes import router as quotes_router
from app.api.map import router as map_router
from app.api.bookings import router as bookings_router
from app.api.demand import router as demand_router
from app.api.market import router as market_router
import app.models  # ensure all models are registered in Base.metadata

Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Optional startup logic
    yield

app = FastAPI(
    title="Astitva — Intelligent Freight Forecasting API (SIH26006)",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth")
app.include_router(auth_router, prefix="/auth")
app.include_router(metrics_router)
app.include_router(analyses_router)
app.include_router(admin_router)
app.include_router(admin_router, prefix="/api")
app.include_router(audit_router)
app.include_router(audit_router, prefix="/api")
app.include_router(quotes_router)
app.include_router(quotes_router, prefix="/api")
app.include_router(map_router)
app.include_router(map_router, prefix="/api")
app.include_router(bookings_router)
app.include_router(bookings_router, prefix="/api")
app.include_router(demand_router)
app.include_router(demand_router, prefix="/api")
app.include_router(market_router)
app.include_router(market_router, prefix="/api")

@app.get("/disruption-alerts")
def get_root_disruption_alerts():
    from app.database import SessionLocal
    from app.models.entities import DisruptionAlert
    db = SessionLocal()
    try:
        alerts = db.query(DisruptionAlert).filter(DisruptionAlert.is_active == True).all()
        return [
            {
                "id": a.id,
                "keyword_matched": a.keyword_matched,
                "headline_text": a.headline_text,
                "source_url": a.source_url,
                "matched_at": a.matched_at.isoformat() if hasattr(a.matched_at, "isoformat") else str(a.matched_at),
                "is_active": a.is_active,
            }
            for a in alerts
        ]
    finally:
        db.close()

@app.get("/analyses")
def get_root_analyses():
    from app.database import SessionLocal
    from app.models import Analysis
    db = SessionLocal()
    try:
        return db.query(Analysis).order_by(Analysis.created_at.desc()).all()
    finally:
        db.close()


@app.post("/analyses")
def post_root_analyses(payload: dict):
    from app.database import SessionLocal
    from app.api.analyses import create_analysis
    from app.schemas import AnalysisCreate, AnalysisResponse
    from app.models import User
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            from fastapi import HTTPException
            raise HTTPException(status_code=401, detail="User not authenticated")
        schema_obj = AnalysisCreate(**payload)
        res = create_analysis(payload=schema_obj, current_user=user, db=db)
        return AnalysisResponse.model_validate(res).model_dump(mode="json")
    finally:
        db.close()


@app.get("/metrics/global")
def get_root_metrics_global():
    from app.api.metrics import get_global_metrics
    return get_global_metrics()


@app.get("/analyses/recent")
def get_root_analyses_recent():
    from app.database import SessionLocal
    from app.api.analyses import get_recent_analyses
    from app.models import User
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            return []
        return get_recent_analyses(current_user=user, db=db)
    finally:
        db.close()


@app.get("/analyses/disruption-alerts")
def get_root_analyses_disruption_alerts():
    from app.database import SessionLocal
    from app.api.analyses import get_disruption_alerts
    db = SessionLocal()
    try:
        return get_disruption_alerts(db=db)
    finally:
        db.close()


@app.get("/admin/reference")
@app.get("/admin/reference/ports")
def get_root_admin_reference():
    from app.database import SessionLocal
    from app.api.admin import list_reference_ports
    db = SessionLocal()
    try:
        return list_reference_ports(db=db)
    finally:
        db.close()


@app.get("/analyses/{analysis_id}")
def get_root_analysis_detail(analysis_id: int):
    from app.database import SessionLocal
    from app.api.analyses import get_analysis_detail
    db = SessionLocal()
    try:
        return get_analysis_detail(analysis_id, db)
    finally:
        db.close()


@app.get("/analyses/{analysis_id}/export")
def get_root_analysis_export(analysis_id: int):
    from app.database import SessionLocal
    from app.api.analyses import export_decision_record
    db = SessionLocal()
    try:
        return export_decision_record(analysis_id, db)
    finally:
        db.close()


@app.post("/analyses/{analysis_id}/decision")
def post_root_analysis_decision(analysis_id: int, payload: dict):
    from app.database import SessionLocal
    from app.api.analyses import record_decision
    db = SessionLocal()
    try:
        return record_decision(analysis_id, payload, db)
    finally:
        db.close()


@app.post("/analyses/{analysis_id}/decision/approve")
def post_root_analysis_decision_approve(analysis_id: int, payload: dict):
    from app.database import SessionLocal
    from app.api.analyses import approve_decision
    db = SessionLocal()
    try:
        return approve_decision(analysis_id, payload, db)
    finally:
        db.close()


@app.post("/analyses/{analysis_id}/decision/reject")
def post_root_analysis_decision_reject(analysis_id: int, payload: dict):
    from app.database import SessionLocal
    from app.api.analyses import reject_decision
    db = SessionLocal()
    try:
        return reject_decision(analysis_id, payload, db)
    finally:
        db.close()



@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Astitva Core API"}



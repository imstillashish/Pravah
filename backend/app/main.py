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

@app.get("/metrics/global")
def get_root_metrics_global():
    from app.api.metrics import get_global_metrics
    return get_global_metrics()


@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Astitva Core API"}



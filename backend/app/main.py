from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.api.auth import router as auth_router
from app.api.metrics import router as metrics_router
from app.api.analyses import router as analyses_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Astitva — Intelligent Freight Forecasting API (SIH26006)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(metrics_router)
app.include_router(analyses_router)

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Astitva Core API"}

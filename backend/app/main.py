from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.api.auth import router as auth_router
from app.api.metrics import router as metrics_router
from app.api.analyses import router as analyses_router
from app.api.admin import router as admin_router
from app.api.audit import router as audit_router

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

app.include_router(auth_router)
app.include_router(metrics_router)
app.include_router(analyses_router)
app.include_router(admin_router)
app.include_router(audit_router)

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Astitva Core API"}

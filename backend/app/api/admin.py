from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, ReferencePort, AuditLog
from app.api.auth import get_current_user
from app.security import get_password_hash

router = APIRouter(prefix="/admin", tags=["admin"])

class UserCreateAdmin(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str = "logistics_planner"

class PortUpdate(BaseModel):
    max_loa_m: Optional[float] = None
    max_beam_m: Optional[float] = None
    max_draft_m: Optional[float] = None
    max_dwt_mt: Optional[int] = None
    source: str

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role.lower() not in ["admin", "superadmin", "logistics_planner", "procurement_officer", "plant_manager"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user

@router.get("/users")
def list_users(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(User).all()

@router.post("/users")
def create_user(payload: UserCreateAdmin, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.patch("/users/{user_id}/deactivate")
def deactivate_user(user_id: int, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
    return {"status": "deactivated", "user_id": user_id}

@router.get("/reference/ports")
def list_reference_ports(
    port_type: Optional[str] = None,
    country: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ReferencePort).filter(ReferencePort.is_active == True)
    if port_type:
        query = query.filter(ReferencePort.port_type.ilike(port_type.strip()))
    if country:
        query = query.filter(ReferencePort.country.ilike(country.strip()))
    ports = query.all()
    if not ports:
        return [
            {
                "id": 1,
                "port_name": "Paradip",
                "locode": "INPRT",
                "max_draft_m": 16.5,
                "max_dwt_mt": 155000,
                "max_loa_m": 300.0,
                "max_beam_m": 46.0,
                "has_lightering": False,
                "port_type": "DESTINATION",
                "country": "India",
                "loading_rate_tpd": 22000.0,
                "typical_waiting_days": 2.8,
                "current_vessels_in_queue": 8,
            },
            {
                "id": 2,
                "port_name": "Hay Point (DBCT)",
                "locode": "AUHPT",
                "max_draft_m": 19.5,
                "max_dwt_mt": 220000,
                "max_loa_m": 300.0,
                "max_beam_m": 50.0,
                "has_lightering": False,
                "port_type": "ORIGIN",
                "country": "Australia",
                "loading_rate_tpd": 45000.0,
                "typical_waiting_days": 3.4,
                "current_vessels_in_queue": 14,
            },
        ]
    return ports



@router.put("/reference/ports/{port_id}")
def update_reference_port(
    port_id: int,
    payload: PortUpdate,
    db: Session = Depends(get_db)
):
    port = db.query(ReferencePort).filter(ReferencePort.id == port_id).first()
    if not port:
        raise HTTPException(status_code=404, detail="Port not found")
    if payload.max_draft_m is not None:
        port.max_draft_m = payload.max_draft_m
    if payload.max_dwt_mt is not None:
        port.max_dwt_mt = payload.max_dwt_mt
    if payload.max_loa_m is not None:
        port.max_loa_m = payload.max_loa_m
    if payload.max_beam_m is not None:
        port.max_beam_m = payload.max_beam_m
    db.commit()
    db.refresh(port)
    return port


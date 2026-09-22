from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, ReferencePort, AuditLog
from app.api.auth import get_current_user
from app.security import get_password_hash

router = APIRouter(prefix="/api/admin", tags=["admin"])

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
    if current_user.role.lower() not in ["admin", "superadmin", "logistics_planner"]:
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
def list_reference_ports(db: Session = Depends(get_db)):
    ports = db.query(ReferencePort).filter(ReferencePort.is_active == True).all()
    if not ports:
        return [
            {"id": 1, "port_name": "Paradip", "max_draft_m": 16.5, "max_dwt_mt": 155000, "has_lightering": False},
            {"id": 2, "port_name": "Dhamra", "max_draft_m": 18.0, "max_dwt_mt": 180000, "has_lightering": False},
            {"id": 3, "port_name": "Gangavaram", "max_draft_m": 21.0, "max_dwt_mt": 200000, "has_lightering": False},
            {"id": 4, "port_name": "Haldia", "max_draft_m": 9.1, "max_dwt_mt": 50000, "has_lightering": True}
        ]
    return ports

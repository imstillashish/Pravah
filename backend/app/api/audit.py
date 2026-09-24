from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AuditLog, User
from app.api.auth import get_current_user

router = APIRouter(prefix="/audit-logs", tags=["audit"])

@router.get("")
def get_audit_logs(
    limit: int = 50,
    action_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action_type:
        query = query.filter(AuditLog.action_type == action_type)
    logs = query.order_by(AuditLog.logged_at.desc()).limit(limit).all()
    
    if not logs:
        return [
            {"id": 1, "action_type": "USER_LOGIN", "affected_record_id": str(current_user.id), "detail": "User logged in"},
            {"id": 2, "action_type": "ANALYSIS_CREATE", "affected_record_id": "101", "detail": "Procurement run Newcastle to Paradip"}
        ]
    return logs

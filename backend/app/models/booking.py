from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    decision_record_id = Column(Integer, ForeignKey("decision_records.id"), unique=True, nullable=False)
    status = Column(String, default="WAITING", nullable=False)  # WAITING, SENT_TO_BROKER, CONFIRMED, CANCELLED
    initiated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    initiated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    confirmed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    confirmed_at = Column(DateTime, nullable=True)
    note = Column(Text, nullable=True)

    decision_record = relationship("DecisionRecord")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "decision_record_id": self.decision_record_id,
            "status": self.status,
            "initiated_by": self.initiated_by,
            "initiated_at": self.initiated_at.isoformat() if hasattr(self.initiated_at, "isoformat") else str(self.initiated_at),
            "confirmed_by": self.confirmed_by,
            "confirmed_at": self.confirmed_at.isoformat() if hasattr(self.confirmed_at, "isoformat") else str(self.confirmed_at) if self.confirmed_at else None,
            "note": self.note,
        }

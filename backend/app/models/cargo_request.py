from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class CargoRequest(Base):
    __tablename__ = "cargo_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    plant_id = Column(Integer, ForeignKey("reference_plants.id"), nullable=True)
    cargo_type_id = Column(Integer, ForeignKey("reference_cargo_types.id"), nullable=True)
    quantity_mt = Column(Float, nullable=False)
    destination_port_id = Column(Integer, ForeignKey("reference_ports.id"), nullable=True)
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="OPEN")  # OPEN, MERGED, CANCELLED
    merged_into_id = Column(Integer, ForeignKey("cargo_requests.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    plant = relationship("ReferencePlant")
    port = relationship("ReferencePort")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "plant_id": self.plant_id,
            "plant_name": self.plant.plant_name if self.plant else None,
            "cargo_type_id": self.cargo_type_id,
            "quantity_mt": self.quantity_mt,
            "destination_port_id": self.destination_port_id,
            "port_name": self.port.port_name if self.port else None,
            "status": self.status,
            "merged_into_id": self.merged_into_id,
            "created_at": self.created_at.isoformat() if hasattr(self.created_at, "isoformat") else str(self.created_at),
        }

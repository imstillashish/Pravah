from datetime import date
from typing import Dict, Any
from sqlalchemy import Column, Integer, String, Boolean, Date, Float
from app.database import Base


class VendorQuote(Base):
    __tablename__ = "vendor_quotes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    quote_request_label = Column(String, nullable=True)
    broker_name = Column(String, nullable=False)
    vessel_type = Column(String, nullable=False)
    quoted_rate_usd_per_mt = Column(Float, nullable=False)
    delivery_days = Column(Integer, nullable=False)
    valid_until = Column(Date, nullable=False)
    is_sample_data = Column(Boolean, default=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "quote_request_label": self.quote_request_label,
            "broker_name": self.broker_name,
            "vessel_type": self.vessel_type,
            "quoted_rate_usd_per_mt": self.quoted_rate_usd_per_mt,
            "delivery_days": self.delivery_days,
            "valid_until": self.valid_until.isoformat() if hasattr(self.valid_until, "isoformat") else str(self.valid_until),
            "is_sample_data": True,
            "sample_data_notice": "These quotes are sample data. Real broker integration is not connected.",
        }

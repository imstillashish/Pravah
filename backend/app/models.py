from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="logistics_planner", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    analyses = relationship("Analysis", back_populates="user", cascade="all, delete-orphan")

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    origin_country = Column(String, nullable=False)
    origin_port = Column(String, nullable=False)
    destination_port = Column(String, nullable=False)
    commodity = Column(String, nullable=False)
    parcel_tonnage = Column(Float, nullable=False)
    recommended_vessel = Column(String, nullable=False)
    predicted_rate_pmt = Column(Float, nullable=False)
    benchmark_spot_pmt = Column(Float, nullable=False)
    estimated_savings_usd = Column(Float, nullable=False)
    status = Column(String, default="draft", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="analyses")

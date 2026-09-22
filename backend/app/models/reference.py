from sqlalchemy import Column, Integer, String, Boolean, Float, Text
from app.database import Base

class ReferencePort(Base):
    __tablename__ = "reference_ports"

    id = Column(Integer, primary_key=True, index=True)
    port_name = Column(String, unique=True, nullable=False)
    locode = Column(String, nullable=True)
    max_loa_m = Column(Float, nullable=False)
    max_beam_m = Column(Float, nullable=False)
    max_draft_m = Column(Float, nullable=False)
    max_dwt_mt = Column(Integer, nullable=False)
    has_lightering = Column(Boolean, default=False)
    lightering_note = Column(Text, nullable=True)
    source = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

class ReferenceVesselClass(Base):
    __tablename__ = "reference_vessel_classes"

    id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String, unique=True, nullable=False)
    dwt_min = Column(Integer, nullable=False)
    dwt_max = Column(Integer, nullable=False)
    typical_draft_m = Column(Float, nullable=False)
    typical_loa_m = Column(Float, nullable=False)
    typical_beam_m = Column(Float, nullable=False)
    avg_speed_knots = Column(Float, nullable=False)

class ReferenceCargoType(Base):
    __tablename__ = "reference_cargo_types"

    id = Column(Integer, primary_key=True, index=True)
    cargo_name = Column(String, unique=True, nullable=False)
    density_mt_per_cbm = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)

class ReferencePlant(Base):
    __tablename__ = "reference_plants"

    id = Column(Integer, primary_key=True, index=True)
    plant_name = Column(String, unique=True, nullable=False)
    location_city = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

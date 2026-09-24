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
    port_type = Column(String, default="DESTINATION", nullable=True)  # "ORIGIN" or "DESTINATION"
    country = Column(String, default="India", nullable=True)
    loading_rate_tpd = Column(Float, default=25000.0, nullable=True)
    typical_waiting_days = Column(Float, default=2.0, nullable=True)
    current_vessels_in_queue = Column(Integer, default=5, nullable=True)
    source = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

class MarketIndicator(Base):
    __tablename__ = "market_indicators"

    id = Column(Integer, primary_key=True, index=True)
    recorded_at = Column(String, nullable=False)
    bdi_composite = Column(Float, nullable=False, default=1845.0)
    bci_capesize = Column(Float, nullable=False, default=2920.0)
    bpi_panamax = Column(Float, nullable=False, default=1640.0)
    bsi_supramax = Column(Float, nullable=False, default=1310.0)
    coking_coal_fob_usd = Column(Float, nullable=False, default=248.5)
    iron_ore_cfr_usd = Column(Float, nullable=False, default=108.2)
    domestic_coal_parity_inr = Column(Float, nullable=False, default=9450.0)
    hrc_steel_usd = Column(Float, nullable=False, default=565.0)
    global_mfg_pmi = Column(Float, nullable=False, default=50.8)
    china_bf_utilization_pct = Column(Float, nullable=False, default=88.4)
    fleet_orderbook_pct = Column(Float, nullable=False, default=8.9)
    bunker_vlsfo_usd = Column(Float, nullable=False, default=625.5)
    usd_inr_rate = Column(Float, nullable=False, default=86.85)

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

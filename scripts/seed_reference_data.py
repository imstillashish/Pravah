"""
Seeds reference data: 4 verified ports, 4 vessel classes, cargo types, and plants.
Tasks 86–91 implementation.
"""
import sys
from pathlib import Path

# Add backend directory to sys.path
_scripts_dir = Path(__file__).resolve().parent
_backend_dir = _scripts_dir.parent / "backend"
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from app.database import SessionLocal, engine, Base
from app.models.reference import (
    ReferencePort,
    ReferenceVesselClass,
    ReferenceCargoType,
    ReferencePlant,
    MarketIndicator,
)
from sqlalchemy import text
from datetime import datetime, timezone


def seed_ports(db):
    """Seed verified load (origin) and discharge (destination) bulk ports with constraints & lineups."""
    # Ensure SQLite columns exist
    with engine.begin() as conn:
        try:
            res = conn.execute(text("PRAGMA table_info(reference_ports);")).fetchall()
            col_names = [r[1] for r in res]
            if "port_type" not in col_names:
                conn.execute(text("ALTER TABLE reference_ports ADD COLUMN port_type VARCHAR(16) DEFAULT 'DESTINATION';"))
            if "country" not in col_names:
                conn.execute(text("ALTER TABLE reference_ports ADD COLUMN country VARCHAR(64) DEFAULT 'India';"))
            if "loading_rate_tpd" not in col_names:
                conn.execute(text("ALTER TABLE reference_ports ADD COLUMN loading_rate_tpd FLOAT DEFAULT 25000.0;"))
            if "typical_waiting_days" not in col_names:
                conn.execute(text("ALTER TABLE reference_ports ADD COLUMN typical_waiting_days FLOAT DEFAULT 2.0;"))
            if "current_vessels_in_queue" not in col_names:
                conn.execute(text("ALTER TABLE reference_ports ADD COLUMN current_vessels_in_queue INTEGER DEFAULT 5;"))
        except Exception:
            pass

    ports = [
        # Indian Discharge Ports
        {
            "id": 1,
            "port_name": "Paradip",
            "locode": "INPRT",
            "max_loa_m": 300.0,
            "max_beam_m": 46.0,
            "max_draft_m": 16.5,
            "max_dwt_mt": 155000,
            "has_lightering": False,
            "lightering_note": None,
            "port_type": "DESTINATION",
            "country": "India",
            "loading_rate_tpd": 22000.0,
            "typical_waiting_days": 2.8,
            "current_vessels_in_queue": 8,
            "source": "VERIFIED_PORT_DATA",
            "is_active": True,
        },
        {
            "id": 2,
            "port_name": "Dhamra",
            "locode": "INDHM",
            "max_loa_m": 290.0,
            "max_beam_m": 47.0,
            "max_draft_m": 18.0,
            "max_dwt_mt": 180000,
            "has_lightering": False,
            "lightering_note": None,
            "port_type": "DESTINATION",
            "country": "India",
            "loading_rate_tpd": 25000.0,
            "typical_waiting_days": 2.0,
            "current_vessels_in_queue": 5,
            "source": "VERIFIED_PORT_DATA",
            "is_active": True,
        },
        {
            "id": 3,
            "port_name": "Gangavaram",
            "locode": "INGGV",
            "max_loa_m": 300.0,
            "max_beam_m": 50.0,
            "max_draft_m": 21.0,
            "max_dwt_mt": 200000,
            "has_lightering": False,
            "lightering_note": None,
            "port_type": "DESTINATION",
            "country": "India",
            "loading_rate_tpd": 30000.0,
            "typical_waiting_days": 1.5,
            "current_vessels_in_queue": 4,
            "source": "VERIFIED_PORT_DATA",
            "is_active": True,
        },
        {
            "id": 4,
            "port_name": "Haldia",
            "locode": "INHAL",
            "max_loa_m": 240.0,
            "max_beam_m": 32.26,
            "max_draft_m": 9.1,
            "max_dwt_mt": 50000,
            "has_lightering": True,
            "lightering_note": "Lightering via Sagar-Sandheads anchorages",
            "port_type": "DESTINATION",
            "country": "India",
            "loading_rate_tpd": 14000.0,
            "typical_waiting_days": 4.5,
            "current_vessels_in_queue": 11,
            "source": "VERIFIED_PORT_DATA",
            "is_active": True,
        },
        # Global Origin Load Ports
        {
            "id": 5,
            "port_name": "Hay Point (DBCT)",
            "locode": "AUHPT",
            "max_loa_m": 300.0,
            "max_beam_m": 50.0,
            "max_draft_m": 19.5,
            "max_dwt_mt": 220000,
            "has_lightering": False,
            "lightering_note": None,
            "port_type": "ORIGIN",
            "country": "Australia",
            "loading_rate_tpd": 45000.0,
            "typical_waiting_days": 3.4,
            "current_vessels_in_queue": 14,
            "source": "VERIFIED_PORT_DATA",
            "is_active": True,
        },
        {
            "id": 6,
            "port_name": "Gladstone",
            "locode": "AUGLT",
            "max_loa_m": 300.0,
            "max_beam_m": 50.0,
            "max_draft_m": 17.5,
            "max_dwt_mt": 180000,
            "has_lightering": False,
            "lightering_note": None,
            "port_type": "ORIGIN",
            "country": "Australia",
            "loading_rate_tpd": 38000.0,
            "typical_waiting_days": 2.2,
            "current_vessels_in_queue": 8,
            "source": "VERIFIED_PORT_DATA",
            "is_active": True,
        },
        {
            "id": 7,
            "port_name": "Newcastle",
            "locode": "AUNTL",
            "max_loa_m": 300.0,
            "max_beam_m": 50.0,
            "max_draft_m": 15.2,
            "max_dwt_mt": 160000,
            "has_lightering": False,
            "lightering_note": None,
            "port_type": "ORIGIN",
            "country": "Australia",
            "loading_rate_tpd": 40000.0,
            "typical_waiting_days": 3.8,
            "current_vessels_in_queue": 16,
            "source": "VERIFIED_PORT_DATA",
            "is_active": True,
        },
        {
            "id": 8,
            "port_name": "Abbot Point",
            "locode": "AUABP",
            "max_loa_m": 300.0,
            "max_beam_m": 50.0,
            "max_draft_m": 18.5,
            "max_dwt_mt": 200000,
            "has_lightering": False,
            "lightering_note": None,
            "port_type": "ORIGIN",
            "country": "Australia",
            "loading_rate_tpd": 42000.0,
            "typical_waiting_days": 1.6,
            "current_vessels_in_queue": 5,
            "source": "VERIFIED_PORT_DATA",
            "is_active": True,
        },
        {
            "id": 9,
            "port_name": "Hampton Roads (Norfolk)",
            "locode": "USORF",
            "max_loa_m": 290.0,
            "max_beam_m": 45.0,
            "max_draft_m": 15.2,
            "max_dwt_mt": 150000,
            "has_lightering": False,
            "lightering_note": None,
            "port_type": "ORIGIN",
            "country": "USA",
            "loading_rate_tpd": 28000.0,
            "typical_waiting_days": 1.8,
            "current_vessels_in_queue": 6,
            "source": "VERIFIED_PORT_DATA",
            "is_active": True,
        },
        {
            "id": 10,
            "port_name": "Baltimore",
            "locode": "USBMT",
            "max_loa_m": 275.0,
            "max_beam_m": 43.0,
            "max_draft_m": 14.5,
            "max_dwt_mt": 120000,
            "has_lightering": False,
            "lightering_note": None,
            "port_type": "ORIGIN",
            "country": "USA",
            "loading_rate_tpd": 24000.0,
            "typical_waiting_days": 1.4,
            "current_vessels_in_queue": 4,
            "source": "VERIFIED_PORT_DATA",
            "is_active": True,
        },
        {
            "id": 11,
            "port_name": "Maputo (Matola Coal)",
            "locode": "MZMPM",
            "max_loa_m": 230.0,
            "max_beam_m": 37.0,
            "max_draft_m": 13.0,
            "max_dwt_mt": 85000,
            "has_lightering": False,
            "lightering_note": None,
            "port_type": "ORIGIN",
            "country": "Mozambique",
            "loading_rate_tpd": 18000.0,
            "typical_waiting_days": 4.1,
            "current_vessels_in_queue": 7,
            "source": "VERIFIED_PORT_DATA",
            "is_active": True,
        },
        {
            "id": 12,
            "port_name": "Beira",
            "locode": "MZBEW",
            "max_loa_m": 200.0,
            "max_beam_m": 32.0,
            "max_draft_m": 10.5,
            "max_dwt_mt": 55000,
            "has_lightering": False,
            "lightering_note": None,
            "port_type": "ORIGIN",
            "country": "Mozambique",
            "loading_rate_tpd": 12000.0,
            "typical_waiting_days": 3.6,
            "current_vessels_in_queue": 5,
            "source": "VERIFIED_PORT_DATA",
            "is_active": True,
        },
        {
            "id": 13,
            "port_name": "Samarinda",
            "locode": "IDSRI",
            "max_loa_m": 230.0,
            "max_beam_m": 36.0,
            "max_draft_m": 12.0,
            "max_dwt_mt": 75000,
            "has_lightering": False,
            "lightering_note": None,
            "port_type": "ORIGIN",
            "country": "Indonesia",
            "loading_rate_tpd": 20000.0,
            "typical_waiting_days": 2.9,
            "current_vessels_in_queue": 10,
            "source": "VERIFIED_PORT_DATA",
            "is_active": True,
        },
        {
            "id": 14,
            "port_name": "Balikpapan",
            "locode": "IDBPN",
            "max_loa_m": 250.0,
            "max_beam_m": 40.0,
            "max_draft_m": 13.5,
            "max_dwt_mt": 85000,
            "has_lightering": False,
            "lightering_note": None,
            "port_type": "ORIGIN",
            "country": "Indonesia",
            "loading_rate_tpd": 22000.0,
            "typical_waiting_days": 2.1,
            "current_vessels_in_queue": 6,
            "source": "VERIFIED_PORT_DATA",
            "is_active": True,
        },
    ]

    for p in ports:
        existing = db.query(ReferencePort).filter(ReferencePort.port_name == p["port_name"]).first()
        if not existing:
            db.add(ReferencePort(**p))
        else:
            for k, v in p.items():
                setattr(existing, k, v)
    db.commit()
    print("  [x] Seeded 14 verified load & discharge ports with infrastructure and congestion metrics")



def seed_vessel_classes(db):
    """Task 87: Seed 4 vessel classes."""
    vessels = [
        {
            "id": 1,
            "class_name": "Handysize",
            "dwt_min": 25000,
            "dwt_max": 40000,
            "typical_draft_m": 9.5,
            "typical_loa_m": 180.0,
            "typical_beam_m": 28.0,
            "avg_speed_knots": 13.0,
        },
        {
            "id": 2,
            "class_name": "Supramax",
            "dwt_min": 50000,
            "dwt_max": 65000,
            "typical_draft_m": 12.8,
            "typical_loa_m": 200.0,
            "typical_beam_m": 32.0,
            "avg_speed_knots": 13.5,
        },
        {
            "id": 3,
            "class_name": "Panamax",
            "dwt_min": 65000,
            "dwt_max": 90000,
            "typical_draft_m": 14.2,
            "typical_loa_m": 225.0,
            "typical_beam_m": 32.2,
            "avg_speed_knots": 13.0,
        },
        {
            "id": 4,
            "class_name": "Capesize",
            "dwt_min": 100000,
            "dwt_max": 200000,
            "typical_draft_m": 18.2,
            "typical_loa_m": 292.0,
            "typical_beam_m": 45.0,
            "avg_speed_knots": 14.5,
        },
    ]

    for v in vessels:
        existing = db.query(ReferenceVesselClass).filter(ReferenceVesselClass.class_name == v["class_name"]).first()
        if not existing:
            db.add(ReferenceVesselClass(**v))
    db.commit()
    print("  [x] Seeded 4 reference vessel classes (Handysize, Supramax, Panamax, Capesize)")


def seed_cargo_types(db):
    """Task 88: Seed cargo types."""
    cargos = [
        {"cargo_name": "coking_coal", "density_mt_per_cbm": 0.85, "is_active": True},
        {"cargo_name": "thermal_coal", "density_mt_per_cbm": 0.75, "is_active": True},
        {"cargo_name": "iron_ore", "density_mt_per_cbm": 2.20, "is_active": True},
        {"cargo_name": "limestone", "density_mt_per_cbm": 1.45, "is_active": True},
    ]

    for c in cargos:
        existing = db.query(ReferenceCargoType).filter(ReferenceCargoType.cargo_name == c["cargo_name"]).first()
        if not existing:
            db.add(ReferenceCargoType(**c))
    db.commit()
    print("  [x] Seeded cargo types (coking_coal, thermal_coal, iron_ore, limestone)")


def seed_plants(db):
    """Task 89: Seed 5 plants."""
    plants = [
        {"plant_name": "Bhilai", "location_city": "Bhilai", "is_active": True},
        {"plant_name": "Rourkela", "location_city": "Rourkela", "is_active": True},
        {"plant_name": "Durgapur", "location_city": "Durgapur", "is_active": True},
        {"plant_name": "Bokaro", "location_city": "Bokaro", "is_active": True},
        {"plant_name": "Burnpur", "location_city": "Asansol", "is_active": True},
    ]

    for p in plants:
        existing = db.query(ReferencePlant).filter(ReferencePlant.plant_name == p["plant_name"]).first()
        if not existing:
            db.add(ReferencePlant(**p))
    db.commit()
    print("  [x] Seeded 5 reference plants (Bhilai, Rourkela, Durgapur, Bokaro, Burnpur)")


def seed_market_indicators(db):
    """Seed initial global Baltic, commodity and macroeconomic indicators."""
    existing = db.query(MarketIndicator).first()
    if not existing:
        indicator = MarketIndicator(
            recorded_at=datetime.now(timezone.utc).isoformat(),
            bdi_composite=1845.0,
            bci_capesize=2920.0,
            bpi_panamax=1640.0,
            bsi_supramax=1310.0,
            coking_coal_fob_usd=248.50,
            iron_ore_cfr_usd=108.20,
            domestic_coal_parity_inr=9450.0,
            hrc_steel_usd=565.0,
            global_mfg_pmi=50.8,
            china_bf_utilization_pct=88.4,
            fleet_orderbook_pct=8.9,
            bunker_vlsfo_usd=625.50,
            usd_inr_rate=86.85,
        )
        db.add(indicator)
        db.commit()
        print("  [x] Seeded global market indicators (BDI, Coking Coal FOB, Iron Ore, PMI)")


def seed_all_reference_data():
    """Runs all reference data seed functions in order."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("Seeding Reference Data...")
        seed_ports(db)
        seed_vessel_classes(db)
        seed_cargo_types(db)
        seed_plants(db)
        seed_market_indicators(db)
        print("Reference Data Seeding Complete!")
    finally:
        db.close()



if __name__ == "__main__":
    seed_all_reference_data()

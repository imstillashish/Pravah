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
)


def seed_ports(db):
    """Task 86: Seed 4 ports with verified constraints."""
    ports = [
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
            "source": "VERIFIED_PORT_DATA",
            "is_active": True,
        },
    ]

    for p in ports:
        existing = db.query(ReferencePort).filter(ReferencePort.port_name == p["port_name"]).first()
        if not existing:
            db.add(ReferencePort(**p))
    db.commit()
    print("  [x] Seeded 4 reference ports (Paradip, Dhamra, Gangavaram, Haldia)")


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


def seed_all_reference_data():
    """Runs all 4 reference data seed functions in order."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("Seeding Reference Data...")
        seed_ports(db)
        seed_vessel_classes(db)
        seed_cargo_types(db)
        seed_plants(db)
        print("Reference Data Seeding Complete!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_all_reference_data()

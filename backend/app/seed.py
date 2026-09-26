"""Idempotent seed of PRD 7.1 master data + demo users.
Data provenance: hand-curated from PRD (SEED) / public port authority figures (VERIFIED_EXTERNAL).
"""
from datetime import date

from sqlalchemy.orm import Session

from app.database import Base
from app.models import (CargoType, DisruptionAlert, Port, User, VesselClass, Plant)
from app.security import hash_password

PORTS = [
    # locode, name, country, lat, lon, origin, dest, draft_lo, draft_hi, loa, beam, air, disch, lighter, note, dues
    ("AUHPT", "Hay Point", "AU", -21.2760, 149.3100, True, False, None, None, None, None, None, None, False, None, 0.0),
    ("AUGLT", "Gladstone", "AU", -23.8430, 151.2440, True, False, None, None, None, None, None, None, False, None, 0.0),
    ("USHRO", "Hampton Roads", "US", 36.9667, -76.3500, True, False, None, None, None, None, None, None, False, None, 0.0),
    ("MZBEZ", "Beira", "MZ", -19.8333, 34.9000, True, False, 9.5, 11.0, 260, 45, None, 8000, False, None, 0.25),
    ("IDBAL", "Balikpapan", "ID", -1.2400, 116.8500, True, False, 11.0, 12.5, 225, 40, None, 12000, False, None, 0.20),
    ("RUVVO", "Vostochny", "RU", 42.7667, 133.0667, True, False, 15.0, 16.5, 290, 48, None, 15000, False, None, 0.30),
    ("INPRT", "Paradip", "IN", 20.3167, 86.6167, False, True, 12.8, 15.0, 280, 47, 40, 20000, False, None, 0.32),
    ("INVIZ", "Visakhapatnam", "IN", 17.6868, 83.2185, False, True, 14.0, 16.5, 300, 49, 42, 25000, False, None, 0.35),
    ("INGNR", "Gangavaram", "IN", 17.6167, 83.2333, False, True, 15.0, 17.0, 320, 50, 43, 22000, False, None, 0.30),
    ("INGPU", "Gopalpur", "IN", 19.3167, 84.9167, False, True, 9.0, 10.5, 190, 32, 30, 8000, True, "Partial lightering for >55k DWT", 0.22),
    ("INDHR", "Dhamra", "IN", 20.8033, 86.9633, False, True, 14.5, 16.8, 300, 50, 42, 24000, False, None, 0.33),
    ("INHLD", "Haldia", "IN", 22.0667, 88.0667, False, True, 8.5, 10.5, 200, 34, 32, 12000, True, "Capesize lightens at Sandheads", 0.28),
    ("INSAG", "Sagar-Sandheads", "IN", 21.6500, 88.0500, False, True, 11.0, 13.0, 250, 45, None, 15000, True, "Lightering anchorage", 0.15),
]

VESSELS = [
    # name, dwt_min, dwt_max, draft, loa, beam, speed, fuel, hire
    ("HANDYSIZE", 28000, 39000, 10.0, 180, 30, 13.0, 20.0, 12000),
    ("SUPRAMAX", 50000, 65000, 12.3, 200, 32.3, 13.5, 28.0, 15500),
    ("PANAMAX", 70000, 85000, 13.5, 229, 32.3, 13.0, 33.0, 13500),
    ("CAPESIZE", 120000, 180000, 17.5, 292, 45, 12.5, 55.0, 18000),
]

PLANTS = [
    # code, name, city, burn, yard, buffer, port_locode, rake_days
    ("BSP", "Bhilai Steel Plant", "Bhilai", 14000, 350000, 14, "INVIZ", 3),
    ("RSP", "Rourkela Steel Plant", "Rourkela", 10000, 280000, 14, "INPRT", 2),
    ("BSL", "Bokaro Steel Plant", "Bokaro", 12000, 300000, 14, "INHLD", 4),
    ("DSP", "Durgapur Steel Plant", "Durgapur", 9000, 220000, 14, "INHLD", 3),
    ("ISP", "IISCO Steel Plant", "Burnpur", 8000, 180000, 14, "INHLD", 2),
]

CARGOS = [("COKING_COAL", 0.85), ("THERMAL_COAL", 0.80)]

ALERTS = [
    ("Red Sea shipping diversions add 10-14 days sailing time around Cape of Good Hope",
     "Maritime Executive", "red sea", "RED_SEA", "CRITICAL"),
    ("Bay of Bengal seasonal cyclone watch issued for Odisha coast ports",
     "IMD Marine Advisory", "cyclone", "BAY_OF_BENGAL", "WATCH"),
    ("Strait of Hormuz tanker transit security level elevated",
     "Lloyd's List", "hormuz", "HORMUZ", "WATCH"),
]


def run(engine) -> None:
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        if db.query(Port).count() == 0:
            for row in PORTS:
                db.add(Port(source="SEED", classification="VERIFIED_EXTERNAL",
                            **dict(zip([
                                "locode", "name", "country", "lat", "lon", "is_origin",
                                "is_destination", "max_draft_low_tide_m", "max_draft_high_tide_m",
                                "max_loa_m", "max_beam_m", "max_air_draft_m",
                                "discharge_rate_mt_day", "lightering_flag", "lightering_note",
                                "port_dues_per_grt_usd"], row))))
        if db.query(VesselClass).count() == 0:
            for r in VESSELS:
                db.add(VesselClass(name=r[0], dwt_min=r[1], dwt_max=r[2], typical_draft_m=r[3],
                                   typical_loa_m=r[4], typical_beam_m=r[5], avg_speed_knots=r[6],
                                   fuel_consumption_mt_day=r[7], typical_daily_hire_usd=r[8]))
        if db.query(Plant).count() == 0:
            locode_to_id = {p.locode: p.id for p in db.query(Port).all()}
            for code, name, city, burn, yard, buf, locode, rake in PLANTS:
                db.add(Plant(code=code, name=name, city=city, daily_burn_mt=burn,
                             stockyard_capacity_mt=yard, safety_buffer_days=buf,
                             serving_port_id=locode_to_id.get(locode), rake_transit_days=rake))
        if db.query(CargoType).count() == 0:
            for n, d in CARGOS:
                db.add(CargoType(name=n, density_mt_cbm=d))
        if db.query(User).count() == 0:
            db.add(User(email="demo@sail.in", password_hash=hash_password("demo1234"),
                        full_name="Demo Chartering Officer", role="chartering_desk"))
            db.add(User(email="admin@sail.in", password_hash=hash_password("admin1234"),
                        full_name="PRAVAH Admin", role="admin"))
        if db.query(DisruptionAlert).count() == 0:
            for headline, src, kw, region, sev in ALERTS:
                db.add(DisruptionAlert(headline=headline, source_name=src, keyword_matched=kw,
                                       region=region, severity=sev, source="SEED",
                                       classification="SEED", published_at=None))
        db.commit()

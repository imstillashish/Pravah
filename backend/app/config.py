import os
from pathlib import Path
from typing import List

_backend_dir = Path(__file__).resolve().parent.parent
_default_sqlite_path = (_backend_dir / "logistics.db").as_posix()

class Settings:
    _raw_db = os.getenv("DATABASE_URL", f"sqlite:///{_default_sqlite_path}")
    DATABASE_URL: str = _raw_db

    def __init__(self):
        # ponytail: reload DATABASE_URL from env on init to allow runtime monkeypatching
        _raw = os.getenv("DATABASE_URL", self.DATABASE_URL)
        # Normalize Render's postgres:// → postgresql+psycopg2:// (forces psycopg2 driver,
        # avoids SQLAlchemy defaulting to psycopg3 on python 3.14)
        if _raw.startswith("postgres://"):
            _raw = "postgresql+psycopg2://" + _raw[len("postgres://"):]
        elif _raw.startswith("postgresql://") and "+psycopg" not in _raw:
            _raw = _raw.replace("postgresql://", "postgresql+psycopg2://", 1)
        self.DATABASE_URL = _raw

    SECRET_KEY: str = os.getenv("SECRET_KEY", os.getenv("JWT_SECRET_KEY", "sih26006_dev_secret_key_change_in_production_987123"))
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", SECRET_KEY)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRY_MINUTES", 1440))
    JWT_EXPIRY_MINUTES: int = ACCESS_TOKEN_EXPIRE_MINUTES

    SHIP_AND_BUNKER_BASE_URL: str = os.getenv("SHIP_AND_BUNKER_BASE_URL", "https://shipandbunker.com/prices")
    BDRY_DATA_SOURCE_URL: str = os.getenv("BDRY_DATA_SOURCE_URL", "https://balticexchange.com/en/data-services/market-information.html")
    WORLD_BANK_PINK_SHEET_URL: str = os.getenv("WORLD_BANK_PINK_SHEET_URL", "https://www.worldbank.org/en/research/commodity-markets")
    RBI_FOREX_FEED_URL: str = os.getenv("RBI_FOREX_FEED_URL", "https://www.rbi.org.in/scripts/ReferenceRateArchive.aspx")
    WEATHER_API_BASE_URL: str = os.getenv("WEATHER_API_BASE_URL", "https://api.open-meteo.com/v1/forecast")
    MODEL_REGISTRY_PATH: str = os.getenv("MODEL_REGISTRY_PATH", "ml/models")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    CORS_ALLOWED_ORIGINS: List[str] = ["*"]
    ADMIN_UPLOAD_MAX_MB: int = int(os.getenv("ADMIN_UPLOAD_MAX_MB", 20))
    SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")

settings = Settings()

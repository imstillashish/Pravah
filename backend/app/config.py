import os
from typing import List

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./logistics.db")
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

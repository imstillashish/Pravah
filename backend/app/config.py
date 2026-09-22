import os

class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sih26006_dev_secret_key_change_in_production_987123")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./logistics.db")

settings = Settings()

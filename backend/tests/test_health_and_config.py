import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import Settings

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "pravah-backend"

def test_database_url_normalization(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgres://user:pass@host:5432/dbname")
    custom_settings = Settings()
    assert custom_settings.DATABASE_URL.startswith("postgresql://")
    assert not custom_settings.DATABASE_URL.startswith("postgres://")

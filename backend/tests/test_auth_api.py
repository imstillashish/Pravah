import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_auth_workflow():
    # 1. Signup
    res = client.post("/api/auth/signup", json={
        "full_name": "Arjun Verma",
        "email": "arjun@sail.gov.in",
        "password": "Password123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "logistics_planner"
    token = data["access_token"]

    # 2. Get Me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "arjun@sail.gov.in"

    # 3. Switch Role
    switch_res = client.post(
        "/api/auth/switch-role",
        headers={"Authorization": f"Bearer {token}"},
        json={"target_role": "port_operator"}
    )
    assert switch_res.status_code == 200
    switch_data = switch_res.json()
    assert switch_data["user"]["role"] == "port_operator"

def test_login_invalid_password():
    client.post("/api/auth/signup", json={
        "full_name": "Arjun Verma",
        "email": "planner@sail.gov.in",
        "password": "CorrectPassword123"
    })
    res = client.post("/api/auth/login", json={
        "email": "planner@sail.gov.in",
        "password": "WrongPassword"
    })
    assert res.status_code == 400
    assert "didn't match" in res.json()["detail"]

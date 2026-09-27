from app.security import hash_password, verify_password, create_access_token, decode_access_token

def test_password_hashing():
    pw = "SuperSecure123"
    hashed = hash_password(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True
    assert verify_password("wrongpw", hashed) is False

def test_token_lifecycle():
    token = create_access_token({"sub": "planner@sail.gov.in", "role": "logistics_planner"})
    payload = decode_access_token(token)
    assert payload["sub"] == "planner@sail.gov.in"
    assert payload["role"] == "logistics_planner"

def test_demo_logins():
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    for email in ["demo@sail.gov.in", "portops@sail.gov.in", "admin@sail.gov.in"]:
        res = client.post("/api/auth/login", json={"email": email, "password": "Password123"})
        assert res.status_code == 200, f"Login failed for {email}: {res.text}"
        data = res.json()
        assert "access_token" in data
        assert data["user"]["email"] == email

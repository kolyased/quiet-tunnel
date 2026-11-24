from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
KEY = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="


def test_health_and_demo_capabilities():
    assert client.get("/api/v1/health").json() == {"status": "ok"}
    assert client.get("/api/v1/capabilities").json()["real_generation_enabled"] is False


def test_registration_is_disabled_and_does_not_echo_key():
    response = client.post("/api/v1/warp/register", json={"public_key": KEY, "terms_accepted": True, "format": "wireguard"}, headers={"origin": "http://localhost:3000"})
    assert response.status_code == 501
    assert KEY not in response.text


def test_invalid_key_rejected():
    response = client.post("/api/v1/warp/register", json={"public_key": "private-key", "terms_accepted": True, "format": "wireguard"}, headers={"origin": "http://localhost:3000"})
    assert response.status_code == 422


def test_extra_fields_rejected():
    response = client.post("/api/v1/warp/register", json={"public_key": KEY, "terms_accepted": True, "format": "wireguard", "private_key": "secret"}, headers={"origin": "http://localhost:3000"})
    assert response.status_code == 422

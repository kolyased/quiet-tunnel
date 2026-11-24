import pytest
from fastapi.testclient import TestClient

from app import main
from app.auth import hash_password, issue_session
from app.providers.mock import MockVPNProvider

client = TestClient(main.app)
KEY = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
SESSION_SECRET = "test-session-secret-value-at-least-32-bytes"


@pytest.fixture(autouse=True)
def test_settings(monkeypatch):
    monkeypatch.setattr(main.settings, "app_mode", "mock")
    monkeypatch.setattr(main.settings, "vpn_provider", "mock")
    monkeypatch.setattr(main.settings, "auth_password_hash", hash_password("secure-test-password"))
    monkeypatch.setattr(main.settings, "auth_session_secret", SESSION_SECRET)
    monkeypatch.setattr(main.settings, "app_env", "production")
    monkeypatch.setattr(main.settings, "rate_limit_requests", 30)
    monkeypatch.setattr(main, "_provider", MockVPNProvider())
    main._hits.clear()
    main._login_failures.clear()


def owner_headers():
    token = issue_session(SESSION_SECRET, 4_000_000_000)
    return {"origin": "http://localhost:3000", "cookie": f"quiet_tunnel_session={token}"}


def test_health_and_live_mock_capabilities():
    assert client.get("/api/v1/health").json() == {"status": "ok"}
    response = client.get("/api/v1/capabilities").json()
    assert response["mode"] == "mock"
    assert response["provider"] == "mock"
    assert response["available"] is True
    assert response["real_provider"] is False
    assert response["formats"] == ["wireguard"]


def test_owner_auth_cookie_and_logout():
    bad = client.post("/api/v1/auth/login", json={"password": "wrong"}, headers={"origin": "http://localhost:3000"})
    assert bad.status_code == 401
    login = client.post("/api/v1/auth/login", json={"password": "secure-test-password"}, headers={"origin": "http://localhost:3000"})
    assert login.status_code == 200
    cookie = login.headers["set-cookie"]
    assert "HttpOnly" in cookie and "Secure" in cookie and "SameSite=strict" in cookie
    assert "secure-test-password" not in cookie
    assert client.get("/api/v1/auth/session", headers={"cookie": cookie.split(";", 1)[0]}).json() == {"authenticated": True}
    logout = client.post("/api/v1/auth/logout", headers={"origin": "http://localhost:3000"})
    assert logout.status_code == 200
    assert client.get("/api/v1/auth/session").json() == {"authenticated": False}


def test_generation_requires_owner_and_builds_from_public_key_only():
    body = {"public_key": KEY, "format": "wireguard", "platform": "android"}
    unauthorized = client.post("/api/v1/generate", json=body, headers={"origin": "http://localhost:3000"})
    assert unauthorized.status_code == 401
    response = client.post("/api/v1/generate", json=body, headers=owner_headers())
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "mock"
    assert data["parameters"]["endpoint"] == "198.51.100.1"
    assert "private_key" not in response.text.lower()
    assert "PrivateKey" not in response.text
    assert data["notice"]


def test_private_key_or_unknown_fields_are_rejected():
    body = {"public_key": KEY, "format": "wireguard", "platform": "android", "private_key": "secret"}
    response = client.post("/api/v1/generate", json=body, headers=owner_headers())
    assert response.status_code == 422
    assert "secret" not in response.text


def test_invalid_public_key_rejected():
    response = client.post("/api/v1/generate", json={"public_key": "not-a-key", "format": "wireguard", "platform": "android"}, headers=owner_headers())
    assert response.status_code == 422


def test_personal_cloudflare_adapter_stays_disabled(monkeypatch):
    from app.providers.cloudflare import CloudflareWarpProvider

    provider = CloudflareWarpProvider()
    availability = client.get("/api/v1/capabilities")
    assert availability.status_code == 200
    monkeypatch.setattr(main.settings, "app_mode", "personal")
    monkeypatch.setattr(main, "_provider", provider)
    status = client.get("/api/v1/capabilities").json()
    assert status["available"] is False
    assert status["formats"] == []
    response = client.post("/api/v1/generate", json={"public_key": KEY, "format": "wireguard", "platform": "android"}, headers=owner_headers())
    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "PROVIDER_UNAVAILABLE"


def test_registration_rate_limit(monkeypatch):
    monkeypatch.setattr(main.settings, "rate_limit_requests", 1)
    body = {"public_key": KEY, "format": "wireguard", "platform": "android"}
    headers = owner_headers()
    assert client.post("/api/v1/generate", json=body, headers=headers).status_code == 200
    assert client.post("/api/v1/generate", json=body, headers=headers).status_code == 429

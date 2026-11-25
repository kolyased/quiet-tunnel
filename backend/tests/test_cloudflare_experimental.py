import asyncio
import json

import httpx
import pytest

from app.core.config import settings
from app.core.exceptions import ProviderUnavailable
from app.providers.cloudflare import CloudflareWarpProvider
from app.providers.models import RegistrationRequest

KEY = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="


def request(accepted=True):
    return RegistrationRequest(public_key=KEY, platform="linux", terms_accepted=accepted)


def test_disabled_default(monkeypatch):
    monkeypatch.setattr(settings, "warp_experimental_enabled", False)
    assert not asyncio.run(CloudflareWarpProvider().availability()).available
    with pytest.raises(ProviderUnavailable):
        asyncio.run(CloudflareWarpProvider().register(request()))


def test_mock_http_flow(monkeypatch):
    monkeypatch.setattr(settings, "warp_experimental_enabled", True)
    calls = []
    def handler(req):
        calls.append(req.method)
        assert req.url.host == "api.cloudflareclient.com"
        assert req.headers["User-Agent"].startswith("Quiet-Tunnel/")
        body = json.loads(req.content)
        assert "private_key" not in body
        if req.method == "POST":
            assert body["key"] == KEY
            return httpx.Response(200, json={"result": {"id": "example", "token": "test-token"}})
        assert req.headers["Authorization"] == "Bearer test-token"
        return httpx.Response(200, json={"result": {"config": {
            "interface": {"addresses": {"v4": "192.0.2.2", "v6": "2001:db8::2"}},
            "peers": [{"public_key": KEY, "endpoint": {"host": "example.invalid:2408"}}],
        }}})
    provider = CloudflareWarpProvider(transport=httpx.MockTransport(handler))
    with pytest.raises(ProviderUnavailable):
        asyncio.run(provider.register(request(False)))
    assert calls == []
    result = asyncio.run(provider.register(request()))
    assert result.endpoint == "example.invalid" and result.port == 2408
    assert calls == ["POST", "PATCH"]
    assert "test-token" not in result.model_dump_json()


def test_access_denied_no_retries(monkeypatch):
    monkeypatch.setattr(settings, "warp_experimental_enabled", True)
    calls = []
    def handler(req):
        calls.append(req.method)
        return httpx.Response(403)
    provider = CloudflareWarpProvider(transport=httpx.MockTransport(handler))
    with pytest.raises(ProviderUnavailable, match="403"):
        asyncio.run(provider.register(request()))
    assert calls == ["POST"]

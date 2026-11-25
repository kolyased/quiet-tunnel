"""Experimental, unsupported consumer WARP integration.

No client impersonation, automatic retries or TLS verification overrides.
Enable only after confirming permission for this registration flow.
"""
from datetime import datetime, timezone
from ipaddress import ip_address, ip_interface
import re
from urllib.parse import quote, urlsplit

import httpx
from pydantic import ValidationError

from ..core.config import settings
from ..core.exceptions import InvalidProviderResponse, ProviderError, ProviderTimeout, ProviderUnavailable, UnsupportedFormat
from .base import VPNProvider
from .models import ConnectionParameters, ProviderAvailability, RegistrationRequest

API = "https://api.cloudflareclient.com/v0i1909051800/"


class CloudflareWarpProvider(VPNProvider):
    name = "cloudflare-warp"

    def __init__(self, *, transport: httpx.AsyncBaseTransport | None = None):
        self._transport = transport

    async def availability(self) -> ProviderAvailability:
        enabled = settings.warp_experimental_enabled
        return ProviderAvailability(
            available=enabled, provider=self.name,
            formats=["wireguard"] if enabled else [], real_provider=enabled,
            reason=("Experimental, unsupported WARP integration; tunnel connectivity is not verified."
                    if enabled else "Experimental WARP integration is disabled."),
        )

    @staticmethod
    async def _call(client: httpx.AsyncClient, method: str, path: str, **kwargs) -> dict:
        try:
            response = await client.request(method, path, **kwargs)
        except httpx.TimeoutException:
            raise ProviderTimeout("WARP request timed out; do not retry automatically.") from None
        except httpx.RequestError:
            raise ProviderUnavailable("Could not reach WARP API.") from None
        if response.status_code in (401, 403, 429):
            raise ProviderUnavailable(f"WARP declined access (HTTP {response.status_code}); stop and check provider requirements.")
        if not response.is_success:
            raise ProviderError(f"WARP returned HTTP {response.status_code}.")
        try:
            data = response.json()
            if not isinstance(data, dict) or data.get("success") is False:
                raise ValueError
            result = data["result"]
            if not isinstance(result, dict):
                raise ValueError
            return result
        except (ValueError, KeyError, TypeError):
            raise InvalidProviderResponse("Unexpected WARP response.") from None

    async def register(self, request: RegistrationRequest) -> ConnectionParameters:
        if not settings.warp_experimental_enabled:
            raise ProviderUnavailable("Experimental WARP integration is disabled.")
        if request.format != "wireguard":
            raise UnsupportedFormat("Only standard WireGuard is available.")
        if not request.terms_accepted:
            raise ProviderUnavailable("Explicit acceptance of applicable WARP terms is required.")
        async with httpx.AsyncClient(
            base_url=API, timeout=settings.provider_timeout_seconds,
            headers={"User-Agent": "Quiet-Tunnel/0.3 experimental", "Accept": "application/json"},
            follow_redirects=False, trust_env=False, transport=self._transport,
        ) as client:
            registration = await self._call(client, "POST", "reg", json={
                "key": request.public_key,
                "tos": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "install_id": "", "fcm_token": "", "locale": "en_US",
                "type": request.platform,
            })
            try:
                reg_id, token = registration["id"], registration["token"]
                if (not isinstance(reg_id, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,128}", reg_id)
                        or not isinstance(token, str) or not token):
                    raise ValueError
            except (KeyError, TypeError, ValueError):
                raise InvalidProviderResponse("WARP did not provide registration credentials.") from None
            result = await self._call(client, "PATCH", "reg/" + quote(reg_id, safe=""),
                                      headers={"Authorization": "Bearer " + token}, json={"warp_enabled": True})
        return self._parameters(result)

    @staticmethod
    def _parameters(result: dict) -> ConnectionParameters:
        try:
            config = result["config"]
            addresses = config["interface"]["addresses"]
            peer = config["peers"][0]
            endpoint = peer["endpoint"]
            # Use the actual returned endpoint, not a hard-coded address or spoofing parameters.
            raw = endpoint.get("host") or endpoint.get("v4") or endpoint.get("v6")
            if not isinstance(raw, str) or not raw:
                raise ValueError
            try:
                ip_address(raw)
                host, port = raw, None
            except ValueError:
                parsed = urlsplit("//" + raw)
                if parsed.username or parsed.password or parsed.path or parsed.query or parsed.fragment:
                    raise ValueError
                host, port = parsed.hostname, parsed.port
            if not host or any(c.isspace() for c in host):
                raise ValueError
            if not port:
                ports = endpoint.get("ports") or []
                if not ports:
                    raise ValueError
                port = ports[0]
            ipv4 = ip_interface(addresses["v4"])
            ipv6 = ip_interface(addresses["v6"]) if addresses.get("v6") else None
            if ipv4.version != 4 or (ipv6 and ipv6.version != 6):
                raise ValueError
            return ConnectionParameters(
                ipv4_address=ipv4, ipv6_address=ipv6,
                server_public_key=peer["public_key"], endpoint=host, port=port,
                dns=["1.1.1.1", "1.0.0.1"], mtu=1280,
                allowed_ips=["0.0.0.0/0", "::/0"] if ipv6 else ["0.0.0.0/0"],
                persistent_keepalive=25, additional_parameters={},
            )
        except (KeyError, IndexError, TypeError, ValueError, AttributeError, ValidationError):
            raise InvalidProviderResponse("WARP response lacks valid connection parameters.") from None

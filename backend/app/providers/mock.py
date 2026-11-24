from typing import Any

from .base import VPNProvider


class MockVPNProvider(VPNProvider):
    async def register(self, public_key: str) -> dict[str, Any]:
        del public_key
        raise RuntimeError("Demo mode does not issue working VPN profiles")

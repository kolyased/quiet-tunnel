from typing import Any

from .base import VPNProvider


class CloudflareWarpProvider(VPNProvider):
    async def register(self, public_key: str) -> dict[str, Any]:
        del public_key
        raise RuntimeError("Cloudflare WARP registration is disabled: no supported public API has been established")

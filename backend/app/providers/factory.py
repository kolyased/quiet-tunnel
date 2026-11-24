from ..core.config import Settings
from .base import VPNProvider
from .cloudflare import CloudflareWarpProvider
from .mock import MockVPNProvider


def create_provider(settings: Settings) -> VPNProvider | None:
    if settings.app_mode == "disabled":
        return None
    if settings.app_mode == "mock":
        return MockVPNProvider()
    if settings.app_mode == "personal" and settings.vpn_provider == "cloudflare":
        return CloudflareWarpProvider()
    return None

"""Cloudflare provider adapter template.

No network request is made by this module. The consumer WARP registration flow
has no supported integration approved for this application. Keep this adapter
unavailable until a provider-supported, permitted interface is established.
"""

from .base import VPNProvider
from .models import ConnectionParameters, ProviderAvailability, RegistrationRequest
from ..core.exceptions import ProviderUnavailable


class CloudflareWarpProvider(VPNProvider):
    name = "cloudflare-warp"

    async def availability(self) -> ProviderAvailability:
        return ProviderAvailability(
            available=False,
            provider=self.name,
            formats=[],
            real_provider=False,
            reason="No approved provider integration is configured.",
        )

    async def register(self, request: RegistrationRequest) -> ConnectionParameters:
        del request
        raise ProviderUnavailable("Cloudflare registration is not configured.")

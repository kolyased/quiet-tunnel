from .base import VPNProvider
from .models import ConnectionParameters, ProviderAvailability, RegistrationRequest


class MockVPNProvider(VPNProvider):
    """Deterministic fixture provider. All addresses are documentation-only."""

    name = "mock"

    async def availability(self) -> ProviderAvailability:
        return ProviderAvailability(
            available=True,
            provider=self.name,
            formats=["wireguard"],
            real_provider=False,
            reason="Mock values use reserved TEST-NET addresses and cannot connect.",
        )

    async def register(self, request: RegistrationRequest) -> ConnectionParameters:
        del request
        return ConnectionParameters(
            ipv4_address="192.0.2.2/32",
            ipv6_address="2001:db8::2/128",
            server_public_key="BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=",
            endpoint="198.51.100.1",
            port=51820,
            dns=["1.1.1.1", "2606:4700:4700::1111"],
            mtu=1280,
            allowed_ips=["0.0.0.0/0", "::/0"],
            persistent_keepalive=25,
        )

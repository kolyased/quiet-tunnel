from abc import ABC, abstractmethod

from .models import ConnectionParameters, ProviderAvailability, RegistrationRequest


class VPNProvider(ABC):
    name: str

    @abstractmethod
    async def availability(self) -> ProviderAvailability:
        """Report whether this provider can currently create profiles."""

    @abstractmethod
    async def register(self, request: RegistrationRequest) -> ConnectionParameters:
        """Register a public key and return validated connection parameters."""

from abc import ABC, abstractmethod
from typing import Any


class VPNProvider(ABC):
    @abstractmethod
    async def register(self, public_key: str) -> dict[str, Any]:
        """Register only a public key and return sanitized connection parameters."""

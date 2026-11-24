from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, IPvAnyAddress, IPvAnyInterface, IPvAnyNetwork, field_validator


class ProviderAvailability(BaseModel):
    available: bool
    provider: str
    reason: str | None = None
    formats: list[Literal["wireguard", "amneziawg"]] = Field(default_factory=list)
    real_provider: bool = False


class RegistrationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    public_key: str = Field(pattern=r"^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw048]=$", max_length=44)
    format: Literal["wireguard", "amneziawg"] = "wireguard"
    platform: Literal["windows", "macos", "android", "ios", "linux"]


class ConnectionParameters(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ipv4_address: IPvAnyInterface
    ipv6_address: IPvAnyInterface | None = None
    server_public_key: str = Field(pattern=r"^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw048]=$", max_length=44)
    endpoint: str = Field(min_length=1, max_length=253)
    port: int = Field(ge=1, le=65535)
    dns: list[IPvAnyAddress] = Field(min_length=1, max_length=4)
    mtu: int = Field(ge=576, le=9000)
    allowed_ips: list[IPvAnyNetwork] = Field(min_length=1, max_length=8)
    persistent_keepalive: int | None = Field(default=25, ge=0, le=65535)
    additional_parameters: dict[str, str | int | bool] = Field(default_factory=dict)

    @field_validator("endpoint")
    @classmethod
    def validate_endpoint_host(cls, value: str) -> str:
        if any(char.isspace() for char in value) or "/" in value:
            raise ValueError("endpoint must be a host name or IP address")
        return value


class GenerationResponse(BaseModel):
    status: Literal["created"] = "created"
    mode: Literal["mock", "personal"]
    provider: str
    format: Literal["wireguard", "amneziawg"]
    parameters: ConnectionParameters
    notice: str | None = None

    @property
    def is_demo(self) -> bool:
        return self.mode == "mock"

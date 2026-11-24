from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    app_url: str = "http://localhost:3000"
    app_mode: Literal["mock", "personal", "disabled"] = "disabled"
    vpn_provider: Literal["mock", "cloudflare"] = "mock"
    auth_password_hash: str = ""
    auth_session_secret: str = ""
    auth_session_hours: int = Field(default=12, ge=1, le=168)
    auth_login_attempts: int = Field(default=5, ge=1, le=20)
    auth_login_window_seconds: int = Field(default=900, ge=60, le=7200)
    allowed_origins: str = "http://localhost:3000"
    rate_limit_requests: int = Field(default=5, ge=1, le=30)
    rate_limit_window_seconds: int = Field(default=60, ge=10, le=3600)
    provider_timeout_seconds: float = Field(default=8, gt=0, le=30)
    max_concurrent_registrations: int = Field(default=2, ge=1, le=10)


settings = Settings()
settings.allowed_origins = ",".join(x.strip() for x in settings.allowed_origins.split(",") if x.strip())

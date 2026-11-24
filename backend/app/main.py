from collections import OrderedDict
from time import monotonic
from typing import Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    app_env: str = "development"
    app_url: str = "http://localhost:3000"
    warp_provider_mode: Literal["mock", "cloudflare"] = "mock"
    warp_generation_enabled: bool = False
    allowed_origins: str = "http://localhost:3000"
    rate_limit_requests: int = Field(default=5, ge=1, le=30)
    rate_limit_window_seconds: int = Field(default=60, ge=10, le=3600)
    provider_timeout_seconds: float = Field(default=8, gt=0, le=30)
    max_concurrent_registrations: int = Field(default=4, ge=1, le=20)


settings = Settings()
settings.allowed_origins = ",".join(x.strip() for x in settings.allowed_origins.split(",") if x.strip())
app = FastAPI(title="Quiet Tunnel API", version="0.1.0", docs_url=None, redoc_url=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[x.strip() for x in settings.allowed_origins.split(",") if x.strip()],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
_hits: OrderedDict[str, list[float]] = OrderedDict()


class RegistrationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    public_key: str = Field(pattern=r"^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw048]=$", max_length=44)
    terms_accepted: Literal[True]
    format: Literal["wireguard", "amneziawg"]


@app.middleware("http")
async def safe_headers(request: Request, call_next):
    if request.method == "POST" and (not request.headers.get("origin") or request.headers["origin"] not in settings.allowed_origins.split(",")):
        return JSONResponse(status_code=403, content={"error": {"code": "INVALID_REQUEST", "message": "Origin not allowed"}})
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response


@app.middleware("http")
async def bounded_body(request: Request, call_next):
    length = request.headers.get("content-length")
    if length and (not length.isdigit() or int(length) > 16_384):
        return JSONResponse(status_code=413, content={"error": {"code": "INVALID_REQUEST", "message": "Request too large"}})
    return await call_next(request)


@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}


@app.get("/api/v1/capabilities")
async def capabilities():
    return {"mode": "demo", "real_generation_enabled": False,
            "formats": ["wireguard", "amneziawg"],
            "notice": "Demo parameters are not a working VPN profile."}


@app.post("/api/v1/warp/register")
async def register(body: RegistrationRequest, request: Request):
    now = monotonic()
    client = request.client.host if request.client else "unknown"
    for address in list(_hits):
        recent = [t for t in _hits[address] if now - t < settings.rate_limit_window_seconds]
        if recent:
            _hits[address] = recent
        else:
            del _hits[address]
    if client not in _hits and len(_hits) >= 10_000:
        _hits.popitem(last=False)
    _hits.setdefault(client, [])
    _hits.move_to_end(client)
    if len(_hits[client]) >= settings.rate_limit_requests:
        raise HTTPException(429, detail={"code": "RATE_LIMITED"})
    _hits[client].append(now)
    if body.terms_accepted is not True:
        raise HTTPException(400, detail={"code": "TERMS_NOT_ACCEPTED"})
    if settings.warp_provider_mode != "mock" or settings.warp_generation_enabled:
        raise HTTPException(503, detail={"code": "GENERATION_DISABLED"})
    raise HTTPException(501, detail={"code": "GENERATION_DISABLED", "message": "Only clearly labeled demo mode is enabled; no provider registration is performed."})


@app.exception_handler(Exception)
async def generic_error(_request: Request, _exc: Exception):
    return JSONResponse(status_code=500, content={"error": {"code": "INTERNAL_ERROR", "message": "Unexpected server error"}}, headers={"Cache-Control": "no-store"})

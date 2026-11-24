import asyncio
from collections import OrderedDict, deque
from time import monotonic, time

from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from .auth import issue_session, valid_session, verify_password
from .core.config import settings
from .core.exceptions import (
    InvalidProviderResponse,
    ProviderError,
    ProviderTimeout,
    ProviderUnavailable,
    UnsupportedFormat,
)
from .providers.factory import create_provider
from .providers.models import GenerationResponse, RegistrationRequest
from .services.generator import generate_configuration

app = FastAPI(title="Quiet Tunnel API", version="0.2.0", docs_url=None, redoc_url=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

SESSION_COOKIE = "quiet_tunnel_session"
_hits: OrderedDict[str, list[float]] = OrderedDict()
_login_failures: OrderedDict[str, deque[float]] = OrderedDict()
_registration_semaphore = asyncio.Semaphore(settings.max_concurrent_registrations)
_provider = create_provider(settings)


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    password: str = Field(min_length=1, max_length=1024)


def get_client_key(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def require_owner(request: Request) -> None:
    if not valid_session(request.cookies.get(SESSION_COOKIE), settings.auth_session_secret):
        raise HTTPException(401, detail={"code": "UNAUTHENTICATED", "message": "Owner login required."})


def login_limited(client: str, now: float) -> bool:
    for address in list(_login_failures):
        attempts = deque(t for t in _login_failures[address] if now - t < settings.auth_login_window_seconds)
        if attempts:
            _login_failures[address] = attempts
        else:
            del _login_failures[address]
    return len(_login_failures.get(client, deque())) >= settings.auth_login_attempts


def enforce_generation_limit(client: str, now: float) -> None:
    for address in list(_hits):
        recent = [timestamp for timestamp in _hits[address] if now - timestamp < settings.rate_limit_window_seconds]
        if recent:
            _hits[address] = recent
        else:
            del _hits[address]
    if client not in _hits and len(_hits) >= 10_000:
        _hits.popitem(last=False)
    hits = _hits.setdefault(client, [])
    _hits.move_to_end(client)
    if len(hits) >= settings.rate_limit_requests:
        raise HTTPException(429, detail={"code": "RATE_LIMITED", "message": "Please wait before generating again."})
    hits.append(now)


@app.middleware("http")
async def safe_headers(request: Request, call_next):
    if request.method == "POST":
        origin = request.headers.get("origin")
        if not origin or origin not in settings.allowed_origins.split(","):
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


@app.post("/api/v1/auth/login")
async def login(body: LoginRequest, request: Request, response: Response):
    client = get_client_key(request)
    now = monotonic()
    if login_limited(client, now):
        raise HTTPException(429, detail={"code": "RATE_LIMITED"})
    configured = bool(settings.auth_password_hash and len(settings.auth_session_secret) >= 32)
    if not configured or not verify_password(body.password, settings.auth_password_hash):
        _login_failures.setdefault(client, deque()).append(now)
        _login_failures.move_to_end(client)
        while len(_login_failures) > 10_000:
            _login_failures.popitem(last=False)
        raise HTTPException(401, detail={"code": "INVALID_CREDENTIALS", "message": "Password is incorrect or owner access is not configured."})
    _login_failures.pop(client, None)
    expires = int(time()) + settings.auth_session_hours * 3600
    response.set_cookie(
        SESSION_COOKIE,
        issue_session(settings.auth_session_secret, expires),
        max_age=settings.auth_session_hours * 3600,
        expires=expires,
        httponly=True,
        secure=settings.app_env == "production",
        samesite="strict",
        path="/",
    )
    return {"authenticated": True}


@app.get("/api/v1/auth/session")
async def session(request: Request):
    return {"authenticated": valid_session(request.cookies.get(SESSION_COOKIE), settings.auth_session_secret)}


@app.post("/api/v1/auth/logout")
async def logout(response: Response):
    response.delete_cookie(SESSION_COOKIE, path="/", httponly=True, secure=settings.app_env == "production", samesite="strict")
    return {"authenticated": False}


@app.get("/api/v1/capabilities")
async def capabilities():
    provider = _provider
    if provider is None:
        return {
            "mode": settings.app_mode,
            "provider": settings.vpn_provider,
            "available": False,
            "real_provider": False,
            "formats": [],
            "notice": "VPN generation is disabled by application configuration.",
        }
    availability = await provider.availability()
    return {
        "mode": settings.app_mode,
        "provider": availability.provider,
        "available": availability.available,
        "real_provider": availability.real_provider,
        "formats": availability.formats,
        "notice": availability.reason,
    }


@app.post("/api/v1/generate", response_model=GenerationResponse)
@app.post("/api/v1/warp/register", response_model=GenerationResponse, include_in_schema=False)
async def register(body: RegistrationRequest, request: Request, _owner: None = Depends(require_owner)):
    enforce_generation_limit(get_client_key(request), monotonic())
    if body.format == "amneziawg" and settings.app_mode == "mock":
        # Mock cannot model server-side AWG obfuscation, so it does not advertise it.
        raise HTTPException(422, detail={"code": "UNSUPPORTED_FORMAT", "message": "The selected provider does not support AmneziaWG."})
    try:
        async with _registration_semaphore:
            return await asyncio.wait_for(
                generate_configuration(_provider, settings.app_mode, body),
                timeout=settings.provider_timeout_seconds,
            )
    except TimeoutError as exc:
        raise HTTPException(504, detail={"code": "PROVIDER_TIMEOUT", "message": "Provider request timed out."}) from exc
    except UnsupportedFormat as exc:
        raise HTTPException(422, detail={"code": "UNSUPPORTED_FORMAT", "message": str(exc)}) from exc
    except ProviderTimeout as exc:
        raise HTTPException(504, detail={"code": "PROVIDER_TIMEOUT", "message": "Provider request timed out."}) from exc
    except ProviderUnavailable as exc:
        raise HTTPException(503, detail={"code": "PROVIDER_UNAVAILABLE", "message": str(exc)}) from exc
    except InvalidProviderResponse as exc:
        raise HTTPException(502, detail={"code": "PROVIDER_RESPONSE_INVALID", "message": "Provider returned invalid parameters."}) from exc
    except ProviderError as exc:
        raise HTTPException(502, detail={"code": "PROVIDER_UNAVAILABLE", "message": "Provider request failed."}) from exc


@app.exception_handler(Exception)
async def generic_error(_request: Request, _exc: Exception):
    return JSONResponse(status_code=500, content={"error": {"code": "INTERNAL_ERROR", "message": "Unexpected server error"}}, headers={"Cache-Control": "no-store"})


@app.exception_handler(RequestValidationError)
async def validation_error(_request: Request, _exc: RequestValidationError):
    # FastAPI's default 422 body echoes rejected `input` values. Avoid reflecting
    # any attempted private key/configuration fields back into the HTTP response.
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "INVALID_REQUEST", "message": "Request fields are invalid or unsupported."}},
        headers={"Cache-Control": "no-store"},
    )

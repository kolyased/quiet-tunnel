"""Small stateless owner authentication for a single-user deployment."""

import base64
import hashlib
import hmac
import secrets
import time

SCRYPT_N = 1 << 14
SCRYPT_R = 8
SCRYPT_P = 1


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=SCRYPT_N, r=SCRYPT_R, p=SCRYPT_P, dklen=32)
    return f"scrypt${SCRYPT_N}${SCRYPT_R}${SCRYPT_P}${_b64encode(salt)}${_b64encode(derived)}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, n, r, p, salt, expected = encoded.split("$")
        if algorithm != "scrypt":
            return False
        actual = hashlib.scrypt(password.encode("utf-8"), salt=_b64decode(salt), n=int(n), r=int(r), p=int(p), dklen=len(_b64decode(expected)))
        return hmac.compare_digest(actual, _b64decode(expected))
    except (ValueError, TypeError, MemoryError):
        return False


def issue_session(secret: str, expires_at: int) -> str:
    payload = f"owner:{expires_at}:{secrets.token_urlsafe(16)}".encode("ascii")
    signature = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).digest()
    return f"{_b64encode(payload)}.{_b64encode(signature)}"


def valid_session(token: str | None, secret: str, now: int | None = None) -> bool:
    if not token or len(secret) < 32:
        return False
    try:
        encoded_payload, encoded_signature = token.split(".", 1)
        payload = _b64decode(encoded_payload)
        signature = _b64decode(encoded_signature)
        expected = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).digest()
        subject, expiry, nonce = payload.decode("ascii").split(":", 2)
        return (
            subject == "owner"
            and bool(nonce)
            and int(expiry) > (int(time.time()) if now is None else now)
            and hmac.compare_digest(signature, expected)
        )
    except (ValueError, UnicodeDecodeError):
        return False

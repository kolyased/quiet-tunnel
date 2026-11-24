#!/usr/bin/env python3
"""Print an scrypt password hash for AUTH_PASSWORD_HASH; never prints the password."""

from getpass import getpass
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from app.auth import hash_password  # noqa: E402


def main() -> None:
    password = getpass("New owner password (16+ characters recommended): ")
    repeated = getpass("Repeat password: ")
    if password != repeated:
        raise SystemExit("Passwords did not match")
    if len(password) < 12:
        raise SystemExit("Use at least 12 characters")
    print(hash_password(password))


if __name__ == "__main__":
    main()

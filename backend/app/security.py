from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash
from pwdlib.hashers.bcrypt import BcryptHasher

from app.config import settings

ALGORITHM = "HS256"
TOKEN_LIFETIME = timedelta(hours=8)
COOKIE_NAME = "session"

password_hash = PasswordHash((BcryptHasher(),))


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return password_hash.verify(password, hashed)


def create_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(UTC) + TOKEN_LIFETIME,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def read_token(token: str) -> int | None:
    """Return the user id in the token, or None if it is invalid or expired."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None

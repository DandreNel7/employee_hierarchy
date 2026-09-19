from fastapi import APIRouter, HTTPException, Request, Response, status
from sqlalchemy import select

from app.config import settings
from app.deps import CurrentUser, DbSession
from app.models import User
from app.rate_limit import limiter
from app.schemas.auth import LoginIn, UserOut
from app.security import COOKIE_NAME, TOKEN_LIFETIME, create_token, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=UserOut)
@limiter.limit("5/minute")
def login(request: Request, response: Response, data: LoginIn, db: DbSession) -> User:
    user = db.scalar(select(User).where(User.email == data.email.lower()))
    # Same message either way, so it does not reveal which emails exist.
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )

    response.set_cookie(
        COOKIE_NAME,
        create_token(user.id),
        max_age=int(TOKEN_LIFETIME.total_seconds()),
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/")


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser) -> User:
    return user

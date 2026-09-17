from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.security import read_token

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbSession,
    session: Annotated[str | None, Cookie()] = None,
) -> User:
    """Every route except login depends on this, so the cookie is checked server side."""
    not_logged_in = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not logged in")
    if session is None:
        raise not_logged_in

    user_id = read_token(session)
    if user_id is None:
        raise not_logged_in

    user = db.get(User, user_id)
    if user is None:
        raise not_logged_in
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]

"""Reusable FastAPI dependencies."""

from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.security import decode_access_token
from app.database import get_db
from app.models import User

# auto_error=False so we can return our own consistent JSON error.
bearer_scheme = HTTPBearer(auto_error=False)

DbSession = Annotated[Session, Depends(get_db)]
AppSettings = Annotated[Settings, Depends(get_settings)]


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: DbSession,
    settings: AppSettings,
) -> User:
    """Read the 'Authorization: Bearer <token>' header and return the logged-in user."""
    unauthorized = AppError(
        401,
        "unauthorized",
        "Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized

    subject = decode_access_token(
        credentials.credentials,
        secret_key=settings.secret_key,
        algorithm=settings.jwt_algorithm,
    )
    if subject is None or not subject.isdigit():
        raise unauthorized

    user = db.get(User, int(subject))
    if user is None:
        raise unauthorized
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]

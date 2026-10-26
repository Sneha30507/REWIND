from datetime import timedelta

from fastapi import APIRouter

from app.core.security import create_access_token
from app.dependencies import AppSettings, CurrentUser, DbSession
from app.schemas import ErrorResponse, Token, UserCreate, UserLogin, UserRead
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserRead,
    status_code=201,
    responses={409: {"model": ErrorResponse}},
)
def register(payload: UserCreate, db: DbSession) -> UserRead:
    user = auth_service.register_user(db, payload.email, payload.password)
    return UserRead.model_validate(user)


@router.post(
    "/login",
    response_model=Token,
    responses={401: {"model": ErrorResponse}},
)
def login(payload: UserLogin, db: DbSession, settings: AppSettings) -> Token:
    user = auth_service.authenticate_user(db, payload.email, payload.password)
    expires = timedelta(minutes=settings.access_token_expire_minutes)
    token = create_access_token(
        str(user.id),
        secret_key=settings.secret_key,
        algorithm=settings.jwt_algorithm,
        expires_delta=expires,
    )
    return Token(access_token=token, expires_in=int(expires.total_seconds()))


@router.get("/me", response_model=UserRead, responses={401: {"model": ErrorResponse}})
def me(current_user: CurrentUser) -> UserRead:
    return UserRead.model_validate(current_user)

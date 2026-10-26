from functools import cache

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.security import hash_password, verify_password
from app.models import User


@cache
def _dummy_hash() -> str:
    # Used to spend the same time on unknown emails as on wrong passwords,
    # so response timing doesn't reveal which emails are registered.
    return hash_password("not-a-real-password")


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def register_user(db: Session, email: str, password: str) -> User:
    if get_user_by_email(db, email) is not None:
        raise AppError(409, "email_taken", "An account with this email already exists")

    user = User(email=email, password_hash=hash_password(password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        # Two sign-ups with the same email raced each other.
        db.rollback()
        raise AppError(409, "email_taken", "An account with this email already exists")
    except SQLAlchemyError:
        db.rollback()
        raise
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = get_user_by_email(db, email)
    if user is None:
        verify_password(password, _dummy_hash())
        raise AppError(401, "invalid_credentials", "Invalid email or password")
    if not verify_password(password, user.password_hash):
        raise AppError(401, "invalid_credentials", "Invalid email or password")
    return user

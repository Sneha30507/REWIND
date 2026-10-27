"""Application settings, read from environment variables (and a local .env file)."""

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/ directory (two levels above this file: backend/app/core/config.py)
BASE_DIR = Path(__file__).resolve().parents[2]

_PLACEHOLDER_PREFIXES = ("replace-with", "change-me", "changeme", "your-secret")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Rewind AI API"
    app_version: str = "0.2.0"
    environment: str = "development"

    # Default: a SQLite file inside backend/. Works with no extra setup.
    database_url: str = f"sqlite:///{(BASE_DIR / 'rewind.db').as_posix()}"

    # Comma-separated string (simple to put in a .env file).
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # No default on purpose: the app refuses to start without a real secret.
    secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(default=60, ge=1, le=60 * 24 * 7)

    @field_validator("secret_key")
    @classmethod
    def secret_must_be_strong(cls, value: str) -> str:
        if len(value) < 32:
            raise ValueError(
                "SECRET_KEY must be at least 32 characters. Generate one with: "
                'python -c "import secrets; print(secrets.token_urlsafe(48))"'
            )
        if value.lower().startswith(_PLACEHOLDER_PREFIXES):
            raise ValueError(
                "SECRET_KEY is still the placeholder from .env.example. "
                "Generate your own random value."
            )
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

from fastapi import APIRouter

from app.dependencies import AppSettings

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health(settings: AppSettings) -> dict[str, str]:
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
    }

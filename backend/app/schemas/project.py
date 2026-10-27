from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

from app.schemas.common import MAX_TAGS, clean_tag_list
from app.schemas.memory import Title

ProjectStatus = Literal["planning", "active", "on_hold", "completed"]


class ProjectCreate(BaseModel):
    title: Title
    description: str = Field(default="", max_length=10_000)
    status: ProjectStatus = "active"
    progress: int = Field(default=0, ge=0, le=100)
    tags: list[str] = Field(default_factory=list, max_length=MAX_TAGS)

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, tags: list[str]) -> list[str]:
        return clean_tag_list(tags)


class ProjectUpdate(ProjectCreate):
    """PUT replaces the whole project, so it uses the same fields as create."""


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    status: ProjectStatus
    progress: int
    tags: list[str]
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at")
    def _serialize_datetime(self, value: datetime) -> str:
        if value.tzinfo is None:  # SQLite returns naive datetimes; they are UTC.
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()


class ProjectList(BaseModel):
    items: list[ProjectRead]
    total: int
    limit: int
    offset: int

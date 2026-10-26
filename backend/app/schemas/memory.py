from datetime import datetime, timezone
from typing import Annotated

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    field_serializer,
    field_validator,
)

Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
Category = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]

MAX_TAGS = 20
MAX_TAG_LENGTH = 30


class MemoryCreate(BaseModel):
    title: Title
    content: str = Field(default="", max_length=50_000)
    category: Category = "general"
    tags: list[str] = Field(default_factory=list, max_length=MAX_TAGS)

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, tags: list[str]) -> list[str]:
        """Trim tags, reject blank/too-long ones, drop duplicates (keeping order)."""
        cleaned: list[str] = []
        seen: set[str] = set()
        for tag in tags:
            tag = tag.strip()
            if not tag:
                raise ValueError("Tags must not be blank")
            if len(tag) > MAX_TAG_LENGTH:
                raise ValueError(f"Each tag must be at most {MAX_TAG_LENGTH} characters")
            if tag.lower() not in seen:
                seen.add(tag.lower())
                cleaned.append(tag)
        return cleaned


class MemoryUpdate(MemoryCreate):
    """PUT replaces the whole memory, so it uses the same fields as create."""


class MemoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    content: str
    category: str
    tags: list[str]
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at")
    def _serialize_datetime(self, value: datetime) -> str:
        if value.tzinfo is None:  # SQLite returns naive datetimes; they are UTC.
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()


class MemoryList(BaseModel):
    items: list[MemoryRead]
    total: int
    limit: int
    offset: int


class DeleteResult(BaseModel):
    deleted: bool = True
    id: int

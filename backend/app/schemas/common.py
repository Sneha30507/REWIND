from pydantic import BaseModel


class ErrorDetail(BaseModel):
    field: str
    message: str


class ErrorBody(BaseModel):
    code: str
    message: str
    details: list[ErrorDetail] | None = None


class ErrorResponse(BaseModel):
    """Shape of every error returned by the API."""

    error: ErrorBody


MAX_TAGS = 20
MAX_TAG_LENGTH = 30


def clean_tag_list(tags: list[str]) -> list[str]:
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

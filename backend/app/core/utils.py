from datetime import datetime, timezone


def utc_now() -> datetime:
    """Current time as a timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


def escape_like(term: str) -> str:
    """Make % and _ match literally instead of acting as SQL wildcards."""
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")

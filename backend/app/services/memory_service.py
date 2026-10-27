"""All database logic for memories. Every function is scoped to one owner,
so a user can never read or change another user's memories."""

from sqlalchemy import func, or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.utils import escape_like, utc_now
from app.models import Memory
from app.schemas import MemoryCreate, MemoryUpdate


def _commit(db: Session) -> None:
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise


def create_memory(db: Session, owner_id: int, data: MemoryCreate) -> Memory:
    memory = Memory(
        owner_id=owner_id,
        title=data.title,
        content=data.content,
        category=data.category,
        tags=data.tags,
    )
    db.add(memory)
    _commit(db)
    db.refresh(memory)
    return memory


def get_memory(db: Session, owner_id: int, memory_id: int) -> Memory:
    memory = db.scalar(
        select(Memory).where(Memory.id == memory_id, Memory.owner_id == owner_id)
    )
    if memory is None:
        # Same 404 whether it doesn't exist or belongs to someone else.
        raise AppError(404, "not_found", "Memory not found")
    return memory


def list_memories(
    db: Session,
    owner_id: int,
    *,
    q: str | None = None,
    category: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[Memory], int]:
    """Return (page of memories, total number of matches), newest-updated first."""
    conditions = [Memory.owner_id == owner_id]

    if category:
        conditions.append(func.lower(Memory.category) == category.strip().lower())

    if q:
        pattern = f"%{escape_like(q.strip())}%"
        conditions.append(
            or_(
                Memory.title.ilike(pattern, escape="\\"),
                Memory.content.ilike(pattern, escape="\\"),
            )
        )

    total = db.scalar(select(func.count()).select_from(Memory).where(*conditions)) or 0
    items = db.scalars(
        select(Memory)
        .where(*conditions)
        .order_by(Memory.updated_at.desc(), Memory.id.desc())
        .limit(limit)
        .offset(offset)
    ).all()
    return list(items), total


def update_memory(
    db: Session, owner_id: int, memory_id: int, data: MemoryUpdate
) -> Memory:
    memory = get_memory(db, owner_id, memory_id)
    memory.title = data.title
    memory.content = data.content
    memory.category = data.category
    memory.tags = data.tags  # assign a new list so the change is detected
    memory.updated_at = utc_now()
    _commit(db)
    db.refresh(memory)
    return memory


def delete_memory(db: Session, owner_id: int, memory_id: int) -> None:
    memory = get_memory(db, owner_id, memory_id)
    db.delete(memory)
    _commit(db)


def category_counts(db: Session, owner_id: int) -> list[tuple[str, int]]:
    """Return (category, number of memories) for this owner, grouped case-insensitively."""
    lowered = func.lower(Memory.category)
    rows = db.execute(
        select(lowered, func.count())
        .where(Memory.owner_id == owner_id)
        .group_by(lowered)
        .order_by(lowered)
    ).all()
    return [(category, count) for category, count in rows]

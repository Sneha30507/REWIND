from typing import Annotated

from fastapi import APIRouter, Query

from app.core.errors import AppError
from app.dependencies import CurrentUser, DbSession
from app.schemas import (
    DeleteResult,
    ErrorResponse,
    MemoryCreate,
    MemoryList,
    MemoryRead,
    MemoryUpdate,
)
from app.services import memory_service

router = APIRouter(
    prefix="/api/memories",
    tags=["memories"],
    responses={401: {"model": ErrorResponse}},
)

Limit = Annotated[int, Query(ge=1, le=100, description="Page size (1-100)")]
Offset = Annotated[int, Query(ge=0, description="How many items to skip")]
CategoryFilter = Annotated[
    str | None, Query(max_length=50, description="Only return this category")
]


def _page(items, total: int, limit: int, offset: int) -> MemoryList:
    return MemoryList(
        items=[MemoryRead.model_validate(m) for m in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=MemoryRead, status_code=201)
def create_memory(payload: MemoryCreate, db: DbSession, user: CurrentUser) -> MemoryRead:
    memory = memory_service.create_memory(db, user.id, payload)
    return MemoryRead.model_validate(memory)


@router.get("", response_model=MemoryList)
def list_memories(
    db: DbSession,
    user: CurrentUser,
    category: CategoryFilter = None,
    limit: Limit = 20,
    offset: Offset = 0,
) -> MemoryList:
    items, total = memory_service.list_memories(
        db, user.id, category=category, limit=limit, offset=offset
    )
    return _page(items, total, limit, offset)


# NOTE: "/search" must be declared before "/{memory_id}", otherwise FastAPI
# would try to read the word "search" as a memory id.
@router.get("/search", response_model=MemoryList, responses={422: {"model": ErrorResponse}})
def search_memories(
    db: DbSession,
    user: CurrentUser,
    q: Annotated[str, Query(min_length=1, max_length=200, description="Text to look for")],
    category: CategoryFilter = None,
    limit: Limit = 20,
    offset: Offset = 0,
) -> MemoryList:
    if not q.strip():
        raise AppError(422, "validation_error", "Search query must not be blank")
    items, total = memory_service.list_memories(
        db, user.id, q=q, category=category, limit=limit, offset=offset
    )
    return _page(items, total, limit, offset)


@router.get(
    "/{memory_id}", response_model=MemoryRead, responses={404: {"model": ErrorResponse}}
)
def get_memory(memory_id: int, db: DbSession, user: CurrentUser) -> MemoryRead:
    return MemoryRead.model_validate(memory_service.get_memory(db, user.id, memory_id))


@router.put(
    "/{memory_id}", response_model=MemoryRead, responses={404: {"model": ErrorResponse}}
)
def update_memory(
    memory_id: int, payload: MemoryUpdate, db: DbSession, user: CurrentUser
) -> MemoryRead:
    memory = memory_service.update_memory(db, user.id, memory_id, payload)
    return MemoryRead.model_validate(memory)


@router.delete(
    "/{memory_id}", response_model=DeleteResult, responses={404: {"model": ErrorResponse}}
)
def delete_memory(memory_id: int, db: DbSession, user: CurrentUser) -> DeleteResult:
    memory_service.delete_memory(db, user.id, memory_id)
    return DeleteResult(id=memory_id)

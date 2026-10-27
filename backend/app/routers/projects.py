from typing import Annotated

from fastapi import APIRouter, Query

from app.dependencies import CurrentUser, DbSession
from app.schemas import (
    DeleteResult,
    ErrorResponse,
    ProjectCreate,
    ProjectList,
    ProjectRead,
    ProjectStatus,
    ProjectUpdate,
)
from app.services import project_service

router = APIRouter(
    prefix="/api/projects",
    tags=["projects"],
    responses={401: {"model": ErrorResponse}},
)

Limit = Annotated[int, Query(ge=1, le=100, description="Page size (1-100)")]
Offset = Annotated[int, Query(ge=0, description="How many items to skip")]


@router.post("", response_model=ProjectRead, status_code=201)
def create_project(payload: ProjectCreate, db: DbSession, user: CurrentUser) -> ProjectRead:
    project = project_service.create_project(db, user.id, payload)
    return ProjectRead.model_validate(project)


@router.get("", response_model=ProjectList)
def list_projects(
    db: DbSession,
    user: CurrentUser,
    q: Annotated[
        str | None, Query(max_length=200, description="Text to look for in title or description")
    ] = None,
    status: Annotated[ProjectStatus | None, Query(description="Only this status")] = None,
    limit: Limit = 20,
    offset: Offset = 0,
) -> ProjectList:
    items, total = project_service.list_projects(
        db, user.id, q=q, status=status, limit=limit, offset=offset
    )
    return ProjectList(
        items=[ProjectRead.model_validate(p) for p in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{project_id}", response_model=ProjectRead, responses={404: {"model": ErrorResponse}}
)
def get_project(project_id: int, db: DbSession, user: CurrentUser) -> ProjectRead:
    return ProjectRead.model_validate(project_service.get_project(db, user.id, project_id))


@router.put(
    "/{project_id}", response_model=ProjectRead, responses={404: {"model": ErrorResponse}}
)
def update_project(
    project_id: int, payload: ProjectUpdate, db: DbSession, user: CurrentUser
) -> ProjectRead:
    project = project_service.update_project(db, user.id, project_id, payload)
    return ProjectRead.model_validate(project)


@router.delete(
    "/{project_id}", response_model=DeleteResult, responses={404: {"model": ErrorResponse}}
)
def delete_project(project_id: int, db: DbSession, user: CurrentUser) -> DeleteResult:
    project_service.delete_project(db, user.id, project_id)
    return DeleteResult(id=project_id)

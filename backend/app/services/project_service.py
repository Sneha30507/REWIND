"""All database logic for projects. Every function is scoped to one owner,
so a user can never read or change another user's projects."""

from sqlalchemy import func, or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.utils import escape_like, utc_now
from app.models import Project
from app.schemas import ProjectCreate, ProjectUpdate


def _commit(db: Session) -> None:
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise


def create_project(db: Session, owner_id: int, data: ProjectCreate) -> Project:
    project = Project(
        owner_id=owner_id,
        title=data.title,
        description=data.description,
        status=data.status,
        progress=data.progress,
        tags=data.tags,
    )
    db.add(project)
    _commit(db)
    db.refresh(project)
    return project


def get_project(db: Session, owner_id: int, project_id: int) -> Project:
    project = db.scalar(
        select(Project).where(Project.id == project_id, Project.owner_id == owner_id)
    )
    if project is None:
        # Same 404 whether it doesn't exist or belongs to someone else.
        raise AppError(404, "not_found", "Project not found")
    return project


def list_projects(
    db: Session,
    owner_id: int,
    *,
    q: str | None = None,
    status: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[Project], int]:
    """Return (page of projects, total number of matches), newest-updated first."""
    conditions = [Project.owner_id == owner_id]

    if status:
        conditions.append(Project.status == status)

    if q and q.strip():
        pattern = f"%{escape_like(q.strip())}%"
        conditions.append(
            or_(
                Project.title.ilike(pattern, escape="\\"),
                Project.description.ilike(pattern, escape="\\"),
            )
        )

    total = db.scalar(select(func.count()).select_from(Project).where(*conditions)) or 0
    items = db.scalars(
        select(Project)
        .where(*conditions)
        .order_by(Project.updated_at.desc(), Project.id.desc())
        .limit(limit)
        .offset(offset)
    ).all()
    return list(items), total


def update_project(
    db: Session, owner_id: int, project_id: int, data: ProjectUpdate
) -> Project:
    project = get_project(db, owner_id, project_id)
    project.title = data.title
    project.description = data.description
    project.status = data.status
    project.progress = data.progress
    project.tags = data.tags  # assign a new list so the change is detected
    project.updated_at = utc_now()
    _commit(db)
    db.refresh(project)
    return project


def delete_project(db: Session, owner_id: int, project_id: int) -> None:
    project = get_project(db, owner_id, project_id)
    db.delete(project)
    _commit(db)

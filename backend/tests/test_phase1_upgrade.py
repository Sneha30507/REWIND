"""A database created by Phase 1 (users + memories only) must keep all its data
when the Phase 2 app starts and creates the new 'projects' table."""

from sqlalchemy import inspect, select
from sqlalchemy.orm import Session

from app.database import Base, make_engine
from app.models import Memory, Project, User


def test_phase1_database_keeps_data_when_projects_table_is_added(tmp_path):
    url = f"sqlite:///{(tmp_path / 'phase1.db').as_posix()}"

    # --- a Phase 1 database: only the two original tables exist ---
    engine = make_engine(url)
    Base.metadata.create_all(engine, tables=[User.__table__, Memory.__table__])
    with Session(engine) as session:
        user = User(email="old@example.com", password_hash="hash")
        session.add(user)
        session.flush()
        session.add(Memory(owner_id=user.id, title="Old memory", content="kept", tags=["x"]))
        session.commit()
    assert "projects" not in inspect(engine).get_table_names()
    engine.dispose()

    # --- Phase 2 startup does Base.metadata.create_all(...) ---
    engine = make_engine(url)
    Base.metadata.create_all(engine)
    assert "projects" in inspect(engine).get_table_names()
    with Session(engine) as session:
        assert session.scalars(select(User)).one().email == "old@example.com"
        memory = session.scalars(select(Memory)).one()
        assert (memory.title, memory.content, memory.tags) == ("Old memory", "kept", ["x"])
        user = session.scalars(select(User)).one()
        session.add(Project(owner_id=user.id, title="New project"))
        session.commit()
        assert session.scalars(select(Project)).one().status == "active"
    engine.dispose()


def test_deleting_a_user_deletes_their_projects(tmp_path):
    url = f"sqlite:///{(tmp_path / 'cascade.db').as_posix()}"
    engine = make_engine(url)
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        user = User(email="c@example.com", password_hash="x")
        session.add(user)
        session.flush()
        session.add(Project(owner_id=user.id, title="Will be removed"))
        session.commit()
        session.delete(user)
        session.commit()
        assert session.scalars(select(Project)).all() == []
    engine.dispose()

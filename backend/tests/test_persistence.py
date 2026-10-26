"""Data must survive an app/engine restart (it lives in a file, not in memory)."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import Base, make_engine
from app.models import Memory, User


def test_data_survives_engine_restart(tmp_path):
    url = f"sqlite:///{(tmp_path / 'persist.db').as_posix()}"

    first_engine = make_engine(url)
    Base.metadata.create_all(first_engine)
    with Session(first_engine) as session:
        user = User(email="p@example.com", password_hash="not-a-real-hash")
        session.add(user)
        session.flush()
        session.add(
            Memory(owner_id=user.id, title="Persisted", content="still here",
                   category="general", tags=["a", "b"])
        )
        session.commit()
    first_engine.dispose()  # "stop the app"

    second_engine = make_engine(url)  # "start the app again"
    with Session(second_engine) as session:
        memory = session.scalars(select(Memory)).one()
        assert memory.title == "Persisted"
        assert memory.tags == ["a", "b"]
    second_engine.dispose()


def test_deleting_a_user_deletes_their_memories(tmp_path):
    url = f"sqlite:///{(tmp_path / 'cascade.db').as_posix()}"
    engine = make_engine(url)
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        user = User(email="c@example.com", password_hash="x")
        session.add(user)
        session.flush()
        session.add(Memory(owner_id=user.id, title="Will be removed"))
        session.commit()
        session.delete(user)
        session.commit()
        assert session.scalars(select(Memory)).all() == []
    engine.dispose()

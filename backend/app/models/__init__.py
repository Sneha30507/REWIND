# Import every model here so Base.metadata knows about all tables.
from app.models.memory import Memory
from app.models.user import User

__all__ = ["Memory", "User"]

"""One consistent JSON error format for the whole API:

    {"error": {"code": "not_found", "message": "Memory not found", "details": [...]}}
"""

import logging
from http import HTTPStatus

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class AppError(Exception):
    """Raise this from services/routers to return a clean error response."""

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        headers: dict[str, str] | None = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.headers = headers


def _error_response(
    status_code: int,
    code: str,
    message: str,
    details: list[dict[str, str]] | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    body: dict = {"code": code, "message": message}
    if details:
        body["details"] = details
    return JSONResponse(status_code=status_code, content={"error": body}, headers=headers)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(_: Request, exc: AppError) -> JSONResponse:
        return _error_response(exc.status_code, exc.code, exc.message, headers=exc.headers)

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_exception(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        try:
            code = HTTPStatus(exc.status_code).phrase.lower().replace(" ", "_")
        except ValueError:
            code = "error"
        return _error_response(exc.status_code, code, str(exc.detail), headers=exc.headers)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        details = []
        for err in exc.errors():
            message = str(err.get("msg", "Invalid value"))
            if message.startswith("Value error, "):
                message = message[len("Value error, ") :]
            details.append(
                {"field": ".".join(str(part) for part in err.get("loc", ())), "message": message}
            )
        return _error_response(422, "validation_error", "Request validation failed", details)

    @app.exception_handler(SQLAlchemyError)
    async def handle_database_error(_: Request, exc: SQLAlchemyError) -> JSONResponse:
        # Log the real problem for the developer, but don't leak details to the client.
        logger.exception("Database error: %s", exc)
        return _error_response(500, "database_error", "A database error occurred. Please try again.")

import pydantic
from typing import Any


class SimpleErrorResponse(pydantic.BaseModel):
    message: str


class ValidationErrorResponse(pydantic.BaseModel):
    message: str
    # pydantic.ErrorDetails is the type but throws a type error for some reason
    # TODO fix this Any type
    errors: list[Any]

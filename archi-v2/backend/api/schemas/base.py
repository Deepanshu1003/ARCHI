"""camelCase/snake_case translation happens here and nowhere else.

The domain stays idiomatic snake_case; the HTTP boundary speaks camelCase.
No hand-written field mapping is permitted anywhere outside this package.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


def to_camel(value: str) -> str:
    head, *tail = value.split("_")
    return head + "".join(part.capitalize() for part in tail)


class CamelModel(BaseModel):
    """Base for every request and response DTO."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )

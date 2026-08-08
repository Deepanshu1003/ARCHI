"""Pydantic DTOs. Deliberately separate from ``core.domain.models``.

Domain models describe the business; these describe the wire format. Keeping
them apart is what lets the HTTP boundary be camelCase while the domain is not.
"""

from .base import CamelModel, to_camel

__all__ = ["CamelModel", "to_camel"]

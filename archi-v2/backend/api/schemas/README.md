# api/schemas

Pydantic DTOs, kept separate from `core/domain` so the wire format can change
without touching the domain.

`base.py` defines `CamelModel`, whose `alias_generator` converts snake_case to
camelCase in one place. Python stays idiomatic, the browser gets camelCase, and
no endpoint hand-translates field names — which is where v1's casing
inconsistencies came from.

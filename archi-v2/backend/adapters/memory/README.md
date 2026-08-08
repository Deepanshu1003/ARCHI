# adapters/memory

In-memory dict as the source of truth, JSON on disk as a write-through mirror.
Writes take an `asyncio.Lock` and land via a temp file + `os.replace`, so a
crash mid-write cannot truncate `projects.json`.

`serialization.py` is deliberately explicit rather than reflective: statuses,
document slots and their full version history, slices and pending approvals all
round-trip, which is what v1's loader got wrong.

# adapters/event_bus

Downward: publishes a Planner slice to each direct report and records it on the
project. Upward: registers a pending approval on the supervisor, replacing any
earlier one from the same author instead of stacking duplicates.

Diffs are `difflib.unified_diff` over the previous and new content, computed
here so both the API and the approval flow show the same text.

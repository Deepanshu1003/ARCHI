# agents/merger

v1 merged by appending the child's text to the parent document inside the
approval endpoint, so re-approving the same agent appended a second copy.

The Merger writes each child's contribution under a stable marker:

```
<!-- archi:section agent=frontend-lead -->
```

A resubmission replaces that section in place. If the replacement is materially
shorter than what it overwrites the merge still happens, but the result is
flagged as a conflict rather than silently discarding the supervisor's edits.

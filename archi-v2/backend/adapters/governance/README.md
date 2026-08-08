# adapters/governance

v1 defined a governance port and never implemented it. This adapter actually
rejects content, and returns every violation it finds rather than the first:

- empty or truncated output
- claims of authority the agent does not hold
- decisions about a sibling's domain
- a plan with no headings or actionable structure
- principles collapsed to a single line

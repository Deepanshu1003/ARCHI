# src/api

- `types.ts` — the wire contract, mirroring `backend/api/schemas` field for
  field (camelCase, uppercase statuses, seconds).
- `client.ts` — every network call in the app. Throws `ApiError` on failure;
  nothing here fabricates a response.
- `mappers.ts` — wire → UI translation, limited to what the UI genuinely wants
  differently: milliseconds and lowercase statuses.

After any mutation the UI re-reads the project rather than patching local state,
so what is displayed is what the server actually stored.

# Frontend

React + Vite, talking to FastAPI directly. No Express, no Express-shaped
payloads, and no localStorage shadow copy — the backend is the source of truth,
so a failed request surfaces as an error instead of falling back to invented
data.

```bash
npm install
npm run dev     # http://localhost:5173
npm run lint    # tsc --noEmit
npm run build
```

`VITE_ARCHI_API_URL` overrides the API origin (default `http://localhost:8000`).

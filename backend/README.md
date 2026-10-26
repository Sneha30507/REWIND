# Rewind AI Backend (Phase 1)

FastAPI + SQLAlchemy 2 + SQLite backend for the Rewind AI dashboard in `../rewind-ai-react/`.

**Phase 1 includes:** health check, user registration/login (JWT), and a full Memories API (create, list, get, update, delete, search) where every user only sees their own memories.

**Not included yet (later phases):** Projects API, AI/chat replies, embeddings, semantic search, activity analytics, external integrations. The frontend still shows its mock data; nothing here is wired into the UI yet.

---

## 1. Setup

Requires **Python 3.10 or newer**. Run everything from the `backend/` folder.

**Windows (PowerShell)**
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

**macOS / Linux**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

> If PowerShell blocks activation, run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### Create your secret key (required)

Open `.env` and replace the `SECRET_KEY` placeholder with a random value. Generate one:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

The app **refuses to start** if `SECRET_KEY` is missing, shorter than 32 characters, or still the placeholder. Never commit `.env` (it is in `.gitignore`).

## 2. Run

```bash
uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000
- Interactive docs (try every endpoint): http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

Then run the frontend as usual (`npm run dev` in `rewind-ai-react/`, it serves on **http://localhost:3000**).

## 3. Configuration (`.env`)

| Variable | Default | Meaning |
|---|---|---|
| `SECRET_KEY` | *(required)* | Signs login tokens. 32+ random characters. |
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Frontend origins allowed to call the API. Taken from `vite.config.ts` (port 3000). |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Login token lifetime. |
| `DATABASE_URL` | `sqlite:///backend/rewind.db` | Leave unset for local development. |
| `ENVIRONMENT` | `development` | Label shown by `/api/health`. |

## 4. Authentication

Every `/api/memories/*` endpoint requires a logged-in user.

| Method | Path | What it does |
|---|---|---|
| POST | `/api/auth/register` | `{"email", "password"}` → creates account (password 8–128 chars) |
| POST | `/api/auth/login` | `{"email", "password"}` → `{"access_token", "token_type", "expires_in"}` |
| GET | `/api/auth/me` | Returns the logged-in user |

Send the token on every request: `Authorization: Bearer <access_token>`.

**In `/docs`:** register, log in, copy `access_token`, click **Authorize** (top right), paste the token. Then try the memory endpoints.

How it is kept safe:
- Passwords are hashed with **scrypt** and a random salt; plain-text passwords are never stored or returned.
- Tokens are signed with `SECRET_KEY` from the environment and expire.
- Each memory has an `owner_id`. All queries filter by the logged-in user, so another user's memory returns **404** (same as "does not exist").
- Wrong password and unknown email give the *same* error, so attackers cannot discover which emails are registered.

## 5. Memories API

| Method | Path | Notes |
|---|---|---|
| POST | `/api/memories` | Create. `title` required (1–200 chars, trimmed). Optional: `content` (≤50,000), `category` (default `general`, ≤50), `tags` (≤20 tags, each ≤30 chars; trimmed, de-duplicated). |
| GET | `/api/memories` | List, newest-updated first. Query: `category`, `limit` (1–100, default 20), `offset` (default 0). |
| GET | `/api/memories/search?q=...` | Case-insensitive search in title **or** content. Also accepts `category`, `limit`, `offset`. |
| GET | `/api/memories/{id}` | Get one. |
| PUT | `/api/memories/{id}` | **Replaces** the memory (send `title`, `content`, `category`, `tags`). |
| DELETE | `/api/memories/{id}` | Returns `{"deleted": true, "id": 1}`. |

List/search response:
```json
{ "items": [ { "id": 1, "title": "...", "content": "...", "category": "work",
               "tags": ["a"], "created_at": "2026-10-27T10:00:00+00:00",
               "updated_at": "2026-10-27T10:00:00+00:00" } ],
  "total": 1, "limit": 20, "offset": 0 }
```

All errors use one format:
```json
{ "error": { "code": "validation_error", "message": "Request validation failed",
             "details": [ { "field": "body.title", "message": "String should have at least 1 character" } ] } }
```
Status codes: `401` not logged in, `404` not found, `409` email already registered, `422` invalid input, `500` database error (details are logged on the server, not sent to the client).

Search treats `%` and `_` as normal characters, not SQL wildcards. SQLite's case-insensitive matching is reliable for English/ASCII letters only.

### Example with curl (macOS/Linux; on Windows use `/docs` instead)
```bash
curl -X POST localhost:8000/api/auth/register -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","password":"a-long-password"}'
TOKEN=$(curl -s -X POST localhost:8000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","password":"a-long-password"}' | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
curl -X POST localhost:8000/api/memories -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Deploy notes","content":"Run build, upload dist","category":"work","tags":["deploy"]}'
curl "localhost:8000/api/memories/search?q=deploy" -H "Authorization: Bearer $TOKEN"
```

## 6. Database

- **SQLite** file at `backend/rewind.db` (created automatically, ignored by Git). No database server needed.
- **Tables** are created on startup with `Base.metadata.create_all()`. This only creates *missing* tables; it never deletes data and never changes existing tables.
- **Alembic is not used yet.** For a first phase with 2 tables, `create_all` is simpler to learn. Once the schema starts changing (new columns), switch to Alembic migrations so existing data can be upgraded. Moving to PostgreSQL later is mostly a `DATABASE_URL` change.
- **If you change a model** during development, delete `rewind.db` and restart (this erases your local data) or use Alembic.
- Data persists across restarts because it is stored in the file, not in memory.

## 7. Tests

```bash
pytest
```

Tests use a temporary in-memory database and their own test secret, so they never touch your real `rewind.db` or `.env`. They cover health/CORS, registration/login/tokens, password hashing, memory CRUD, validation, pagination, search, per-user isolation and persistence across engine restarts.

## 8. Connecting the existing frontend (later)

The frontend contains an **unused** helper, `rewind-ai-react/src/api.ts`, plus `.env.example` with `VITE_API_BASE_URL=http://localhost:8000`. No page uses it yet, so the UI and mock data are unchanged. To call the API from a page:

```ts
import { apiRequest } from '../api'

// 1. log in once and keep the token (e.g. in React state)
const { access_token } = await apiRequest<{ access_token: string }>('/api/auth/login', {
  method: 'POST',
  body: { email, password },
})

// 2. use it
const created = await apiRequest('/api/memories', {
  method: 'POST',
  token: access_token,
  body: { title: 'My note', content: '...', category: 'work', tags: ['demo'] },
})
const results = await apiRequest<{ items: unknown[]; total: number }>(
  `/api/memories/search?q=${encodeURIComponent('react')}`,
  { token: access_token },
)
```

The Knowledge Vault page (files/links) and the search bar map naturally to Memories + `/search`, but the UI needs a login screen first; that is a separate step. The Vault's file upload is **not** part of Phase 1.

## 9. Security notes and limitations

- Phase 1 has **no rate limiting**, so login can be brute-forced. Add rate limiting and lockouts before public use.
- Use **HTTPS** in production and set a strong, private `SECRET_KEY` and a real `CORS_ORIGINS`.
- Tokens cannot be revoked before they expire (no refresh/logout endpoint yet). Keep the lifetime short.
- No email verification or password reset yet.
- Storing the token in `localStorage` (the simplest approach) is exposed to XSS; consider alternatives when building the login UI.
- SQLite is for local development. Use PostgreSQL for a deployed multi-user app.
- Authentication and ownership checks are in place, but this has not had a professional security review. Do not treat it as production-ready.

## 10. Project structure

```
backend/
├── app/
│   ├── main.py            # app creation, CORS, startup (create tables)
│   ├── database.py        # engine, session, Base
│   ├── dependencies.py    # DB session + "current user" from token
│   ├── core/              # config (.env), security (hash/JWT), errors
│   ├── models/            # SQLAlchemy tables: User, Memory
│   ├── schemas/           # Pydantic request/response models + validation
│   ├── routers/           # URL endpoints: health, auth, memories
│   └── services/          # database logic (kept out of routers)
├── tests/
├── requirements.txt
├── pytest.ini
├── .env.example
└── .gitignore
```

# Rewind AI Backend (Phase 2)

FastAPI + SQLAlchemy 2 + SQLite backend for the Rewind AI dashboard in `../rewind-ai-react/`.

**Includes:** health check, user registration/login (JWT), a Memories API (create, list, get, update, delete, search, per-category counts) and a Projects API (create, list, search, get, update, delete). Every user only sees their own data. The React frontend in `../rewind-ai-react/` uses all of these.

**Not included yet (later phases):** AI/chat replies, embeddings, semantic search, activity analytics, file upload, external integrations.

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

Every `/api/memories/*` and `/api/projects/*` endpoint requires a logged-in user.

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
| GET | `/api/memories/categories` | `{"items":[{"category":"code","count":3}],"total":3}` — per-category counts (case-insensitive), used by the Vault counters. |
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

## 5b. Projects API

| Method | Path | Notes |
|---|---|---|
| POST | `/api/projects` | Create. `title` required (1–200 chars, trimmed). Optional: `description` (≤10,000, default `""`), `status` (`planning` \| `active` \| `on_hold` \| `completed`, default `active`), `progress` (integer 0–100, default 0), `tags` (same rules as memories). |
| GET | `/api/projects` | List, newest-updated first. Query: `q` (case-insensitive search in title **or** description), `status`, `limit` (1–100, default 20), `offset`. |
| GET | `/api/projects/{id}` | Get one. |
| PUT | `/api/projects/{id}` | **Replaces** the project (send `title`, `description`, `status`, `progress`, `tags`). |
| DELETE | `/api/projects/{id}` | Returns `{"deleted": true, "id": 1}`. |

Response fields: `id`, `title`, `description`, `status`, `progress`, `tags`, `created_at`, `updated_at`. The owner is stored (`projects.owner_id`) and enforced on every query but is not returned, matching memories. Another user's project gives **404**, the same as a missing one. `progress` and `tags` exist because the existing "My Projects" cards show a progress bar and tag chips.

## 6. Database

- **SQLite** file at `backend/rewind.db` (created automatically, ignored by Git). No database server needed.
- **Tables** (`users`, `memories`, `projects`) are created on startup with `Base.metadata.create_all()`. This only creates *missing* tables; it never deletes data and never changes existing tables.
- **Phase 2 database change:** one new table, `projects`. An existing Phase 1 `rewind.db` is upgraded automatically on the next start: `create_all` adds the missing table and leaves `users` and `memories` untouched (no manual migration step, nothing to delete). `tests/test_phase1_upgrade.py` checks exactly this. **Back up `rewind.db` first if it holds data you care about.**
- **Alembic is not used yet.** For a first phase with 2 tables, `create_all` is simpler to learn. Once the schema starts changing (new columns), switch to Alembic migrations so existing data can be upgraded. Moving to PostgreSQL later is mostly a `DATABASE_URL` change.
- **If you change a model** during development, delete `rewind.db` and restart (this erases your local data) or use Alembic.
- Data persists across restarts because it is stored in the file, not in memory.

## 7. Tests

```bash
pytest
```

Tests use a temporary in-memory database and their own test secret, so they never touch your real `rewind.db` or `.env`. They cover health/CORS, registration/login/tokens, password hashing, memory CRUD, validation, pagination, search, categories, project CRUD/validation/search/status filter, per-user isolation, persistence across engine restarts and the Phase 1 → Phase 2 database upgrade.

## 8. How the frontend connects

`rewind-ai-react/src/api.ts` is the single HTTP client (base URL from `VITE_API_BASE_URL`), `src/endpoints.ts` has one typed function per endpoint, and `src/auth.tsx` handles login state. The Vault page uses Memories (the Vault's type — doc / code / link / image / general — is stored as the memory `category`), My Projects and the Home page use Projects. The Vault's **file upload** is not supported by the API; the page creates text memories and links instead.

## 9. Security notes and limitations

- Phase 1 has **no rate limiting**, so login can be brute-forced. Add rate limiting and lockouts before public use.
- Use **HTTPS** in production and set a strong, private `SECRET_KEY` and a real `CORS_ORIGINS`.
- Tokens cannot be revoked before they expire. "Log out" in the UI only deletes the token in the browser; there is no refresh or server-side logout endpoint. Keep the lifetime short.
- No email verification or password reset yet.
- The frontend keeps the token in `localStorage` (simplest option), which any script on the page can read (XSS). Acceptable for local development; consider httpOnly cookies before deploying.
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
│   ├── models/            # SQLAlchemy tables: User, Memory, Project
│   ├── schemas/           # Pydantic request/response models + validation
│   ├── routers/           # URL endpoints: health, auth, memories, projects
│   └── services/          # database logic (kept out of routers)
├── tests/
├── requirements.txt
├── pytest.ini
├── .env.example
└── .gitignore
```

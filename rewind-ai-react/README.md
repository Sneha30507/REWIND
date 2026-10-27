# Rewind AI Dashboard (React + TypeScript + Tailwind)

Built with Vite, React 18, TypeScript and Tailwind CSS 3.

## Run on localhost
The dashboard needs the FastAPI backend (see `../backend/README.md`). Start it first:
```bash
cd ../backend && uvicorn app.main:app --reload --port 8000
```
Then:
```bash
npm install
npm run dev
```
Open http://localhost:3000 and create an account on the **Create an account** page (`/register`).
The dev server uses port 3000 with `strictPort`, because the backend only allows that origin by default (`CORS_ORIGINS`).

### Configuration
| Variable | Default | Meaning |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend address. Copy `.env.example` to `.env` to change it. Never put secrets in `VITE_*` variables: they are visible in the browser. |

## Build for production
```bash
npm run build
npm run preview
```

## Pages (React Router)
| Route | Page |
|---|---|
| `/` | Home |
| `/login`, `/register` | Sign in / create account (public) |
| `/projects` | My Projects (server search, tag filter, add, delete) |
| `/projects/:id` | Project details, edit, delete |
| `/assistant` | AI Assistant (demo chat) |
| `/vault` | Knowledge Vault (memories: search, type filter, add note/link, delete) |
| `/vault/:id` | Memory details, edit, delete |
| `/activity` | Activity History (grouped, filterable) |
| `/settings` | Settings (account email, log out; toggles and apps are demo-only) |

**Real data (from the backend, saved in the database):** accounts/login, Knowledge Vault memories, My Projects, the Home "Recent Projects" list, and the *Projects* and *Files Remembered* counters.
**Still demo data (in memory, resets on refresh):** AI Assistant replies, Activity History, the Home recent-activity list, the *Apps Connected* / *Days Active* counters, and the Settings toggles / connected apps.

## Structure
- `src/data.ts` - the remaining demo content (assistant, activity, settings apps, nav)
- `src/api.ts` - HTTP client (token, errors, base URL); `src/endpoints.ts` - one function per API endpoint
- `src/auth.tsx` - login state (`useAuth`); `src/components/RequireAuth.tsx` guards the pages
- `src/types.ts` - TypeScript types
- `src/pages/` - one file per page
- `src/components/` - Layout, Sidebar, TopBar, Hero, Toggle, Icon and other shared parts
- `tailwind.config.js` - colors and font

## Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: Rewind AI dashboard"
git branch -M main
git remote add origin https://github.com/<your-username>/rewind-ai-dashboard.git
git push -u origin main
```

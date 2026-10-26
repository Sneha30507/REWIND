# Rewind AI Dashboard (React + TypeScript + Tailwind)

Built with Vite, React 18, TypeScript and Tailwind CSS 3.

## Run on localhost
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Build for production
```bash
npm run build
npm run preview
```

## Pages (React Router)
| Route | Page |
|---|---|
| `/` | Home |
| `/projects` | My Projects (search, tag filter, add, delete) |
| `/assistant` | AI Assistant (demo chat) |
| `/vault` | Knowledge Vault (upload, add links, filter) |
| `/activity` | Activity History (grouped, filterable) |
| `/settings` | Settings (profile, toggles, apps) |

The AI Assistant replies are simulated. Replace `craftReply()` in `src/pages/Assistant.tsx` with your real backend call.
All data is in memory, so it resets on refresh.

## Structure
- `src/data.ts` - all dummy content (projects, activity, stats). Edit here to change text.
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

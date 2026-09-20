# Manyata Enterprises — Frontend

React + Vite + Tailwind CSS v4 frontend for the Manyata Enterprises rooftop solar platform.

## Features

- **Public site** — Home, About, Service, Careers, Contact, Partner, Terms, Privacy, Refund, Installation, Join Us (password-gated)
- **15-step solar application wizard** — with auto-save, resume-from-draft, live preview before submit, and PDF download
- **Application tracking** — public lookup by application number + phone
- **Staff login** — owner + employee auth
- **Owner dashboard** — overview stats, employees CRUD, branches CRUD, applications list with filters and pagination, other submissions (careers / join-us / contacts / partners), partner approve/reject
- **Employee dashboard** — branch-scoped application management, branch stats
- **Application detail page** — full data + uploaded documents preview, status update, submit-to-govt-portal flow, status timeline

## Tech stack

- React 19
- Vite 8
- Tailwind CSS v4
- React Router v7
- Framer Motion
- Lucide React icons

## Quick start

```bash
npm install
cp .env.example .env
# Set VITE_API_URL to your backend
npm run dev
```

App runs on `http://localhost:5173`.

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Full backend API URL | `http://localhost:5000/api` |
| `VITE_API_BASE` | Backend base (for uploaded files) | `http://localhost:5000` |

## Project structure

```
src/
├── assets/          Images and asset index
├── components/      Reusable components (Navbar, Footer, Layout, DashboardLayout, PasswordGate, ProtectedRoute, ...)
├── contexts/        AuthContext
├── pages/           Route pages (Home, Apply, Login, AdminDashboard, ...)
├── services/        api.js — centralized fetch wrapper
├── App.jsx          Router + AuthProvider
├── main.jsx         Entry point
└── index.css        Tailwind theme tokens
```

## Routing

| Route | Access | Description |
|---|---|---|
| `/` | Public | Home |
| `/about`, `/service`, `/contact`, `/career`, `/partner` | Public | Static pages |
| `/apply` | Public | 15-step application wizard |
| `/track` | Public | Track application |
| `/terms`, `/privacy`, `/refund` | Public | Legal |
| `/installation` | Public | Technical installation form |
| `/join-us-mnyt2026` | Password | Join Us (password-gated) |
| `/login` | Public | Staff login |
| `/change-password` | Auth | Change own password |
| `/admin` | Owner | Owner dashboard |
| `/admin/applications/:id` | Owner | Application detail |
| `/employee` | Employee | Employee dashboard |
| `/employee/applications/:id` | Employee | Application detail |

## Development notes

- All API calls go through `src/services/api.js` — do not use raw `fetch` in pages.
- Auth uses httpOnly cookies; `credentials: "include"` is set globally in `apiFetch`.
- Draft progress in `/apply` is stored in `localStorage` under key `manyata_apply_draft_v1`.
- Vite proxy is configured for `/api` and `/uploads` in `vite.config.js` — you can use relative paths in dev, but the app uses `VITE_API_URL` explicitly.

## Build

```bash
npm run build
npm run preview
```

## Deploy

- Netlify: `_redirects` file is already in `public/` for SPA fallback.
- Vercel: default SPA config works.
- Any static host: serve `dist/` and route all unknown paths to `index.html`.

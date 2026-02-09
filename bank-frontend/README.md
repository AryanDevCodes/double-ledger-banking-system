# Bank Frontend

Role-based banking operations dashboard for the bank platform. Built with React + Vite, uses token auth, and renders dashboards for admins, managers, auditors, and end users.

## Quick start

```sh
npm install
npm run dev
```

The dev server defaults to http://localhost:8080. Ensure the backend is reachable at `VITE_API_BASE_URL`.

## Environment

Create `.env.local` in `bank-frontend/`:

```sh
VITE_API_BASE_URL=http://localhost:8080
VITE_ENABLE_MOCKS=false
```

`VITE_API_BASE_URL` points to the backend REST API. `VITE_ENABLE_MOCKS` should stay false (mock data has been removed).

## Features

- Protected routing with role checks for admin, manager, customer manager, user, and auditor views.
- Auth with localStorage token storage; login/register flows hit `/api/auth` endpoints.
- Data fetching via React Query with sensible defaults (stale 5m, retry once, no refetch on focus).
- Audit and security views: audit logs, access logs, sessions, activity feed.
- Banking flows: banks, customers, accounts, transactions, UPI profiles/payments.
- Reusable UI built on shadcn-ui/Radix + Tailwind; global toasts (shadcn + sonner) and tooltips.

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — production bundle
- `npm run preview` — serve the production build locally
- `npm run lint` — ESLint
- `npm run test` — Vitest unit tests
- `npm run test:watch` — Vitest watch mode

## Architecture

- Entry: `src/main.tsx` mounts `App` with global styles.
- Routing: `App` sets up `BrowserRouter` with public login/register and protected routes under `DashboardLayout`. Role-based redirects use `ProtectedRoute` and `getDashboardRoute`.
- State: `AuthProvider` stores user and tokens in localStorage and exposes helpers (`hasRole`, `hasAnyRole`).
- Data: `@/lib/api-client` wraps fetch with timeout, bearer auth, and 401 handling; API modules cover bank, customer, account, transaction, UPI, audit, access log, and session endpoints.
- UI: shadcn-ui components, Radix primitives, custom cards/tables for dashboards; `Toaster` and `Sonner` for notifications.

## Project structure

- `src/pages` — routed views (dashboards, login/register, banks, customers, accounts, transactions, UPI, audit, security, payments)
- `src/components` — layout (sidebar, wrappers), tables, cards, permissions gate, error boundary
- `src/contexts` — auth provider/hooks
- `src/lib` — API client, RBAC helpers, formatting utilities
- `src/hooks` — API hook, toast hook, mobile helpers
- `src/data` — intentionally empty (live data only)
- `public` — static assets

## Backend expectations

- Auth: `/api/auth/login` and `/api/auth/register` return `accessToken`, `refreshToken`, user profile, roles.
- All API calls prefix `VITE_API_BASE_URL`; bearer token is sent automatically from localStorage.
- 401 responses clear tokens and redirect to `/login`.

## Build & deploy

```sh
npm run build
npm run preview # optional local smoke test
```

Deploy the `dist/` directory to your hosting target. If serving behind a different origin, ensure CORS allows the frontend origin.

## Troubleshooting

- Empty data: confirm backend is up and `VITE_API_BASE_URL` is correct.
- Auth loops: check tokens in localStorage and backend CORS/HTTPS settings.
- Port conflict: adjust `server.port` in `vite.config.ts`.

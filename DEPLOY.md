# Deployment

## Backend — Coolify

- Build context: `backend/`
- Dockerfile: `backend/Dockerfile`
- Environment variables: set all variables from `backend/.env.example` in Coolify's environment panel
- Health check: `/` (HTTP 200)
- Port: `5000`

## Main Frontend — Cloudflare Pages

- Project root: `frontend/24ifr`
- Build command: `npm install && npm run build`
- Output directory: `dist`
- Environment variables:
  - `VITE_API_BASE_URL` = `https://api.yourdomain.com`

## Admin Frontend — Cloudflare Pages

- Project root: `frontend/admin`
- Build command: `npm install && npm run build`
- Output directory: `dist`
- Environment variables:
  - `VITE_API_BASE_URL` = `https://api.yourdomain.com`

## Docs — Cloudflare Pages

- Project root: `docs/`
- Build command: (none — static files, no build needed)
- Output directory: `docs/`
- Environment variables: none required
- Suggested domain: docs.hasanmahmood.org
- After deploying, set VITE_DOCS_URL in both the main app and admin Cloudflare Pages environment variables to point to this domain.

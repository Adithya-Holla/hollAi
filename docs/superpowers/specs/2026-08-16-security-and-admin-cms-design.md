# Security Hardening + Admin CMS — Design

Date: 2026-08-16
Status: Approved for implementation (Sections A & B). Section C (frontend redesign) is a separate, later phase — not covered here.

## Context

The portfolio backend (Express + MongoDB) currently has:
- A public `POST /api/auth/register` endpoint — anyone can create an account and obtain a JWT.
- No `JWT_SECRET` set in `.env` at all, so `jwt.sign`/`jwt.verify` operate against `undefined`.
- `routes/certifications.js` write endpoints (POST/PUT/DELETE) with **no auth middleware** — publicly writable.
- `routes/projects.js` with **no write endpoints** at all — projects can only be added via a one-off Node script (`scripts/createProjects.js`) that drops and recreates the whole collection.
- A CORS allow-list containing a leftover placeholder origin (`https://your-production-frontend-url.com`).
- Verbose `console.log`s in `server.js` that print partial Mongo URIs and env-flag state.

Goal: fix the above, then give the site owner a single authenticated admin page to add/edit/delete projects and certifications — including uploading images, which get stored in the owner's Dropbox (matching the existing `dropbox.com/.../raw=1` URL pattern already used in the DB).

## Section A — Security & bug fixes

1. **JWT_SECRET**: generate a strong random value; document it as a required `.env` key. Server should fail fast at startup if `JWT_SECRET` is missing (instead of silently signing tokens with `undefined`).
2. **Remove public registration**: delete `POST /api/auth/register` from `routes/auth.js`. Keep `POST /api/auth/login` only.
3. **Seed the single admin account**: `backend/scripts/createAdmin.js` — a one-time interactive/CLI script that creates exactly one `User` document (reuses existing bcrypt hashing in `models/User.js`). Run once locally, never exposed via HTTP.
4. **Protect all mutating routes** with the existing `middleware/auth.js`:
   - `certifications.js`: POST, PUT, DELETE
   - `projects.js`: new POST, PUT, DELETE (see Section B)
   - `upload.js`: the new upload endpoint (Section B)
5. **CORS cleanup**: remove the placeholder origin from `server.js`; keep only real origins (localhost dev ports + the actual Netlify/production URL).
6. **Logging cleanup**: remove `console.log`s that print Mongo URI fragments or env variable presence/absence in `server.js` and the certifications route.
7. **Basic input validation** on write routes (required fields present, correct types) before hitting Mongoose — return 400 with a clear message rather than letting a bad request 500 or silently save a broken doc.
8. **Rate limiting**: add `express-rate-limit` on `POST /api/auth/login` (e.g. 10 attempts / 15 min per IP) to blunt brute-force attempts against the single admin account.
9. **Security headers**: add `helmet()` middleware.
10. Existing seed scripts (`createCertifications.js`, `createProjects.js`) are left in place as historical one-time seeders (not deleted) — the admin CMS becomes the normal way to add data going forward.

## Section B — Admin CMS (master control page)

### Auth flow
- Frontend route `/admin/login`: simple form → `POST /api/auth/login` → on success, store JWT (localStorage) and redirect to `/admin`.
- Frontend route `/admin` (and sub-views): a protected layout component that checks for a valid token; if absent/expired, redirect to `/admin/login`. Not linked from public nav/footer — reachable only by direct URL.
- All admin API calls attach `Authorization: Bearer <token>`.

### Backend: Projects CRUD
Add to `routes/projects.js` (auth-protected):
- `POST /api/projects` — create
- `PUT /api/projects/:id` — update
- `DELETE /api/projects/:id` — delete

Existing GET routes stay public (site still needs to read them).

### Backend: Certifications CRUD
`routes/certifications.js` already has POST/PUT/DELETE — just add the `auth` middleware to those three. GET routes stay public.

### Backend: Image upload → Dropbox
New `backend/routes/upload.js`, mounted at `POST /api/upload` (auth-protected):
- Accepts `multipart/form-data` with a single image file (via `multer`, memory storage, size-limited e.g. 10MB, image-mimetype-only).
- Uses the `dropbox` npm SDK with a long-lived setup: Dropbox App key + secret + a refresh token (obtained once via OAuth) stored in `.env` (`DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET`, `DROPBOX_REFRESH_TOKEN`). The SDK exchanges the refresh token for short-lived access tokens automatically per request — avoids the 4-hour access-token expiry.
- Uploads the file to a fixed app folder (e.g. `/portfolio-uploads/<timestamp>-<sanitized-filename>`).
- Creates (or fetches existing) a shared link for the uploaded file, rewrites it to end in `?raw=1` (same shape as current DB entries), and returns `{ imageUrl }` to the frontend.
- Frontend admin forms call this endpoint on file selection/submit, then use the returned `imageUrl` as the value for the project/certification's `imageUrl` field.

Setup note (user-provided, not done by the assistant): creating the Dropbox App in the App Console with `files.content.write` + `sharing.write` scopes, and generating the refresh token, since it requires an interactive OAuth consent the assistant cannot perform. The assistant will provide exact step-by-step instructions and a small helper script to run the one-time OAuth exchange.

### Frontend: Admin UI
- `AdminLoginPage` — email/password form, error display.
- `AdminPage` (protected) — two tabs: **Projects** and **Certifications**.
  - Each tab: table of existing entries (title, featured flag, edit/delete buttons) + an "Add new" form (all model fields, file input for image, featured checkbox).
  - Edit reuses the same form, pre-filled, PUT instead of POST.
  - Delete asks for confirmation before calling DELETE.
- No new component library dependency — styled consistently with whatever design system Section C establishes later; for now, functional styling matching current site conventions is enough (visual polish of the admin page itself is out of scope for the "extreme redesign" ask, which targets the public-facing pages).

## Error handling
- All new/modified routes return structured JSON errors (`{ message }`) with appropriate status codes (400 validation, 401 auth, 404 not found, 500 unexpected) — consistent with existing route conventions.
- Upload route specifically handles: no file provided (400), file too large/wrong type (400, enforced by multer config), Dropbox API failure (502 with a generic message, detailed error logged server-side only).

## Testing
- Manual verification: login flow, CRUD create/edit/delete for both projects and certifications, image upload end-to-end (file → Dropbox → URL saved → renders on public pages), and confirming unauthenticated requests to protected routes are rejected (401).
- No existing automated test suite in this repo; not introducing one as part of this change (out of scope).

## Out of scope (this spec)
- Section C, the public-facing visual redesign — separate design pass via the `frontend-design` skill, done after this phase.
- Multi-admin / role-based access — single admin account only, per user decision.
- Automated test infrastructure.

# Deploying hollAI

Two services: a Node/Express API and a static React site. The API must go
out **first** — the frontend depends on routes that only exist on this
branch.

---

## 0 · Before anything

Merge this branch to `main` (or point Render at the branch). The deployed
API currently runs `main`, which is why `/api/auth/login` returns 404: the
auth routes exist there but are never mounted.

---

## 1 · Backend — environment variables

Set these in **Render → your API service → Environment**. Render injects
`PORT` itself, so do not set it.

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | yes | Already set. Unchanged. |
| `JWT_SECRET` | **yes — new** | **At least 16 characters.** The server calls `process.exit(1)` on boot without it, so a missing value is a crash loop, not a degraded service. Generate one with `openssl rand -base64 32`. |
| `RESEND_API_KEY` | **yes — new** | From resend.com. Value is in `backend/.env` locally. |
| `EMAIL_FROM` | recommended | `hollAi Contact <onboarding@resend.dev>` until a domain is verified in Resend. |
| `EMAIL_TO` | yes | Where contact messages are delivered. |
| `CORS_ORIGINS` | optional | Comma-separated. Leave blank unless the site moves off `hollai.onrender.com`. |
| `DROPBOX_APP_KEY` | for admin uploads | Existing. |
| `DROPBOX_APP_SECRET` | for admin uploads | Existing. |
| `DROPBOX_REFRESH_TOKEN` | for admin uploads | Existing. |
| `NODE_ENV` | recommended | `production`. |

`EMAIL_USER`, `EMAIL_PASS` and `EMAIL_SERVICE` are no longer read by
anything and can be deleted.

Build command `npm install`, start command `npm start`.

### After it deploys

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"x@y.z","password":"wrong"}' \
  https://hollai-backend-b31l.onrender.com/api/auth/login
```

Expect **401**. A 404 means the new build did not go out; a 502/503 that
repeats usually means `JWT_SECRET` is missing and the process is exiting
on boot — check the logs for `FATAL: JWT_SECRET`.

---

## 2 · Create the admin account

There is no signup route by design. Render's free tier has no shell, so
run this locally against the **production** database — `backend/.env`
already points at it:

```bash
cd backend
node scripts/createAdmin.js <username> <email> <password>
```

It refuses to run if any user already exists, so it cannot be used to add
a second admin by accident. Then sign in at `/admin/login`.

---

## 3 · Frontend

```bash
cd frontend
npm install
npm run build      # outputs to frontend/build
```

Publish directory `build`. The API base URL is compiled in — it points at
the Render API for any non-localhost host — so there is nothing to
configure.

**The site needs an SPA rewrite** or every route except `/` will 404 on
refresh. `public/_redirects` and `netlify.toml` already cover Netlify. On
a Render Static Site, add a rewrite rule:

- Source `/*` → Destination `/index.html`, Action **Rewrite**

---

## 4 · Verify

- `/` — the cinematic plays once, then the hero
- `/projects` — projects load from the API
- `/admin/login` — sign in works, and Projects/Certifications CRUD saves
- `/contact` — send a message and confirm it arrives

If a contact message reports *"Saved, but the email notification failed"*,
the record is still in MongoDB. List failures with:

```
GET /api/emails/status/failed
```

---

## Notes

- **Resend sending limits.** Until a domain is verified, Resend only
  accepts `onboarding@resend.dev` as the sender and only delivers to the
  account owner's address. That covers this contact form. To send from
  `you@yourdomain.com`, verify the domain in Resend and update
  `EMAIL_FROM`.
- **Why not SMTP.** Render's free tier blocks outbound SMTP, so
  `smtp.gmail.com:465` fails with `ETIMEDOUT`. Resend goes over HTTPS and
  is unaffected.
- **Four earlier messages failed** to send and are sitting in MongoDB
  under `status: failed`. They are readable via the endpoint above.

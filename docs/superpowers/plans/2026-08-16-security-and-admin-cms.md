# Security Hardening + Admin CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the backend's security holes (missing JWT secret, open registration, unauthenticated write routes) and build a single-admin CMS ("master control page") that lets the site owner add/edit/delete projects and certifications through a web UI, with images uploaded straight to Dropbox.

**Architecture:** Express/MongoDB backend gets: a fail-fast JWT secret check, registration removed in favor of a one-time seed script, `auth` middleware applied to all write routes, new CRUD endpoints for projects, and a new Dropbox-backed upload endpoint. React frontend gets: an `/admin/login` page, a token-gated `/admin` page with Projects/Certifications tabs (table + add/edit form using the upload endpoint), never linked from public nav.

**Tech Stack:** Express 4, Mongoose 7, `jsonwebtoken`, `bcryptjs`, `multer`, `dropbox` (official SDK), `helmet`, `express-rate-limit`; React 19, `react-router-dom` 7.

**Spec:** `docs/superpowers/specs/2026-08-16-security-and-admin-cms-design.md`

## Global Constraints

- No public registration endpoint — single admin account only, seeded via a local script.
- `JWT_SECRET` must be present at startup or the server refuses to start.
- Every mutating route (POST/PUT/DELETE on projects, certifications, upload) requires the `auth` middleware.
- Dropbox image URLs stored in the DB must end in `?raw=1`, matching existing records.
- `/admin` is never linked from public navigation — reachable only by direct URL.
- No new automated test infrastructure — verification steps in this plan are manual (curl / browser), per spec's explicit scope decision.

---

## Task 1: Backend dependencies, env validation, and `.env.example`

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/server.js`
- Create: `backend/.env.example`

**Interfaces:**
- Produces: server now throws and exits at boot if `process.env.JWT_SECRET` is unset — every later task that relies on JWT auth can assume this invariant holds.

`jsonwebtoken` and `bcryptjs` are already `require()`'d by `backend/middleware/auth.js`, `backend/routes/auth.js`, and `backend/models/User.js`, but are **not** in `package.json` or installed — auth is currently non-functional. This task fixes that and adds the packages needed for later tasks.

- [ ] **Step 1: Install the missing and new backend dependencies**

Run:
```bash
cd backend && npm install jsonwebtoken bcryptjs multer dropbox helmet express-rate-limit
```

- [ ] **Step 2: Verify they landed in `package.json`**

Open `backend/package.json` and confirm `jsonwebtoken`, `bcryptjs`, `multer`, `dropbox`, `helmet`, and `express-rate-limit` are now listed under `dependencies`.

- [ ] **Step 3: Add a fail-fast JWT secret check to `server.js`**

In `backend/server.js`, immediately after `dotenv.config();` (around line 8), add:

```javascript
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error('FATAL: JWT_SECRET is missing or too short. Set a strong JWT_SECRET in backend/.env before starting the server.');
  process.exit(1);
}
```

- [ ] **Step 4: Create `backend/.env.example`**

```
PORT=5000
MONGODB_URI=
NODE_ENV=development
JWT_SECRET=
EMAIL_USER=
EMAIL_PASS=
EMAIL_TO=
EMAIL_SERVICE=
DROPBOX_APP_KEY=
DROPBOX_APP_SECRET=
DROPBOX_REFRESH_TOKEN=
```

- [ ] **Step 5: Generate your own `JWT_SECRET` and add it to `backend/.env`**

Run this once to generate a strong secret, then paste the output into `backend/.env` as `JWT_SECRET=<value>` (this file is gitignored, never commit it):
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

- [ ] **Step 6: Verify the server now fails without the secret, and starts with it**

Temporarily rename `backend/.env` to `backend/.env.bak`, run `node backend/server.js` from the repo root — expect it to print the FATAL message and exit immediately. Rename it back, run `node backend/server.js` again — expect it to reach `Server is running on port ...` in the logs. Stop it with Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/server.js backend/.env.example
git commit -m "Add auth/upload dependencies and fail-fast JWT_SECRET check"
```

---

## Task 2: Remove public registration; add one-time admin seed script

**Files:**
- Modify: `backend/routes/auth.js`
- Create: `backend/scripts/createAdmin.js`

**Interfaces:**
- Consumes: `models/User.js` (`User` model, pre-save bcrypt hashing already implemented — no changes needed there).
- Produces: `POST /api/auth/login` remains the only auth route; no `/api/auth/register` exists anywhere after this task.

- [ ] **Step 1: Delete the `/register` route from `backend/routes/auth.js`**

Remove lines 6-45 (the entire `router.post('/register', ...)` block) from `backend/routes/auth.js`, leaving only the `require`s, the `/login` route, and `module.exports`. The file should read:

```javascript
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Create `backend/scripts/createAdmin.js`**

```javascript
/**
 * One-time script to seed the single admin account.
 * Run: node scripts/createAdmin.js <username> <email> <password>
 * Never expose this over HTTP.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const [username, email, password] = process.argv.slice(2);

  if (!username || !email || !password) {
    console.error('Usage: node scripts/createAdmin.js <username> <email> <password>');
    process.exit(1);
  }
  if (password.length < 6) {
    console.error('Password must be at least 6 characters.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const existingCount = await User.countDocuments();
  if (existingCount > 0) {
    console.error(`Refusing to create another admin: ${existingCount} user(s) already exist. Delete the existing user first if you want to replace it.`);
    await mongoose.connection.close();
    process.exit(1);
  }

  const user = new User({ username, email, password });
  await user.save();

  console.log(`Admin user created: ${user.username} <${user.email}>`);
  await mongoose.connection.close();
}

main().catch((err) => {
  console.error('Failed to create admin:', err);
  process.exit(1);
});
```

- [ ] **Step 3: Run it to create your admin account**

```bash
cd backend && node scripts/createAdmin.js <your-username> <your-email> <your-password>
```
Expected output: `Admin user created: <username> <<email>>`. Pick a real password now — you'll use it to log into `/admin/login` later.

- [ ] **Step 4: Verify login works and registration is gone**

With the server running (`node backend/server.js` in one terminal), from another terminal:
```bash
curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"<your-email>\",\"password\":\"<your-password>\"}"
```
Expected: JSON with a `token` field.
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5000/api/auth/register
```
Expected: `404` (route no longer exists).

- [ ] **Step 5: Commit**

```bash
git add backend/routes/auth.js backend/scripts/createAdmin.js
git commit -m "Remove public registration; add one-time admin seed script"
```

---

## Task 3: Shared write-route validation helper

**Files:**
- Create: `backend/utils/validation.js`

**Interfaces:**
- Produces: `validateProject(body)` and `validateCertification(body)`, each returning `{ valid: boolean, errors: string[] }`. Tasks 4 and 5 import these.

- [ ] **Step 1: Create `backend/utils/validation.js`**

```javascript
function validateProject(body) {
  const errors = [];
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    errors.push('title is required');
  }
  if (!body.description || typeof body.description !== 'string' || !body.description.trim()) {
    errors.push('description is required');
  }
  if (!Array.isArray(body.technologies) || body.technologies.length === 0) {
    errors.push('technologies must be a non-empty array');
  }
  if (!body.imageUrl || typeof body.imageUrl !== 'string') {
    errors.push('imageUrl is required');
  }
  return { valid: errors.length === 0, errors };
}

function validateCertification(body) {
  const errors = [];
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    errors.push('title is required');
  }
  if (!body.organization || typeof body.organization !== 'string' || !body.organization.trim()) {
    errors.push('organization is required');
  }
  if (!body.issueDate || isNaN(Date.parse(body.issueDate))) {
    errors.push('issueDate is required and must be a valid date');
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { validateProject, validateCertification };
```

- [ ] **Step 2: Commit**

```bash
git add backend/utils/validation.js
git commit -m "Add shared validation helpers for projects and certifications"
```

---

## Task 4: Projects CRUD (auth-protected) + certifications auth lockdown

**Files:**
- Modify: `backend/routes/projects.js`
- Modify: `backend/routes/certifications.js`

**Interfaces:**
- Consumes: `middleware/auth.js` (default export, Express middleware — sets `req.userId`), `utils/validation.js` (`validateProject`, `validateCertification`).
- Produces: `POST /api/projects`, `PUT /api/projects/:id`, `DELETE /api/projects/:id` (all auth-protected). Certifications' existing POST/PUT/DELETE now also auth-protected.

- [ ] **Step 1: Add CRUD + auth to `backend/routes/projects.js`**

Replace the full file with:

```javascript
const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const { validateProject } = require('../utils/validation');

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
});

// Get featured projects
router.get('/featured', async (req, res) => {
  try {
    const featuredProjects = await Project.find({ featured: true }).sort({ createdAt: -1 });
    res.json(featuredProjects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching featured projects', error: error.message });
  }
});

// Get single project
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project', error: error.message });
  }
});

// Create project
router.post('/', auth, async (req, res) => {
  const { valid, errors } = validateProject(req.body);
  if (!valid) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }
  try {
    const project = new Project(req.body);
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
});

// Update project
router.put('/:id', auth, async (req, res) => {
  const { valid, errors } = validateProject({ ...req.body });
  if (!valid) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error updating project', error: error.message });
  }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting project', error: error.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Add auth + validation to `backend/routes/certifications.js`**

In `backend/routes/certifications.js`, add near the top (after the `Certification` require):
```javascript
const auth = require('../middleware/auth');
const { validateCertification } = require('../utils/validation');
```

Change the three mutating route signatures and add validation:
```javascript
router.post('/', auth, async (req, res) => {
  const { valid, errors } = validateCertification(req.body);
  if (!valid) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }
  try {
    const certification = new Certification(req.body);
    await certification.save();
    res.status(201).json(certification);
  } catch (error) {
    res.status(500).json({ message: 'Error creating certification', error: error.message });
  }
});
```
```javascript
router.put('/:id', auth, async (req, res) => {
  const { valid, errors } = validateCertification({ ...req.body });
  if (!valid) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }
  try {
    const certification = await Certification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!certification) {
      return res.status(404).json({ message: 'Certification not found' });
    }
    res.json(certification);
  } catch (error) {
    res.status(500).json({ message: 'Error updating certification', error: error.message });
  }
});
```
```javascript
router.delete('/:id', auth, async (req, res) => {
  try {
    const certification = await Certification.findByIdAndDelete(req.params.id);
    if (!certification) {
      return res.status(404).json({ message: 'Certification not found' });
    }
    res.json({ message: 'Certification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting certification', error: error.message });
  }
});
```
Also remove the `console.log`/`console.error` calls inside these route handlers (keep the GET routes' logs out too — see Task 5 for the broader logging cleanup, but strip them here now since you're already editing these blocks).

- [ ] **Step 3: Verify auth is enforced**

With the server running:
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5000/api/projects -H "Content-Type: application/json" -d "{}"
```
Expected: `401` (no token).

```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"<your-email>\",\"password\":\"<your-password>\"}" | node -e "process.stdin.on('data', d => console.log(JSON.parse(d).token))")
curl -s -X POST http://localhost:5000/api/projects -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"title\":\"Test\",\"description\":\"Test desc\",\"technologies\":[\"Test\"],\"imageUrl\":\"https://example.com/x.png\"}"
```
Expected: `201` with the created project JSON. Delete it afterward via `curl -X DELETE http://localhost:5000/api/projects/<id> -H "Authorization: Bearer $TOKEN"`.

- [ ] **Step 4: Commit**

```bash
git add backend/routes/projects.js backend/routes/certifications.js
git commit -m "Add authenticated CRUD for projects; require auth on certification writes"
```

---

## Task 5: Server hardening — CORS, logging, helmet, rate limiting

**Files:**
- Modify: `backend/server.js`

**Interfaces:**
- Consumes: `express-rate-limit`, `helmet` (installed in Task 1).

- [ ] **Step 1: Fix CORS origins**

In `backend/server.js`, replace the `corsOptions.origin` array (remove the placeholder, keep only real origins — update `'https://your-production-frontend-url.com'` to your actual Netlify URL, or drop the line if you don't have one yet):

```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://hollai.netlify.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
```

- [ ] **Step 2: Add helmet**

Add near the top, after `const dotenv = require('dotenv');`:
```javascript
const helmet = require('helmet');
```
And after `app.use(cors(corsOptions));`:
```javascript
app.use(helmet());
```

- [ ] **Step 3: Add rate limiting to login**

Add near the top:
```javascript
const rateLimit = require('express-rate-limit');
```
Before the routes are mounted (right before `app.use('/api/auth', ...)`— note `server.js` doesn't currently mount `/api/auth` at all; see Step 5), define:
```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
```

- [ ] **Step 4: Remove verbose/leaky logging**

Delete the `console.log('Attempting to connect to MongoDB with URI:', ...)` block (lines 30-32) and the `mongoose.connection.db.listCollections()...` collection-listing block inside the `.then()` (lines 40-50) in `backend/server.js`. Replace the `.then()` with:
```javascript
.then(() => {
  console.log('MongoDB connected successfully');
})
```
Also remove the `EMAIL_USER`/`EMAIL_TO` presence flags from the `/test` route's JSON response (lines ~98-103) — keep `/test` returning just `{ message, timestamp }`.

- [ ] **Step 5: Mount the auth routes with the rate limiter**

`backend/server.js` currently never mounts `routes/auth.js` at all — this is itself a bug (login is unreachable). Add, alongside the other route imports:
```javascript
const authRoutes = require('./routes/auth');
```
And mount it before the other `/api/...` mounts, applying the limiter only to `/login`:
```javascript
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
```

- [ ] **Step 6: Verify the server still boots and login still works**

```bash
node backend/server.js
```
In another terminal, repeat the login curl from Task 2 Step 4 — expect the same `token` response. Then hit `POST /api/auth/login` with a wrong password 11 times in a row and confirm the 11th response is `429`.

- [ ] **Step 7: Commit**

```bash
git add backend/server.js
git commit -m "Harden server: real CORS origins, helmet, rate-limited login, remove leaky logs, mount auth routes"
```

---

## Task 6: Dropbox image upload

**Files:**
- Create: `backend/utils/dropboxService.js`
- Create: `backend/routes/upload.js`
- Modify: `backend/server.js`

**Interfaces:**
- Produces: `uploadImageToDropbox(buffer, originalFilename)` → `Promise<string>` (the `?raw=1` shared URL), used only by `routes/upload.js`. `POST /api/upload` (auth-protected, `multipart/form-data`, field name `image`) → `{ imageUrl: string }`.

Before this task, you need a Dropbox App: go to the Dropbox App Console, create an app with "Scoped access" and "App folder" access type, enable the `files.content.write` and `sharing.write` permission scopes under the Permissions tab, then note the App key and App secret from the Settings tab. You also need a refresh token — Step 1 below generates it.

- [ ] **Step 1: Generate a Dropbox refresh token (one-time, interactive)**

Create `backend/scripts/getDropboxRefreshToken.js`:
```javascript
/**
 * One-time helper: exchanges an OAuth authorization code for a refresh token.
 * Run: node scripts/getDropboxRefreshToken.js <APP_KEY> <APP_SECRET>
 * It prints an authorize URL — open it, approve, paste the code back in.
 */
const readline = require('readline');
const { Dropbox, DropboxAuth } = require('dropbox');

async function main() {
  const [appKey, appSecret] = process.argv.slice(2);
  if (!appKey || !appSecret) {
    console.error('Usage: node scripts/getDropboxRefreshToken.js <APP_KEY> <APP_SECRET>');
    process.exit(1);
  }

  const dbxAuth = new DropboxAuth({ clientId: appKey, clientSecret: appSecret });
  const authUrl = await dbxAuth.getAuthenticationUrl(
    undefined, undefined, 'code', 'offline', undefined, undefined, false
  );

  console.log('Open this URL, approve access, and paste the resulting code below:');
  console.log(authUrl);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Code: ', async (code) => {
    dbxAuth.setClientSecret(appSecret);
    const response = await dbxAuth.getAccessTokenFromCode('', code.trim());
    console.log('\nAdd this to backend/.env as DROPBOX_REFRESH_TOKEN:');
    console.log(response.result.refresh_token);
    rl.close();
  });
}

main();
```
Run it:
```bash
cd backend && node scripts/getDropboxRefreshToken.js <YOUR_APP_KEY> <YOUR_APP_SECRET>
```
Follow the printed URL, approve, paste the code. Copy the printed refresh token into `backend/.env` as `DROPBOX_REFRESH_TOKEN=...`, and also add `DROPBOX_APP_KEY=...` and `DROPBOX_APP_SECRET=...`.

- [ ] **Step 2: Create `backend/utils/dropboxService.js`**

```javascript
const { Dropbox } = require('dropbox');

function getClient() {
  return new Dropbox({
    clientId: process.env.DROPBOX_APP_KEY,
    clientSecret: process.env.DROPBOX_APP_SECRET,
    refreshToken: process.env.DROPBOX_REFRESH_TOKEN
  });
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function uploadImageToDropbox(buffer, originalFilename) {
  const dbx = getClient();
  const path = `/portfolio-uploads/${Date.now()}-${sanitizeFilename(originalFilename)}`;

  await dbx.filesUpload({ path, contents: buffer, mode: { '.tag': 'add' } });

  let sharedLink;
  try {
    const created = await dbx.sharingCreateSharedLinkWithSettings({ path });
    sharedLink = created.result.url;
  } catch (error) {
    if (error?.error?.error_summary?.startsWith('shared_link_already_exists')) {
      const existing = await dbx.sharingListSharedLinks({ path, direct_only: true });
      sharedLink = existing.result.links[0].url;
    } else {
      throw error;
    }
  }

  return sharedLink.replace(/\?dl=0$/, '?raw=1').replace(/&dl=0$/, '&raw=1');
}

module.exports = { uploadImageToDropbox };
```

- [ ] **Step 3: Create `backend/routes/upload.js`**

```javascript
const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const { uploadImageToDropbox } = require('../utils/dropboxService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    cb(null, true);
  }
});

router.post('/', auth, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    try {
      const imageUrl = await uploadImageToDropbox(req.file.buffer, req.file.originalname);
      res.json({ imageUrl });
    } catch (error) {
      console.error('Dropbox upload failed:', error);
      res.status(502).json({ message: 'Failed to upload image to Dropbox' });
    }
  });
});

module.exports = router;
```

- [ ] **Step 4: Mount the upload route in `backend/server.js`**

Add alongside the other route imports:
```javascript
const uploadRoutes = require('./routes/upload');
```
And mount:
```javascript
app.use('/api/upload', uploadRoutes);
```

- [ ] **Step 5: Verify end-to-end**

```bash
node backend/server.js
```
```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"<your-email>\",\"password\":\"<your-password>\"}" | node -e "process.stdin.on('data', d => console.log(JSON.parse(d).token))")
curl -s -X POST http://localhost:5000/api/upload -H "Authorization: Bearer $TOKEN" -F "image=@<path-to-any-local-image.jpg>"
```
Expected: `{"imageUrl":"https://www.dropbox.com/...?raw=1"}`. Open that URL in a browser and confirm the image renders. Check your Dropbox account's `/portfolio-uploads` folder to confirm the file landed there.

- [ ] **Step 6: Commit**

```bash
git add backend/utils/dropboxService.js backend/routes/upload.js backend/scripts/getDropboxRefreshToken.js backend/server.js
git commit -m "Add Dropbox-backed image upload endpoint"
```

---

## Task 7: Frontend admin auth (login page, protected route, API client)

**Files:**
- Create: `frontend/src/utils/authClient.js`
- Create: `frontend/src/components/ProtectedRoute.js`
- Create: `frontend/src/pages/AdminLoginPage.js`
- Create: `frontend/src/styles/AdminPage.css`
- Modify: `frontend/src/App.js`

**Interfaces:**
- Produces: `getToken()`, `setToken(token)`, `clearToken()`, `isAuthenticated()`, `authFetch(path, options)` from `authClient.js` — Tasks 8 and 9 use `authFetch` for all admin API calls. `ProtectedRoute` — wraps `children`, redirects to `/admin/login` if `isAuthenticated()` is false.

- [ ] **Step 1: Create `frontend/src/utils/authClient.js`**

```javascript
import { API_BASE_URL } from '../config/api';

const TOKEN_KEY = 'admin_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export async function authFetch(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : ''
    }
  });
  if (response.status === 401) {
    clearToken();
  }
  return response;
}
```

- [ ] **Step 2: Create `frontend/src/components/ProtectedRoute.js`**

```javascript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/authClient';

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

export default ProtectedRoute;
```

- [ ] **Step 3: Create `frontend/src/pages/AdminLoginPage.js`**

```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { setToken } from '../utils/authClient';
import '../styles/AdminPage.css';

function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      setToken(data.token);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login-page">
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <h1>Admin Login</h1>
        {error && <p className="admin-error">{error}</p>}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </div>
  );
}

export default AdminLoginPage;
```

- [ ] **Step 4: Create a minimal `frontend/src/styles/AdminPage.css`**

```css
.admin-login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #0f0f0f;
}

.admin-login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
  background: #1a1a1a;
  border-radius: 8px;
  width: 320px;
}

.admin-login-form label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: #eaeaea;
  font-size: 0.9rem;
}

.admin-login-form input {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #333;
  background: #111;
  color: #fff;
}

.admin-login-form button {
  padding: 0.6rem;
  border-radius: 4px;
  border: none;
  background: #4f9dff;
  color: #fff;
  cursor: pointer;
}

.admin-error {
  color: #ff6b6b;
  font-size: 0.85rem;
}

.admin-page {
  min-height: 100vh;
  background: #0f0f0f;
  color: #eaeaea;
  padding: 2rem;
}

.admin-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.admin-tabs button {
  padding: 0.5rem 1rem;
  background: #1a1a1a;
  border: 1px solid #333;
  color: #eaeaea;
  cursor: pointer;
  border-radius: 4px;
}

.admin-tabs button.active {
  background: #4f9dff;
  color: #fff;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 2rem;
}

.admin-table th, .admin-table td {
  border: 1px solid #333;
  padding: 0.5rem;
  text-align: left;
  font-size: 0.9rem;
}

.admin-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 480px;
}

.admin-form input, .admin-form textarea {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #333;
  background: #111;
  color: #fff;
}
```

- [ ] **Step 5: Wire `/admin/login` and `/admin` into `frontend/src/App.js`**

Add imports at the top:
```javascript
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';
```
Add routes inside `<Routes>` (after the existing `/contact` route):
```javascript
<Route path="/admin/login" element={<AdminLoginPage />} />
<Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
```
`AdminPage` doesn't exist yet — Task 8 creates it. This step will not compile until Task 8's file exists; that's expected, they run back-to-back.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/utils/authClient.js frontend/src/components/ProtectedRoute.js frontend/src/pages/AdminLoginPage.js frontend/src/styles/AdminPage.css frontend/src/App.js
git commit -m "Add admin login page and protected /admin route"
```

---

## Task 8: Admin CMS — Projects tab

**Files:**
- Create: `frontend/src/pages/AdminPage.js`
- Create: `frontend/src/components/admin/ProjectsAdmin.js`
- Create: `frontend/src/components/admin/ImageUploadField.js`

**Interfaces:**
- Consumes: `authFetch` from `frontend/src/utils/authClient.js` (Task 7).
- Produces: `AdminPage` (default export) — tab shell reused by Task 9's `CertificationsAdmin`. `ImageUploadField` — props `{ value, onChange }`, uploads via `POST /api/upload`, calls `onChange(imageUrl)` on success; reused by Task 9.

- [ ] **Step 1: Create `frontend/src/components/admin/ImageUploadField.js`**

```javascript
import React, { useState } from 'react';
import { authFetch } from '../../utils/authClient';

function ImageUploadField({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await authFetch('/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }
      onChange(data.imageUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-upload-field">
      <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} />
      {uploading && <p>Uploading...</p>}
      {error && <p className="admin-error">{error}</p>}
      {value && <img src={value} alt="preview" style={{ maxWidth: '150px', display: 'block', marginTop: '0.5rem' }} />}
    </div>
  );
}

export default ImageUploadField;
```

- [ ] **Step 2: Create `frontend/src/components/admin/ProjectsAdmin.js`**

```javascript
import React, { useEffect, useState } from 'react';
import { authFetch } from '../../utils/authClient';
import ImageUploadField from './ImageUploadField';

const emptyForm = {
  title: '', description: '', technologies: '', imageUrl: '', githubUrl: '', liveUrl: '', featured: false
};

function ProjectsAdmin() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    const response = await authFetch('/projects');
    const data = await response.json();
    setProjects(Array.isArray(data) ? data : []);
  };

  useEffect(() => { load(); }, []);

  const startEdit = (project) => {
    setEditingId(project._id);
    setForm({
      title: project.title || '',
      description: project.description || '',
      technologies: (project.technologies || []).join(', '),
      imageUrl: project.imageUrl || '',
      githubUrl: project.githubUrl || '',
      liveUrl: project.liveUrl || '',
      featured: Boolean(project.featured)
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const payload = {
      title: form.title,
      description: form.description,
      technologies: form.technologies.split(',').map((t) => t.trim()).filter(Boolean),
      imageUrl: form.imageUrl,
      githubUrl: form.githubUrl || undefined,
      liveUrl: form.liveUrl || undefined,
      featured: form.featured
    };
    const path = editingId ? `/projects/${editingId}` : '/projects';
    const method = editingId ? 'PUT' : 'POST';
    const response = await authFetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.message || 'Save failed');
      return;
    }
    resetForm();
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    await authFetch(`/projects/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <table className="admin-table">
        <thead>
          <tr><th>Title</th><th>Featured</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p._id}>
              <td>{p.title}</td>
              <td>{p.featured ? 'Yes' : 'No'}</td>
              <td>
                <button onClick={() => startEdit(p)}>Edit</button>{' '}
                <button onClick={() => handleDelete(p._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form className="admin-form" onSubmit={handleSubmit}>
        <h3>{editingId ? 'Edit project' : 'Add new project'}</h3>
        {error && <p className="admin-error">{error}</p>}
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        <input placeholder="Technologies (comma-separated)" value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} required />
        <ImageUploadField value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
        <input placeholder="GitHub URL" value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} />
        <input placeholder="Live URL" value={form.liveUrl} onChange={(e) => setForm({ ...form, liveUrl: e.target.value })} />
        <label>
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured
        </label>
        <button type="submit">{editingId ? 'Save changes' : 'Add project'}</button>
        {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
      </form>
    </div>
  );
}

export default ProjectsAdmin;
```

- [ ] **Step 3: Create `frontend/src/pages/AdminPage.js`**

```javascript
import React, { useState } from 'react';
import { clearToken } from '../utils/authClient';
import { useNavigate } from 'react-router-dom';
import ProjectsAdmin from '../components/admin/ProjectsAdmin';
import '../styles/AdminPage.css';

function AdminPage() {
  const [tab, setTab] = useState('projects');
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate('/admin/login');
  };

  return (
    <div className="admin-page">
      <div className="admin-tabs">
        <button className={tab === 'projects' ? 'active' : ''} onClick={() => setTab('projects')}>Projects</button>
        <button className={tab === 'certifications' ? 'active' : ''} onClick={() => setTab('certifications')}>Certifications</button>
        <button onClick={handleLogout} style={{ marginLeft: 'auto' }}>Log out</button>
      </div>
      {tab === 'projects' && <ProjectsAdmin />}
    </div>
  );
}

export default AdminPage;
```

- [ ] **Step 4: Verify in the browser**

Start both servers (`node backend/server.js`, and `npm start` in `frontend/`). Navigate to `http://localhost:3000/admin/login`, log in with your admin credentials, confirm you land on `/admin` with the Projects tab showing your existing projects. Add a test project with an uploaded image, confirm it appears in the table and (after reload) on the public `/projects` page. Edit it, then delete it, confirming the table updates each time.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/AdminPage.js frontend/src/components/admin/ProjectsAdmin.js frontend/src/components/admin/ImageUploadField.js
git commit -m "Add admin Projects tab with create/edit/delete and image upload"
```

---

## Task 9: Admin CMS — Certifications tab

**Files:**
- Create: `frontend/src/components/admin/CertificationsAdmin.js`
- Modify: `frontend/src/pages/AdminPage.js`

**Interfaces:**
- Consumes: `authFetch` (Task 7), `ImageUploadField` (Task 8).

- [ ] **Step 1: Create `frontend/src/components/admin/CertificationsAdmin.js`**

```javascript
import React, { useEffect, useState } from 'react';
import { authFetch } from '../../utils/authClient';
import ImageUploadField from './ImageUploadField';

const emptyForm = {
  title: '', organization: '', issueDate: '', expiryDate: '', credentialID: '',
  credentialURL: '', description: '', skills: '', imageUrl: '', featured: false
};

function CertificationsAdmin() {
  const [certifications, setCertifications] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    const response = await authFetch('/certifications');
    const data = await response.json();
    setCertifications(Array.isArray(data) ? data : []);
  };

  useEffect(() => { load(); }, []);

  const startEdit = (cert) => {
    setEditingId(cert._id);
    setForm({
      title: cert.title || '',
      organization: cert.organization || '',
      issueDate: cert.issueDate ? cert.issueDate.substring(0, 10) : '',
      expiryDate: cert.expiryDate ? cert.expiryDate.substring(0, 10) : '',
      credentialID: cert.credentialID || '',
      credentialURL: cert.credentialURL || '',
      description: cert.description || '',
      skills: (cert.skills || []).join(', '),
      imageUrl: cert.imageUrl || '',
      featured: Boolean(cert.featured)
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const payload = {
      title: form.title,
      organization: form.organization,
      issueDate: form.issueDate,
      expiryDate: form.expiryDate || undefined,
      credentialID: form.credentialID || undefined,
      credentialURL: form.credentialURL || undefined,
      description: form.description || undefined,
      skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      imageUrl: form.imageUrl || undefined,
      featured: form.featured
    };
    const path = editingId ? `/certifications/${editingId}` : '/certifications';
    const method = editingId ? 'PUT' : 'POST';
    const response = await authFetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.message || 'Save failed');
      return;
    }
    resetForm();
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this certification?')) return;
    await authFetch(`/certifications/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <table className="admin-table">
        <thead>
          <tr><th>Title</th><th>Organization</th><th>Featured</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {certifications.map((c) => (
            <tr key={c._id}>
              <td>{c.title}</td>
              <td>{c.organization}</td>
              <td>{c.featured ? 'Yes' : 'No'}</td>
              <td>
                <button onClick={() => startEdit(c)}>Edit</button>{' '}
                <button onClick={() => handleDelete(c._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form className="admin-form" onSubmit={handleSubmit}>
        <h3>{editingId ? 'Edit certification' : 'Add new certification'}</h3>
        {error && <p className="admin-error">{error}</p>}
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input placeholder="Organization" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} required />
        <label>
          Issue date
          <input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} required />
        </label>
        <label>
          Expiry date (optional)
          <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
        </label>
        <input placeholder="Credential ID" value={form.credentialID} onChange={(e) => setForm({ ...form, credentialID: e.target.value })} />
        <input placeholder="Credential URL" value={form.credentialURL} onChange={(e) => setForm({ ...form, credentialURL: e.target.value })} />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input placeholder="Skills (comma-separated)" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
        <ImageUploadField value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
        <label>
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured
        </label>
        <button type="submit">{editingId ? 'Save changes' : 'Add certification'}</button>
        {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
      </form>
    </div>
  );
}

export default CertificationsAdmin;
```

- [ ] **Step 2: Wire the tab into `frontend/src/pages/AdminPage.js`**

Add the import:
```javascript
import CertificationsAdmin from '../components/admin/CertificationsAdmin';
```
Add after the `{tab === 'projects' && <ProjectsAdmin />}` line:
```javascript
{tab === 'certifications' && <CertificationsAdmin />}
```

- [ ] **Step 3: Verify in the browser**

On `/admin`, switch to the Certifications tab, add a test certification with an uploaded image, confirm it appears in the table and on the public `/certifications` page after reload. Edit and delete it, confirming the table updates.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/admin/CertificationsAdmin.js frontend/src/pages/AdminPage.js
git commit -m "Add admin Certifications tab with create/edit/delete and image upload"
```

---

## Task 10: Full end-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Confirm public routes still work unauthenticated**

With both servers running, load `http://localhost:3000/projects` and `http://localhost:3000/certifications` in a browser with no admin token set (or in a private/incognito window) — both should render existing data normally (GET routes remain public).

- [ ] **Step 2: Confirm write routes reject requests with no token**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5000/api/projects -H "Content-Type: application/json" -d "{}"
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5000/api/certifications -H "Content-Type: application/json" -d "{}"
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5000/api/upload
```
Expected: `401` for all three.

- [ ] **Step 3: Confirm `/admin` redirects when logged out**

In a private/incognito browser window, navigate directly to `http://localhost:3000/admin` — expect an immediate redirect to `/admin/login`.

- [ ] **Step 4: Full admin flow**

Log in at `/admin/login`, add one real project and one real certification (with uploaded images) through the UI, confirm both show up correctly on the public `/projects` and `/certifications` pages, then edit and delete each to confirm the full CRUD cycle works.

- [ ] **Step 5: Confirm registration is truly gone and rate limiting works**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5000/api/auth/register
```
Expected: `404`.
Send 11 rapid wrong-password login attempts to `/api/auth/login` — expect the 11th to return `429`.

No commit for this task — it's verification of Tasks 1-9's combined behavior.

---

## Self-Review Notes

- **Spec coverage:** JWT fail-fast (Task 1), remove registration + admin seed (Task 2), certifications auth (Task 4), projects CRUD (Task 4), CORS/logging/helmet/rate-limit (Task 5), input validation (Task 3, used in Task 4), Dropbox upload (Task 6), admin login + protected route (Task 7), admin CRUD UI for both entities (Tasks 8-9) — all covered.
- **Placeholder scan:** no TBD/TODO markers; every step has literal code or an exact command.
- **Type consistency:** `authFetch(path, options)` signature matches its Task 7 definition everywhere it's called in Tasks 8-9; `uploadImageToDropbox(buffer, originalFilename)` matches between Task 6's definition and its one call site in `routes/upload.js`; `validateProject`/`validateCertification` signatures match between Task 3's definition and Task 4's usage.

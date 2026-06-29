# Learnable

Claude-designed credentials in anything. Tell it what you want to master and why, get a
personalized curriculum, a capstone, a verifiable certificate, alumni access, and CV prep — for $35.

This repo is a **self-contained full-stack app**: a Node/Express backend (API + Claude proxy +
auth + payments + certificate verification) that also serves the frontend. 

---

## What's inside

```
learnable/
├─ server.js          API + serves the frontend
├─ db.js              SQLite schema & connection
├─ public/index.html  Frontend (React via CDN — no build step)
├─ package.json
├─ .env.example       Copy to .env and fill in
└─ .gitignore
```

**Key design choice:** the Anthropic API key lives **only on the server**. The browser never sees
it — it calls your `/api/...` endpoints, and the server calls Claude. That's the whole reason to
have a backend.

It runs even **without any keys**: program/CV generation falls back to sample content, and
enrollment simulates a successful payment so you can walk the entire flow locally.

---

## Run it locally

Requires Node 18+.

```bash
cd learnable
cp .env.example .env        # then open .env and add your keys (optional to start)
npm install
npm start
```

Open http://localhost:8080. Generate a program, sign up, "enroll" (simulated in dev), and
you'll get a certificate with a verify link.

To make it real, add to `.env`:
- `ANTHROPIC_API_KEY` — from https://console.anthropic.com/settings/keys (real curricula)
- `PAYSTACK_SECRET_KEY` + `PAYSTACK_CURRENCY` — from https://dashboard.paystack.com (real $35 checkout)
- `JWT_SECRET` — any long random string (`openssl rand -hex 32`)
- `APP_URL` — your public URL once deployed

---

## Deploy (no Replit)

### Render (easiest full-stack)
1. Push this folder to a GitHub repo.
2. On Render → **New → Web Service** → connect the repo.
3. Settings: **Build Command** `npm install`, **Start Command** `npm start`.
4. Add your env vars (Environment tab): `ANTHROPIC_API_KEY`, `JWT_SECRET`, `PAYSTACK_SECRET_KEY`,
   `PAYSTACK_CURRENCY`, `PRICE`, `APP_URL` (set to the Render URL), `NODE_ENV=production`.
5. **Persistence:** the SQLite file is wiped on each deploy unless you attach a **Persistent Disk**
   (e.g. mount at `/var/data`) and set `DB_PATH=/var/data/learnable.db`. For real scale, move to
   Postgres (see below).

### Railway / Fly.io / DigitalOcean App Platform
Same idea: connect the repo, set start command `npm start`, add the env vars, attach a volume for
the database. All detect Node automatically.

### Cloudflare
Cloudflare Workers don't run `better-sqlite3` (native module). If you want Cloudflare, swap the data
layer for **Cloudflare D1** and deploy the API as a Worker — happy to provide that variant.

---

## Paystack webhook (recommended)
In the Paystack dashboard, set your webhook URL to `https://YOUR_APP/api/payments/webhook`. The app
verifies the signature and issues the certificate even if the user closes the tab before redirect.

---

## Scaling up (Postgres)
SQLite is perfect to start. When you outgrow it, replace `db.js` with a Postgres pool (`pg`) and set
`DATABASE_URL` — the rest of the app is written against simple queries that port cleanly. Render,
Railway, and Supabase all offer managed Postgres.

---

## API quick reference
- `POST /api/auth/signup` · `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me`
- `POST /api/programs` `{goal, why}` → generate (Claude) + save
- `GET /api/programs` · `GET /api/programs/:id`
- `POST /api/programs/:id/cv` → CV bullets (Claude)
- `POST /api/programs/:id/enroll` → Paystack checkout URL (or dev certificate)
- `GET /api/payments/verify?reference=...` → confirm payment + issue certificate
- `POST /api/payments/webhook` → Paystack webhook
- `GET /api/certificates` → the signed-in user's credentials
- `GET /api/verify/:credId` → **public** credential verification

---

## Honest note
The landing copy ships with placeholder stats and testimonials. Replace them with real numbers
before going live — fake social proof is the fastest way to lose trust.

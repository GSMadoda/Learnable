# Learnable — Learn it. Prove it.

A Claude-powered credentialing platform. Someone enters a skill they want to master and why, pays
a one-time **$35**, and gets a personalized interactive course — lessons with readings, video links,
activities and quizzes, an AI tutor, a study-cadence rule, a capstone, a verifiable certificate, a
member profile, and an alumni network.

This is a **self-contained full-stack app**: a Node/Express backend (API + Claude proxy + auth +
payments + certificates) that also serves the frontend. No build step, no Replit.

---

## What's inside

```
learnable/
├─ server.js          API + serves the frontend
├─ db.js              Database schema & connection (Node's built-in SQLite)
├─ public/
│  └─ index.html      Frontend (React via CDN + in-browser Babel — no build step)
├─ package.json
├─ .node-version      Pins Node 22 (required)
├─ .env.example       Copy to .env and fill in
├─ .gitignore
└─ README.md
```

## Requirements

- **Node 22.5+** — the database uses Node's built-in `node:sqlite`, so there is no native module to
  compile and deploys can't fail on a build error. `.node-version` pins this; on Render also set
  `NODE_VERSION=22`.

## Run locally

```
npm install
cp .env.example .env     # then fill in values
npm start                # http://localhost:8080
```

With no keys set, the app still runs in **dev mode**: sample course content instead of Claude,
simulated payment (course unlocks instantly), and magic-link/reset links returned in the API
response instead of emailed — so you can click through the whole product for free.

## Features

- **Auth**: email + password, **Google sign-in**, **magic link** (passwordless), **forgot/reset
  password**. Sessions via signed JWT cookie.
- **Free tier (logged in)**: unlimited course previews, member profile (photo, education, LinkedIn),
  browse the alumni network, saved programs.
- **Paid ($35/course)**: full interactive course — lessons (reading + video link + activity + quiz),
  an **AI tutor**, a **30-min / 2-week study rule**, a **capstone**, and a **verifiable certificate**
  with a public verification page.
- **Alumni network**: credentialed, opt-in, searchable by skill.

## Environment variables

See `.env.example`:

- `ANTHROPIC_API_KEY`, `CLAUDE_MODEL` — real curricula, lessons, AI tutor (else sample content)
- `JWT_SECRET` — signs login sessions; set once, never change
- `APP_URL` — public URL, used in links & payment redirects
- `DODO_PAYMENTS_API_KEY`, `DODO_PRODUCT_ID`, `DODO_PAYMENTS_WEBHOOK_SECRET`, `DODO_MODE` — payments (else simulated)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL` — email for magic links + resets (Spacemail)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google sign-in (button hidden until set)
- `STUDY_MINUTES_REQUIRED`, `STUDY_PERIOD_DAYS` — study rule (default 30 min / 14 days)
- `DB_PATH` — point at a persistent disk in production so data survives redeploys

## Deploy (Render)

1. Push this repo to GitHub.
2. New Web Service → connect the repo. Build `npm install`, start `npm start`.
3. Set `NODE_VERSION=22` and the env vars above.
4. For data that survives redeploys, add a Persistent Disk and set `DB_PATH=/var/data/learnable.db`.

See `LEARNABLE_LAUNCH_CHECKLIST.md` for the full ordered go-live checklist.

## Notes

- The certificate is a **Certificate of Mastery / Completion**, not an accredited qualification.
- Brand: symbol = an L rising into a checkmark on a blue tile; palette Ink Navy #0B1F3A /
  Learnable Blue #2563EB / Sky #60A5FA / Credential Gold #F4B740; fonts Plus Jakarta Sans + Inter +
  Roboto Mono; tagline **"Learn it. Prove it."**

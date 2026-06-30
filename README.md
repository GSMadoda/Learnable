# Learnable — Learn it. Prove it.

A Claude-powered credentialing platform. Someone enters a skill they want to master and why, pays
a one-time **$35**, and gets a personalized interactive course — lessons with readings, video links,
activities and quizzes, an AI tutor, a study-cadence rule, a capstone, a verifiable certificate, a
member profile, and an alumni network.

This is a **self-contained full-stack app**: a Node/Express backend (API + Claude proxy + auth +
payments + certificates) that also serves the frontend. Data is stored in **MongoDB Atlas**.

---

## What's inside

```
learnable/
├─ server.js          API + serves the frontend
├─ store.js           MongoDB data layer (collections, integer-ID counter, indexes)
├─ mongo_mock.js      In-memory MongoDB for local testing only (MONGO_MEMORY=1); never used in prod
├─ public/
│  └─ index.html      Frontend (React via CDN + in-browser Babel — no build step)
├─ package.json
├─ .node-version
├─ .env.example       Copy to .env and fill in
├─ .gitignore
└─ README.md
```

## Requirements

- **Node 18.18+** and a **MongoDB** connection string (MongoDB Atlas free tier is fine).

## Run locally

```
npm install
cp .env.example .env     # then fill in MONGODB_URI (and others)
npm start                # http://localhost:8080
```

To click through the whole product locally **without** a database or any keys, run in memory:

```
MONGO_MEMORY=1 npm start
```

With no keys set, the app runs in **dev mode**: sample course content instead of Claude, simulated
payment (course unlocks instantly), and magic-link/reset links returned in the API response instead
of emailed.

## Features

- **Auth**: email + password, **Google sign-in**, **magic link** (passwordless), **forgot/reset
  password**. Sessions via signed JWT cookie.
- **Free tier (logged in)**: unlimited course previews, member profile (photo, education, LinkedIn),
  browse the alumni network, saved programs.
- **Paid ($35/course)**: full interactive course — lessons (reading + video link + activity + quiz),
  an **AI tutor**, a **30-min / 2-week study rule**, a **capstone**, and a **verifiable certificate**
  with a public verification page.
- **Alumni network**: credentialed, opt-in, searchable by skill.

## Data (MongoDB)

`store.js` connects with the official `mongodb` driver and uses these collections: `users`,
`programs`, `enrollments`, `progress`, `lesson_content`, `certificates`, and `counters`. IDs stay as
sequential integers via the `counters` collection, so nothing else in the app changes. Indexes are
created automatically on first connect. Because the data lives in Atlas (not on the server's disk),
**redeploys never wipe your accounts or certificates.**

## Environment variables

See `.env.example`:

- `MONGODB_URI` (**required**) — your MongoDB Atlas connection string; `MONGODB_DB` optional (default `learnable`)
- `ANTHROPIC_API_KEY`, `CLAUDE_MODEL` — real curricula, lessons, AI tutor (else sample content)
- `JWT_SECRET` — signs login sessions; set once, never change
- `APP_URL` — public URL, used in links & payment redirects
- `DODO_PAYMENTS_API_KEY`, `DODO_PRODUCT_ID`, `DODO_PAYMENTS_WEBHOOK_SECRET`, `DODO_MODE` — payments (else simulated)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL` — email for magic links + resets (Spacemail)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google sign-in (button hidden until set)
- `STUDY_MINUTES_REQUIRED`, `STUDY_PERIOD_DAYS` — study rule (default 30 min / 14 days)

## Deploy

1. Push this repo to GitHub.
2. Create a MongoDB Atlas free cluster and copy its connection string.
3. On your host (e.g. Render): New Web Service → connect the repo. Build `npm install`, start `npm start`.
4. Set `MONGODB_URI` and the other env vars above.

See `LEARNABLE_LAUNCH_CHECKLIST.md` for the full ordered go-live checklist.

## Notes

- The certificate is a **Certificate of Mastery / Completion**, not an accredited qualification.
- Brand: symbol = an L rising into a checkmark on a blue tile; palette Ink Navy #0B1F3A /
  Learnable Blue #2563EB / Sky #60A5FA / Credential Gold #F4B740; fonts Plus Jakarta Sans + Inter +
  Roboto Mono; tagline **"Learn it. Prove it."**

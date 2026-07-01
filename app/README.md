# Learnable — web app (marketing + product)

The **Learnable** front-end: a mobile-friendly React SPA that pairs the marketing homepage
(design option `1c`, product-led) with the full signed-in product, wired to the existing
Express/MongoDB/Dodo backend in [`../server.js`](../server.js).

**Learn it. Prove it.** — a focused-learning credentialing platform: locked, AI-tutored study
sessions that end in a verifiable credential.

## Stack

- **React 18** + **Vite 6** + **react-router-dom 6**
- **Tailwind CSS v4** (CSS-first `@theme`, no `tailwind.config.js`)
- **lucide-react** for icons
- Google Fonts: Plus Jakarta Sans (display), Inter (body/UI), Roboto Mono (labels)

The Learnable design tokens (colors, type families, radii, shadows, the two hero keyframes)
are mapped into the Tailwind theme in [`src/index.css`](src/index.css), so everything styles
against real tokens (`bg-ink-navy`, `text-gold`, `rounded-btn`, `shadow-mock`…).

## How it plugs into the backend (no backend changes)

`../server.js` serves `../public` statically and falls back to `../public/index.html` for
client routes. So this app **builds straight into `../public`** (`build.outDir` in
`vite.config.js`) — `npm run build` produces exactly the SPA the server already serves. No
route, env var, or API endpoint in the backend changes.

- **API** is consumed through [`src/api.js`](src/api.js) — thin `fetch` wrappers over the
  existing `/api/*` endpoints, always `credentials: 'include'` (auth is the server's httpOnly
  `token` cookie; no token is handled in JS).
- **Feature flags** come from `GET /api/config` (Google + email sign-in are optional).
- **Redirect flows** the backend uses (it redirects back to `/` with a param) are handled on
  load in `src/App.jsx`: `?magic=`, `?reset=`, `?ref=` (Dodo payment return), `?autherror=`.
- **Pricing** reflects the backend's real model — a one-time charge per program (`PRICE`,
  default `$35`), which unlocks that program and its credential. There is no subscription/trial
  in the backend, so the marketing + checkout copy match the one-off model. The display figure
  lives in [`src/config.js`](src/config.js); keep it in sync with the `PRICE` env var.

## Getting started

```bash
npm install
npm run dev      # Vite dev server (proxies /api → http://localhost:8080)
npm run build    # production build → ../public (served by ../server.js)
npm run preview  # preview the production build
```

For a full local run, start the backend too (from the repo root):

```bash
MONGO_MEMORY=1 node server.js   # in-memory Mongo, dev-mode payments, sample AI fallbacks
```

## Structure

```
src/
  main.jsx                 # BrowserRouter + Auth/UI providers
  App.jsx                  # routes + redirect-flow handling + route guards
  api.js                   # fetch client for every /api/* endpoint
  state.jsx                # auth user, /api/config flags, toasts, auth-modal control
  config.js                # pricing display copy (mirrors server PRICE)
  ui.jsx                   # shared primitives (Button, Field, Input, Modal, Spinner…)
  index.css                # Tailwind + Learnable design tokens (@theme) + keyframes
  data/curricula.js        # static demo curricula behind the landing demo
  components/
    Brand.jsx              # logo mark, wordmark, gold seal SVGs
    Nav.jsx / AppHeader.jsx# marketing nav / signed-in app header
    AuthModal.jsx          # signup / login / Google / magic-link / forgot / reset
    Hero, Features, CurriculumDemo, FocusBand, Credential, Pricing, ClosingCTA, Footer
  pages/
    Landing.jsx            # marketing homepage composition
    Dashboard.jsx          # programs + credentials + new-plan generator
    ProgramView.jsx        # review a generated program + enroll (Dodo checkout)
    Course.jsx             # course player: lessons, quiz, study heartbeat, AI tutor, capstone
    Verify.jsx             # public credential verification page
    Alumni.jsx             # alumni directory (skill search)
    Profile.jsx            # profile editor (name, avatar, headline, education, LinkedIn)
```

## Routes

| Route | Access | Backing endpoints |
| --- | --- | --- |
| `/` | public | marketing; CTAs open auth / generate a plan |
| `/program/:id` | public | `GET /api/programs/:id`, `POST /api/programs/:id/enroll` |
| `/verify/:credId` | public | `GET /api/verify/:credId` |
| `/app` | auth | `GET /api/programs`, `GET /api/certificates`, `POST /api/programs` |
| `/course/:id` | auth | `GET /api/courses/:id/state` + lesson/progress/heartbeat/tutor/capstone |
| `/alumni` | auth | `GET /api/alumni` |
| `/profile` | auth | `PUT /api/profile` |

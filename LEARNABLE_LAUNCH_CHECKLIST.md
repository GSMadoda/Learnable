# Learnable — Launch Checklist

Work straight down. Each phase ends with **✅ Check it worked** so you never move on with something broken.
Legend: **[MUST]** = required before taking real customers · **[SOON]** = needed for a real launch, can be same day · **[OPTIONAL]** = nice to have.

---

## Phase 0 — Get the latest code on GitHub  **[MUST]**

- [ ] Upload (overwrite, don't delete) these files to your repo:
  - `server.js`
  - `store.js`
  - `mongo_mock.js`
  - `package.json`
  - `.node-version`
  - `public/index.html`  *(go INTO the `public` folder first, then upload)*
- [ ] If an old **`db.js`** exists in the repo from before, **delete it** (it's the old SQLite file, no longer used).
- [ ] Never upload: `.env`, `node_modules`, or any `.db` file.

**✅ Check:** Your repo's main page shows `server.js`, `store.js`, `package.json` at the top level, and a `public` folder containing `index.html` — and no `db.js`.

---

## Phase 1 — MongoDB Atlas (where your data lives)  **[MUST]**

Your app now stores everything in MongoDB Atlas, so **redeploys never wipe accounts or certificates** — and the free tier covers launch (your Student Pack also gives $50 of credit on top).

In the **MongoDB Atlas** dashboard:
- [ ] At **mongodb.com/students**, signed in with GitHub, **claim** your $50 credit code (verified ✓).
- [ ] At **mongodb.com/cloud/atlas**, create a **free M0 cluster** — pick a region near South Africa (Frankfurt or Ireland).
- [ ] (Optional) Apply the promo code under **Billing → Credits** (within 90 days).
- [ ] **Database Access** → add a database user (username + password — save them).
- [ ] **Network Access** → Add IP Address → **Allow access from anywhere** (`0.0.0.0/0`), since your host's IP isn't fixed.
- [ ] **Connect → Drivers → Node.js** → copy the **connection string**. It looks like:
      `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
      (put your real password in place of `PASSWORD`).

Then on your host (Render) → **Environment**, set:
- [ ] `MONGODB_URI` = that connection string
- [ ] `JWT_SECRET` = a long random string (30+ chars). Set once, never change.
- [ ] `APP_URL` = `https://learnable-p56a.onrender.com`   *(change later if you move to your own domain)*
- [ ] `NODE_ENV` = `production`

**✅ Check:** Site loads at your Render URL and you can sign up. Then trigger a redeploy (Manual Deploy → Deploy latest commit) and confirm you can **still log in afterwards** — that proves your data now lives in Atlas, not on the server. (In Atlas → **Browse Collections**, you'll see a `learnable` database with a `users` collection.)

---

## Phase 2 — Claude API (so courses actually generate)  **[MUST]**

- [ ] Go to **console.anthropic.com** → sign in (separate from any Claude.ai subscription).
- [ ] Verify your phone (real mobile, not VoIP) and **claim** the free starter credit, OR add a card and buy ~$5 of credit.
- [ ] In Render → Environment, set:
  - `ANTHROPIC_API_KEY` = your `sk-ant-...` key
  - `CLAUDE_MODEL` = `claude-sonnet-4-6`

**✅ Check:** On the live site, design a course. The modules/lessons should be specific and real (not the generic "Module 1 / Lesson A" placeholders). If you see placeholders, the key isn't set or has no credit — check Render → **Logs** for a line starting `generate program failed:`.

---

## Phase 3 — Email for magic links & password resets  **[MUST]**

### 3a — Connect your Spaceship mailbox
In Render → Environment, set:

- [ ] `SMTP_HOST` = `mail.spacemail.com`
- [ ] `SMTP_PORT` = `465`
- [ ] `SMTP_USER` = `support@getlearnable.org`
- [ ] `SMTP_PASS` = the password for that mailbox
- [ ] `FROM_EMAIL` = `Learnable <support@getlearnable.org>`

### 3b — Make the email actually land (DNS) — this is the part people forget
Without these, your emails bounce or go to spam. In **Cloudflare → DNS → Records** for `getlearnable.org`, add the records **exactly as Spaceship shows them** (Spacemail panel → your mailbox → "IMAP/SMTP/POP3" / DNS records). You will add roughly:

- [ ] **MX** record → `mail.spacemail.com` (priority 10)  *(needed to receive mail)*
- [ ] **SPF** (TXT on `@`) → the value Spaceship gives, typically like `v=spf1 include:spacemail.com ~all`
- [ ] **DKIM** (TXT) → the **unique** selector + value Spaceship generates for your mailbox (copy it exactly — don't invent it)
- [ ] **DMARC** (TXT on `_dmarc`) → `v=DMARC1; p=none; rua=mailto:support@getlearnable.org`
- [ ] Set all of these to **DNS only** (grey cloud) in Cloudflare. TTL: Auto.

**✅ Check:** On the live site, use "Email me a magic link" with an address you control. The email should arrive within a minute (check spam too). For a deliverability score, send a test to the address shown at **mail-tester.com** and aim for 8+/10.

---

## Phase 4 — Payments (Dodo)  **[MUST]**

> Dodo is a merchant-of-record and may need to **approve your business** — start this early so it isn't a launch-day blocker.

### 4a — In the Dodo dashboard (Test mode first)
- [ ] Create account; complete business onboarding/approval.
- [ ] **Products** → create a **one-time** product "Learnable Credential" at **$35** → copy its **Product ID**.
- [ ] **Developer → API Keys** → generate a key (starts `test_`) → copy it.
- [ ] **Developer → Webhooks** → Add endpoint → URL `https://learnable-p56a.onrender.com/api/payments/webhook` → select the **payment succeeded** event → copy the **Secret** (`whsec_...`).

### 4b — In Render → Environment
- [ ] `DODO_PAYMENTS_API_KEY` = your `test_` key
- [ ] `DODO_PRODUCT_ID` = the product id
- [ ] `DODO_PAYMENTS_WEBHOOK_SECRET` = the `whsec_` secret
- [ ] `DODO_MODE` = `test`

**✅ Check (test):** On the live site, enroll. You're redirected to Dodo's checkout; pay with a Dodo **test card**; you land back and the course unlocks with the certificate flow available. Keep displayed price and the Dodo product price the same ($35).

### 4c — Go live (only after the test works)
- [ ] In Dodo, switch to **Live mode**; recreate the **product**, **API key**, and **webhook** in Live.
- [ ] In Render, replace the three Dodo values with the Live ones and set `DODO_MODE` = `live`.

**✅ Check (live):** Make one real $35 purchase yourself; confirm it appears in Dodo and the course unlocks. (Refund yourself after.)

---

## Phase 5 — Google sign-in  **[OPTIONAL but requested]**

- [ ] **console.cloud.google.com** → create a project "Learnable".
- [ ] **OAuth consent screen** → External → app name "Learnable", support email = support@getlearnable.org → add scopes `email`, `profile`, `openid` → add yourself as a test user (or publish the app).
- [ ] **Credentials** → Create Credentials → **OAuth client ID** → type **Web application**.
- [ ] **Authorized redirect URI** = `https://learnable-p56a.onrender.com/api/auth/google/callback`
- [ ] Copy the **Client ID** and **Client Secret**.
- [ ] In Render → Environment: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

**✅ Check:** Reload the site; the "Continue with Google" button now appears on sign-in and logs you in.

---

## Phase 6 — Your own domain (getlearnable.org)  **[SOON]**

If you launch on the real domain rather than the Render URL:

- [ ] Render → **Settings → Custom Domains** → add `getlearnable.org` and `www.getlearnable.org`.
- [ ] In Cloudflare, add the A/CNAME records Render shows, set to **DNS only** (grey cloud).
- [ ] Wait for Render to show the certificate as issued (can take up to ~30–60 min).
- [ ] **Then update these to the new domain** (easy to forget):
  - Render env `APP_URL` → `https://getlearnable.org`
  - Google **Authorized redirect URI** → `https://getlearnable.org/api/auth/google/callback`
  - Dodo **webhook URL** → `https://getlearnable.org/api/payments/webhook`

**✅ Check:** `https://getlearnable.org` loads with a padlock, and sign-in + payment still work.

---

## Phase 7 — Brand touchpoints  **[SOON]**

- [ ] Upload `learnable-icon-512.png` as your **Dodo** product/merchant image and your **social** avatars.
- [ ] Favicon is already built into the site (the blue tile) — confirm you see it in the browser tab.
- [ ] Double-check the second mailbox is spelled `info@getlearnable.org`.

---

## Phase 8 — Full dress rehearsal on the LIVE site  **[MUST]**

Run the whole journey as a real user (use a test email):

- [ ] Sign up with email + password → log out → log back in.
- [ ] "Email me a magic link" → sign in from the email.
- [ ] "Forgot password" → reset → log in with the new password.
- [ ] (If set) "Continue with Google".
- [ ] Design a course → content is real and relevant.
- [ ] Enroll → pay (test) → course unlocks.
- [ ] Open a lesson: reading, video link, activity, quiz all work; AI tutor answers.
- [ ] Complete all lessons + submit capstone → certificate issues.
- [ ] Open the certificate's **verify** link in a private window → shows valid.
- [ ] Edit profile, upload a photo, toggle alumni visibility → appear in **Alumni**.
- [ ] Repeat the key screens **on your phone**.

---

## Phase 9 — Trust & legal basics (you're taking money + personal data)  **[SOON]**

- [ ] A short **Refund policy** (Dodo will ask; also reduces disputes).
- [ ] Basic **Terms of Service** and **Privacy Policy** pages/links — you're collecting accounts and payments. As a South-Africa-based business handling personal info, keep **POPIA** in mind.
- [ ] Confirm `support@getlearnable.org` inbox is monitored.
- [ ] Keep the wording "Certificate of Mastery / Completion" — never imply it's an accredited qualification or degree.

---

## Phase 10 — Launch  **[MUST]**

- [ ] Dodo is in **Live** mode; one real purchase confirmed and refunded.
- [ ] Announce it.
- [ ] First 48 hours: watch **Render → Logs**, **Anthropic** spend, and **Dodo** payments. Fix the first real-user issues fast.

---

## One-glance: all Render environment variables

```
NODE_ENV=production
APP_URL=https://learnable-p56a.onrender.com
JWT_SECRET=(long random string)
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=learnable

ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-sonnet-4-6

SMTP_HOST=mail.spacemail.com
SMTP_PORT=465
SMTP_USER=support@getlearnable.org
SMTP_PASS=(mailbox password)
FROM_EMAIL=Learnable <support@getlearnable.org>

DODO_PAYMENTS_API_KEY=(test_ then live_)
DODO_PRODUCT_ID=(from Dodo)
DODO_PAYMENTS_WEBHOOK_SECRET=whsec_...
DODO_MODE=test   # switch to live at launch
DODO_COUNTRY=ZA
PRICE=35

GOOGLE_CLIENT_ID=(optional)
GOOGLE_CLIENT_SECRET=(optional)

STUDY_MINUTES_REQUIRED=30
STUDY_PERIOD_DAYS=14
```

## The 4 things most likely to trip you up
1. **`MONGODB_URI` missing or wrong** → the app won't start. Make sure the password in the string is your real DB-user password (URL-encode any special characters), and `MONGODB_DB=learnable`.
2. **Atlas Network Access not opened** → connection times out. Allow `0.0.0.0/0` so your host can reach the cluster.
3. **Missing SPF/DKIM DNS** → magic-link and reset emails land in spam or bounce.
4. **Dodo test/live mismatch** → a Test product with a Live key (or vice-versa) fails checkout. Keep both in the same mode.

// server.js — Learnable API + static frontend (course player, AI tutor, study tracking, Dodo Payments).
// Data layer: MongoDB (see store.js). IDs are integers via an auto-increment counter.
require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");
const store = require("./store");

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const PROD = process.env.NODE_ENV === "production";
const PRICE = Number(process.env.PRICE || 35);
// Admin access: comma-separated emails allowed into the admin panel (set on the host).
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const isAdmin = (email) => ADMIN_EMAILS.includes(String(email || "").toLowerCase());

// Google OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT = `${APP_URL}/api/auth/google/callback`;
// Email (Spaceship / Spacemail SMTP) for magic links + password resets
const SMTP_HOST = process.env.SMTP_HOST || "mail.spacemail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || "Learnable <support@getlearnable.org>";
// Resend (HTTPS email API) — preferred when set. Sends over 443, so it works even
// where hosts block outbound SMTP, and its domain verification wires up SPF/DKIM.
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_ON = !!(RESEND_API_KEY || (SMTP_USER && SMTP_PASS));
let mailer = null;
if (SMTP_USER && SMTP_PASS) { try { mailer = require("nodemailer").createTransport({ host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } }); } catch (e) { console.warn("[warn] nodemailer not available:", e.message); } }
if (RESEND_API_KEY) console.log("[email] using Resend API for outbound email.");
else if (!EMAIL_ON) console.warn("[warn] No email transport set (RESEND_API_KEY or SMTP_USER/SMTP_PASS) — magic links & resets return a dev link in the API response instead of emailing.");
if (!GOOGLE_CLIENT_ID) console.warn("[warn] GOOGLE_CLIENT_ID not set — Google sign-in disabled.");

async function sendEmail(to, subject, html) {
  // Prefer Resend when configured; fall back to SMTP.
  if (RESEND_API_KEY) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
      });
      if (r.ok) return true;
      console.error("resend send failed:", r.status, await r.text().catch(() => ""));
      return false;
    } catch (e) { console.error("resend error:", e.message); return false; }
  }
  if (!mailer) return false;
  try { await mailer.sendMail({ from: FROM_EMAIL, to, subject, html }); return true; }
  catch (e) { console.error("email send failed:", e.message); return false; }
}
function emailShell(title, body, btnText, btnUrl) {
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1E293B">
    <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-weight:800;font-size:22px;color:#0B1F3A">Learnable</div>
    <h2 style="color:#0B1F3A">${title}</h2><p style="line-height:1.6;color:#64748B">${body}</p>
    <a href="${btnUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:12px;margin:12px 0">${btnText}</a>
    <p style="font-size:12px;color:#94a3b8;margin-top:18px">If you didn't request this, you can ignore this email. This link expires in 30 minutes.</p>
    <p style="font-family:'Roboto Mono',monospace;font-size:11px;color:#94a3b8;letter-spacing:.06em;margin-top:14px">Learn it. Prove it. · support@getlearnable.org</p></div>`;
}

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";

// ---- Dodo Payments ----
// Trim env values so stray whitespace/quotes can't break auth or the product lookup.
const DODO_KEY = (process.env.DODO_PAYMENTS_API_KEY || "").trim() || undefined;
const DODO_PRODUCT_ID = (process.env.DODO_PRODUCT_ID || "").trim() || undefined;
const DODO_WEBHOOK_SECRET = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;
// Normalize mode (case/whitespace-insensitive) so "Live"/" live " still selects live.
const DODO_MODE = (process.env.DODO_MODE || "").trim().toLowerCase();
const DODO_BASE = DODO_MODE === "live" ? "https://live.dodopayments.com" : "https://test.dodopayments.com";
const DODO_COUNTRY = process.env.DODO_COUNTRY || "ZA";
// Pull a human-readable reason out of a Dodo error response (its shape varies).
function dodoErrorDetail(data) {
  if (!data || typeof data !== "object") return "";
  if (typeof data.message === "string") return data.message;
  if (typeof data.error === "string") return data.error;
  if (data.error && typeof data.error.message === "string") return data.error.message;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail) && data.detail.length) {
    const d = data.detail[0];
    const where = Array.isArray(d.loc) ? d.loc.join(".") + ": " : "";
    return d && (d.msg || d.message) ? `${where}${d.msg || d.message}` : JSON.stringify(d);
  }
  return "";
}

// Study rule
const STUDY_MINUTES_REQUIRED = Number(process.env.STUDY_MINUTES_REQUIRED || 30);
const STUDY_PERIOD_DAYS = Number(process.env.STUDY_PERIOD_DAYS || 14);

// Free trial: new users get full course access for this many days, then it locks
// until they pay. The credential is only issued on a paid enrollment.
const TRIAL_DAYS = Number(process.env.TRIAL_DAYS || 7);

if (!ANTHROPIC_KEY) console.warn("[warn] ANTHROPIC_API_KEY not set — using sample fallbacks.");
if (!DODO_KEY || !DODO_PRODUCT_ID) console.warn("[warn] Dodo not fully configured — enrollment runs in DEV MODE (simulated payment).");
else console.log(`[dodo] mode=${DODO_MODE === "live" ? "live" : "test"} base=${DODO_BASE} product=${DODO_PRODUCT_ID}`);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

/* ----------------------------- helpers ----------------------------- */
const signToken = (u) => jwt.sign({ id: u.id, email: u.email, name: u.name }, JWT_SECRET, { expiresIn: "30d" });
const setAuthCookie = (res, t) => res.cookie("token", t, { httpOnly: true, sameSite: "lax", secure: PROD, maxAge: 2592000000 });
function currentUser(req) { const t = req.cookies?.token; if (!t) return null; try { return jwt.verify(t, JWT_SECRET); } catch { return null; } }
function requireAuth(req, res, next) { const u = currentUser(req); if (!u) return res.status(401).json({ error: "Please sign in." }); req.user = u; next(); }
function requireAdmin(req, res, next) { const u = currentUser(req); if (!u) return res.status(401).json({ error: "Please sign in." }); if (!isAdmin(u.email)) return res.status(403).json({ error: "Not authorized." }); req.user = u; next(); }
function credId() { const s = () => crypto.randomBytes(2).toString("hex").toUpperCase(); return `LRN-${s()}-${s()}`; }
async function fullUser(id) {
  const u = await store.users.findOne({ id: Number(id) });
  if (!u) return null;
  return { id: Number(u.id), name: u.name, email: u.email, avatar: u.avatar || null,
    headline: u.headline || "", education: u.education || "", linkedin: u.linkedin || "", alumniVisible: !!u.alumni_visible,
    admin: isAdmin(u.email) };
}
function rowProgram(r) {
  return { id: r.id, goal: r.goal, why: r.why, title: r.title, subtitle: r.subtitle, level: r.level,
    totalHours: r.total_hours, summary: r.summary, skills: JSON.parse(r.skills || "[]"),
    modules: JSON.parse(r.modules || "[]"), capstone: JSON.parse(r.capstone || "{}") };
}
async function generateJSON(prompt, fallback, maxTokens = 1500) {
  if (!anthropic) return fallback;
  const msg = await anthropic.messages.create({ model: MODEL, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] });
  const text = (msg.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  return JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
}
async function getPaidEnrollment(userId, programId) {
  const arr = await store.enrollments.find({ user_id: Number(userId), program_id: Number(programId), status: "paid" }).sort({ id: -1 }).toArray();
  return arr[0] || null;
}
// The user's (single) enrollment for a program, whatever its status.
async function getEnrollment(userId, programId) {
  const arr = await store.enrollments.find({ user_id: Number(userId), program_id: Number(programId) }).sort({ id: -1 }).toArray();
  return arr[0] || null;
}
function trialActive(enr) {
  return !!(enr && enr.status === "trial" && enr.trial_expires && new Date(enr.trial_expires).getTime() > Date.now());
}
// Access is granted while paid, or during an unexpired trial.
function enrollmentActive(enr) {
  return !!(enr && (enr.status === "paid" || trialActive(enr)));
}
async function getActiveEnrollment(userId, programId) {
  const enr = await getEnrollment(userId, programId);
  return enrollmentActive(enr) ? enr : null;
}
// One free trial per user, ever (the flag survives a later upgrade to paid).
async function hasUsedTrial(userId) {
  return !!(await store.enrollments.findOne({ user_id: Number(userId), is_trial: true }));
}

/* ----------------------------- auth ----------------------------- */
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: "Name, email, and password are required." });
    if (String(password).length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
    const lower = String(email).toLowerCase();
    if (await store.users.findOne({ email: lower })) return res.status(409).json({ error: "That email already has an account. Try signing in." });
    const id = await store.nextId("users");
    await store.users.insertOne({ id, name, email: lower, password_hash: bcrypt.hashSync(String(password), 10),
      avatar: null, headline: "", education: "", linkedin: "", alumni_visible: 1, google_id: null,
      reset_token: null, reset_expires: null, magic_token: null, magic_expires: null, created_at: new Date().toISOString() });
    const user = await fullUser(id);
    setAuthCookie(res, signToken(user)); res.json({ user });
  } catch (e) { console.error("signup:", e.message); res.status(500).json({ error: "Could not create your account. Try again." }); }
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const u = await store.users.findOne({ email: String(email || "").toLowerCase() });
    if (!u || !bcrypt.compareSync(String(password || ""), u.password_hash)) return res.status(401).json({ error: "Wrong email or password." });
    const user = await fullUser(u.id);
    setAuthCookie(res, signToken(user)); res.json({ user });
  } catch (e) { console.error("login:", e.message); res.status(500).json({ error: "Could not sign you in. Try again." }); }
});
app.post("/api/auth/logout", (req, res) => { res.clearCookie("token"); res.json({ ok: true }); });
app.get("/api/auth/me", async (req, res) => { const u = currentUser(req); res.json({ user: u ? await fullUser(u.id) : null }); });

// tells the frontend which sign-in methods are available
app.get("/api/config", (req, res) => res.json({ google: !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET), email: EMAIL_ON }));

function randomHash() { return bcrypt.hashSync(crypto.randomBytes(24).toString("hex"), 10); }
async function upsertUserByEmail(email, name, googleId) {
  email = String(email).toLowerCase();
  const u = await store.users.findOne({ email });
  if (u) { if (googleId && !u.google_id) await store.users.updateOne({ id: u.id }, { $set: { google_id: googleId } }); return u.id; }
  const id = await store.nextId("users");
  await store.users.insertOne({ id, name: name || email.split("@")[0], email, password_hash: randomHash(),
    avatar: null, headline: "", education: "", linkedin: "", alumni_visible: 1, google_id: googleId || null,
    reset_token: null, reset_expires: null, magic_token: null, magic_expires: null, created_at: new Date().toISOString() });
  return id;
}

/* ---- Google OAuth ---- */
app.get("/api/auth/google", (req, res) => {
  if (!GOOGLE_CLIENT_ID) return res.status(400).send("Google sign-in is not configured.");
  const state = crypto.randomBytes(16).toString("hex");
  res.cookie("oauth_state", state, { httpOnly: true, sameSite: "lax", secure: PROD, maxAge: 600000 });
  res.redirect("https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID, redirect_uri: GOOGLE_REDIRECT, response_type: "code",
    scope: "openid email profile", state, prompt: "select_account",
  }));
});
app.get("/api/auth/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state || state !== req.cookies?.oauth_state) return res.redirect("/?autherror=1");
    res.clearCookie("oauth_state");
    const tk = await (await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, redirect_uri: GOOGLE_REDIRECT, grant_type: "authorization_code" }) })).json();
    if (!tk.access_token) { console.error("google token:", tk); return res.redirect("/?autherror=1"); }
    const p = await (await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${tk.access_token}` } })).json();
    if (!p.email) return res.redirect("/?autherror=1");
    const id = await upsertUserByEmail(p.email, p.name, p.id);
    setAuthCookie(res, signToken(await fullUser(id)));
    res.redirect("/");
  } catch (e) { console.error("google callback:", e.message); res.redirect("/?autherror=1"); }
});

/* ---- Magic link (passwordless) ---- */
app.post("/api/auth/magic", async (req, res) => {
  try {
    const email = String((req.body || {}).email || "").toLowerCase().trim();
    const name = (req.body || {}).name;
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) return res.status(400).json({ error: "Enter a valid email." });
    const id = await upsertUserByEmail(email, name);
    const token = crypto.randomBytes(24).toString("hex");
    await store.users.updateOne({ id }, { $set: { magic_token: token, magic_expires: new Date(Date.now() + 1800000).toISOString() } });
    const link = `${APP_URL}/?magic=${token}`;
    const sent = await sendEmail(email, "Your Learnable sign-in link", emailShell("Sign in to Learnable", "Click below to sign in. No password needed.", "Sign in", link));
    res.json({ ok: true, devLink: (!sent && !PROD) ? link : undefined });
  } catch (e) { console.error("magic:", e.message); res.status(500).json({ error: "Could not send the link. Try again." }); }
});
app.post("/api/auth/magic/verify", async (req, res) => {
  try {
    const token = (req.body || {}).token;
    const u = await store.users.findOne({ magic_token: token });
    if (!u || !u.magic_expires || new Date(u.magic_expires).getTime() < Date.now()) return res.status(400).json({ error: "This link is invalid or has expired." });
    await store.users.updateOne({ id: u.id }, { $set: { magic_token: null, magic_expires: null } });
    const user = await fullUser(u.id);
    setAuthCookie(res, signToken(user)); res.json({ user });
  } catch (e) { console.error("magic verify:", e.message); res.status(500).json({ error: "Could not sign you in. Try again." }); }
});

/* ---- Forgot / reset password ---- */
app.post("/api/auth/forgot", async (req, res) => {
  try {
    const email = String((req.body || {}).email || "").toLowerCase().trim();
    const u = await store.users.findOne({ email });
    let devLink;
    if (u) {
      const token = crypto.randomBytes(24).toString("hex");
      await store.users.updateOne({ id: u.id }, { $set: { reset_token: token, reset_expires: new Date(Date.now() + 1800000).toISOString() } });
      const link = `${APP_URL}/?reset=${token}`;
      const sent = await sendEmail(email, "Reset your Learnable password", emailShell("Reset your password", "Click below to choose a new password.", "Reset password", link));
      if (!sent && !PROD) devLink = link;
    }
    res.json({ ok: true, devLink }); // never reveal whether the email exists
  } catch (e) { console.error("forgot:", e.message); res.status(500).json({ error: "Could not process that. Try again." }); }
});
app.post("/api/auth/reset", async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!password || String(password).length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
    const u = await store.users.findOne({ reset_token: token });
    if (!u || !u.reset_expires || new Date(u.reset_expires).getTime() < Date.now()) return res.status(400).json({ error: "This reset link is invalid or has expired." });
    await store.users.updateOne({ id: u.id }, { $set: { password_hash: bcrypt.hashSync(String(password), 10), reset_token: null, reset_expires: null } });
    res.json({ ok: true });
  } catch (e) { console.error("reset:", e.message); res.status(500).json({ error: "Could not reset your password. Try again." }); }
});

// Update profile (name, avatar, education, LinkedIn, alumni visibility).
app.put("/api/profile", requireAuth, async (req, res) => {
  try {
    const { name, avatar, headline, education, linkedin, alumniVisible } = req.body || {};
    if (avatar && String(avatar).length > 350000) return res.status(400).json({ error: "That image is too large. Please use a smaller photo." });
    if (linkedin && !/^https?:\/\//i.test(linkedin)) return res.status(400).json({ error: "LinkedIn must be a full URL (https://...)." });
    const cur = await fullUser(req.user.id);
    await store.users.updateOne({ id: Number(req.user.id) }, { $set: {
      name: name ?? cur.name, avatar: avatar ?? cur.avatar, headline: headline ?? cur.headline,
      education: education ?? cur.education, linkedin: linkedin ?? cur.linkedin,
      alumni_visible: alumniVisible === undefined ? (cur.alumniVisible ? 1 : 0) : (alumniVisible ? 1 : 0) } });
    res.json({ user: await fullUser(req.user.id) });
  } catch (e) { console.error("profile:", e.message); res.status(500).json({ error: "Could not save your profile. Try again." }); }
});

// Alumni directory — credentialed, visible members. A core paid benefit.
app.get("/api/alumni", requireAuth, async (req, res) => {
  try {
    const skill = (req.query.skill || "").toString().toLowerCase().trim();
    const visible = await store.users.find({ alumni_visible: 1 }).toArray();
    const vmap = new Map(visible.map((u) => [u.id, u]));
    const certs = await store.certificates.find({ user_id: { $in: [...vmap.keys()] } }).sort({ issued_at: -1 }).toArray();
    const map = new Map();
    for (const c of certs) {
      const u = vmap.get(c.user_id); if (!u) continue;
      if (!map.has(u.id)) map.set(u.id, { id: Number(u.id), name: u.name, avatar: u.avatar || null,
        headline: u.headline || "", education: u.education || "", linkedin: u.linkedin || "", credentials: [] });
      map.get(u.id).credentials.push({ programTitle: c.program_title, skills: JSON.parse(c.skills || "[]") });
    }
    let list = [...map.values()];
    if (skill) list = list.filter((a) => a.credentials.some((c) =>
      c.programTitle.toLowerCase().includes(skill) || (c.skills || []).some((s) => s.toLowerCase().includes(skill))));
    res.json({ alumni: list.slice(0, 80), total: list.length });
  } catch (e) { console.error("alumni:", e.message); res.status(500).json({ error: "Could not load alumni. Try again." }); }
});

/* ----------------------------- programs (free preview) ----------------------------- */
app.post("/api/programs", async (req, res) => {
  const { goal, why } = req.body || {};
  if (!goal || !String(goal).trim()) return res.status(400).json({ error: "Tell us what you want to master." });
  const user = currentUser(req);
  const prompt = `You design a premium micro-credential program. The learner wants to master: "${goal}". Their reason: "${why || "career growth"}".
Return ONLY minified JSON (no markdown): {"title":"program name, <8 words","subtitle":"one line, <14 words","level":"Foundational|Professional|Advanced","totalHours":<int 8-40>,"summary":"2 sentences on what they'll be able to do","skills":["6 concrete resume-ready skills"],"modules":[{"title":"...","hours":<int>,"lessons":["3 short lesson titles"]}],"capstone":{"title":"...","description":"1-2 sentences, a deliverable tied to their reason"}}
Exactly 5 modules. Keep strings tight.`;
  const fb = { title: `Foundations of ${String(goal).slice(0, 40)}`, subtitle: "A focused, build-something path.", level: "Professional", totalHours: 20,
    summary: "You'll gain working command of the core concepts and finish with a deliverable you can show.",
    skills: ["Core concepts", "Practical application", "Tooling", "Analysis", "Communication", "A finished capstone"],
    modules: [1, 2, 3, 4, 5].map((n) => ({ title: `Module ${n}`, hours: 4, lessons: ["Lesson A", "Lesson B", "Lesson C"] })),
    capstone: { title: "Your capstone", description: "A real deliverable tied to why you started." } };
  try {
    const p = await generateJSON(prompt, fb, 1800);
    const id = await store.nextId("programs");
    await store.programs.insertOne({ id, user_id: user?.id ?? null, goal, why: why || null,
      title: p.title, subtitle: p.subtitle, level: p.level, total_hours: p.totalHours, summary: p.summary,
      skills: JSON.stringify(p.skills || []), modules: JSON.stringify(p.modules || []), capstone: JSON.stringify(p.capstone || {}),
      created_at: new Date().toISOString() });
    res.json({ program: { id, ...p, goal, why } });
  } catch (e) { console.error("generate program:", e.message); res.status(502).json({ error: "Couldn't generate the program. Please try again." }); }
});
app.get("/api/programs", requireAuth, async (req, res) => {
  const rows = await store.programs.find({ user_id: Number(req.user.id) }).sort({ id: -1 }).toArray();
  res.json({ programs: rows.map(rowProgram) });
});
app.get("/api/programs/:id", async (req, res) => {
  const r = await store.programs.findOne({ id: Number(req.params.id) });
  if (!r) return res.status(404).json({ error: "Program not found." });
  res.json({ program: rowProgram(r) });
});
app.post("/api/programs/:id/cv", async (req, res) => {
  const r = await store.programs.findOne({ id: Number(req.params.id) });
  if (!r) return res.status(404).json({ error: "Program not found." });
  const p = rowProgram(r);
  const prompt = `A learner completed a credential in "${p.title}" (skills: ${(p.skills || []).join(", ")}). Reason: "${p.why || "career growth"}".
Return ONLY minified JSON: {"headline":"one-line resume positioning statement","bullets":["4 achievement resume bullets, strong verbs"],"linkedin":"2-sentence first-person LinkedIn About"}`;
  const fb = { headline: `${p.title} — credentialed and capstone-proven`,
    bullets: ["Completed a structured program and shipped a real capstone.", "Built working command of " + (p.skills || []).slice(0, 3).join(", ") + ".", "Applied new skills to a self-directed project.", "Earned a verifiable credential of finished, independent work."],
    linkedin: `I recently earned a credential in ${p.title} and applied it on a hands-on capstone.` };
  try { res.json({ cv: await generateJSON(prompt, fb, 700) }); }
  catch (e) { console.error("cv:", e.message); res.status(502).json({ error: "Couldn't generate CV content. Try again." }); }
});

/* ----------------------------- enrollment + Dodo Payments ----------------------------- */
async function issueCertificate(user, program) {
  const existing = await store.certificates.findOne({ user_id: user.id, program_id: program.id });
  if (existing) return existing.cred_id;
  const id = credId();
  await store.certificates.insertOne({ cred_id: id, user_id: user.id, program_id: program.id,
    name: user.name, program_title: program.title, skills: JSON.stringify(program.skills || []), issued_at: new Date().toISOString() });
  return id;
}
async function activateEnrollment(userId, programId, reference, paymentId) {
  const now = new Date().toISOString();
  // Upgrade the user's existing enrollment for this program (trial/pending) to paid.
  const existing = await getEnrollment(userId, programId);
  if (existing) {
    await store.enrollments.updateOne({ id: existing.id }, { $set: { status: "paid", period_start: existing.period_start || now, course_status: "active", payment_id: paymentId || null, reference } });
  } else {
    const id = await store.nextId("enrollments");
    await store.enrollments.insertOne({ id, user_id: Number(userId), program_id: Number(programId), status: "paid",
      amount: Math.round(PRICE * 100), currency: "USD", reference, payment_id: paymentId || null,
      period_start: now, minutes_period: 0, last_active: null, course_status: "active", created_at: now });
  }
}

app.post("/api/programs/:id/enroll", requireAuth, async (req, res) => {
  const r = await store.programs.findOne({ id: Number(req.params.id) });
  if (!r) return res.status(404).json({ error: "Program not found." });
  const program = rowProgram(r);
  const existing = await getEnrollment(req.user.id, program.id);
  if (existing && existing.status === "paid") return res.json({ alreadyEnrolled: true });
  const reference = "lrn_" + crypto.randomBytes(8).toString("hex");

  if (!DODO_KEY || !DODO_PRODUCT_ID) { // DEV MODE
    await activateEnrollment(req.user.id, program.id, reference, "dev");
    return res.json({ devPaid: true });
  }
  try {
    if (existing) {
      await store.enrollments.updateOne({ id: existing.id }, { $set: { status: "pending", reference, payment_id: null } });
    } else {
      const id = await store.nextId("enrollments");
      await store.enrollments.insertOne({ id, user_id: Number(req.user.id), program_id: Number(program.id), status: "pending",
        amount: Math.round(PRICE * 100), currency: "USD", reference, payment_id: null,
        period_start: null, minutes_period: 0, last_active: null, course_status: "active", created_at: new Date().toISOString() });
    }
    const r2 = await fetch(`${DODO_BASE}/payments`, {
      method: "POST", headers: { Authorization: `Bearer ${DODO_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        payment_link: true,
        customer: { email: req.user.email, name: req.user.name },
        billing: { city: "NA", country: DODO_COUNTRY, state: "NA", street: "NA", zipcode: "0000" },
        product_cart: [{ product_id: DODO_PRODUCT_ID, quantity: 1 }],
        return_url: `${APP_URL}/?ref=${reference}`,
        metadata: { reference, program_id: String(program.id), user_id: String(req.user.id) },
      }),
    });
    const data = await r2.json().catch(() => ({}));
    if (!r2.ok || !data.payment_link) {
      console.error("dodo create failed:", r2.status, JSON.stringify(data));
      const detail = dodoErrorDetail(data) || `HTTP ${r2.status}`;
      return res.status(502).json({ error: `Could not start payment: ${detail}` });
    }
    await store.enrollments.updateOne({ reference }, { $set: { payment_id: data.payment_id || null } });
    res.json({ checkout_url: data.payment_link, reference });
  } catch (e) { console.error("dodo enroll:", e.message); res.status(502).json({ error: `Could not start payment: ${e.message}` }); }
});

// Start a free trial (no payment) — full access for TRIAL_DAYS, one per user.
app.post("/api/programs/:id/trial", requireAuth, async (req, res) => {
  const r = await store.programs.findOne({ id: Number(req.params.id) });
  if (!r) return res.status(404).json({ error: "Program not found." });
  const program = rowProgram(r);
  const existing = await getEnrollment(req.user.id, program.id);
  if (existing && existing.status === "paid") return res.json({ alreadyEnrolled: true });
  if (trialActive(existing)) return res.json({ trial: true, expiresAt: existing.trial_expires });
  if (await hasUsedTrial(req.user.id))
    return res.status(403).json({ error: "You've already used your free trial. Enroll to keep learning." });
  const now = new Date();
  const expires = new Date(now.getTime() + TRIAL_DAYS * 86400000).toISOString();
  if (existing) {
    await store.enrollments.updateOne({ id: existing.id }, { $set: { status: "trial", is_trial: true,
      trial_expires: expires, period_start: now.toISOString(), minutes_period: 0, course_status: "active" } });
  } else {
    const id = await store.nextId("enrollments");
    await store.enrollments.insertOne({ id, user_id: Number(req.user.id), program_id: Number(program.id), status: "trial",
      is_trial: true, trial_expires: expires, amount: Math.round(PRICE * 100), currency: "USD",
      reference: "trial_" + crypto.randomBytes(6).toString("hex"), payment_id: null,
      period_start: now.toISOString(), minutes_period: 0, last_active: null, course_status: "active", created_at: now.toISOString() });
  }
  res.json({ trial: true, expiresAt: expires });
});

// Called when Dodo redirects back to ?ref=...
app.get("/api/payments/verify", requireAuth, async (req, res) => {
  const ref = req.query.ref;
  const enr = await store.enrollments.findOne({ reference: ref });
  if (!enr) return res.status(404).json({ error: "Enrollment not found." });
  if (enr.status === "paid") return res.json({ paid: true });
  if (!DODO_KEY) return res.status(400).json({ error: "Payments not configured." });
  try {
    const v = await fetch(`${DODO_BASE}/payments/${enr.payment_id}`, { headers: { Authorization: `Bearer ${DODO_KEY}` } });
    const data = await v.json();
    const ok = (data.status || "").toLowerCase() === "succeeded";
    if (ok) { await activateEnrollment(enr.user_id, enr.program_id, ref, enr.payment_id); return res.json({ paid: true }); }
    res.json({ paid: false });
  } catch (e) { console.error("dodo verify:", e.message); res.status(502).json({ error: "Could not verify payment." }); }
});

// Dodo webhook (Standard Webhooks signature). Optional but recommended.
app.post("/api/payments/webhook", express.raw({ type: "*/*" }), async (req, res) => {
  try {
    if (DODO_WEBHOOK_SECRET) {
      const id = req.headers["webhook-id"], ts = req.headers["webhook-timestamp"], sigHeader = req.headers["webhook-signature"] || "";
      const secret = Buffer.from(DODO_WEBHOOK_SECRET.replace(/^whsec_/, ""), "base64");
      const expected = crypto.createHmac("sha256", secret).update(`${id}.${ts}.${req.body.toString()}`).digest("base64");
      const ok = String(sigHeader).split(" ").some((p) => p.split(",")[1] === expected);
      if (!ok) return res.sendStatus(401);
    }
    const evt = JSON.parse(req.body.toString());
    const type = evt.type || evt.event_type || "";
    if (type.includes("succeeded") || type === "payment.succeeded") {
      const meta = evt.data?.metadata || evt.metadata || {};
      if (meta.reference && meta.user_id && meta.program_id)
        await activateEnrollment(Number(meta.user_id), Number(meta.program_id), meta.reference, evt.data?.payment_id);
    }
    res.sendStatus(200);
  } catch (e) { console.error("webhook:", e.message); res.sendStatus(200); }
});

/* ----------------------------- COURSE (enrolled only) ----------------------------- */
async function computeCourseState(enr) {
  // Roll / pause the 2-week study window.
  const now = Date.now();
  let { period_start, minutes_period, course_status } = enr;
  const start = period_start ? new Date(period_start).getTime() : now;
  const daysIn = (now - start) / 86400000;
  let status = course_status || "active";
  if (minutes_period >= STUDY_MINUTES_REQUIRED && daysIn >= STUDY_PERIOD_DAYS) {
    await store.enrollments.updateOne({ id: enr.id }, { $set: { period_start: new Date().toISOString(), minutes_period: 0, course_status: "active" } });
    return { status: "active", minutes: 0, required: STUDY_MINUTES_REQUIRED, daysLeft: STUDY_PERIOD_DAYS };
  }
  if (minutes_period < STUDY_MINUTES_REQUIRED && daysIn >= STUDY_PERIOD_DAYS) {
    status = "paused";
    if (course_status !== "paused") await store.enrollments.updateOne({ id: enr.id }, { $set: { course_status: "paused" } });
  }
  return { status, minutes: minutes_period, required: STUDY_MINUTES_REQUIRED, daysLeft: Math.max(0, Math.ceil(STUDY_PERIOD_DAYS - daysIn)) };
}

app.get("/api/courses/:id/state", requireAuth, async (req, res) => {
  const r = await store.programs.findOne({ id: Number(req.params.id) });
  if (!r) return res.status(404).json({ error: "Program not found." });
  const program = rowProgram(r);
  const enr = await getEnrollment(req.user.id, program.id);
  if (!enrollmentActive(enr)) {
    return res.json({ enrolled: false, program,
      trialExpired: !!(enr && enr.is_trial),
      trialAvailable: !(await hasUsedTrial(req.user.id)) });
  }
  const paid = enr.status === "paid";
  const study = await computeCourseState(enr);
  const prog = await store.progress.find({ user_id: Number(req.user.id), program_id: program.id }).toArray();
  const done = new Set(prog.filter((p) => p.completed).map((p) => p.lesson_key));
  let total = 0; (program.modules || []).forEach((m) => (m.lessons || []).forEach(() => { total++; }));
  const capstoneDone = done.has("capstone");
  const lessonsDone = [...done].filter((k) => k !== "capstone").length;
  const allDone = lessonsDone >= total && capstoneDone;
  // Credential is only issued on a paid enrollment (trials don't earn one).
  let cred = null;
  if (allDone && paid) { const u = await store.users.findOne({ id: Number(req.user.id) }); cred = await issueCertificate(u, program); }
  const trial = trialActive(enr)
    ? { expiresAt: enr.trial_expires, daysLeft: Math.max(0, Math.ceil((new Date(enr.trial_expires).getTime() - Date.now()) / 86400000)) }
    : null;
  res.json({ enrolled: true, paid, trial, program, study, completed: [...done], total, lessonsDone, capstoneDone, allDone, credId: cred });
});

app.post("/api/courses/:id/lesson", requireAuth, async (req, res) => {
  const { moduleIdx, lessonIdx } = req.body || {};
  const r = await store.programs.findOne({ id: Number(req.params.id) });
  if (!r) return res.status(404).json({ error: "Program not found." });
  const program = rowProgram(r);
  if (!await getActiveEnrollment(req.user.id, program.id)) return res.status(403).json({ error: "Start a free trial or enroll to access lessons." });
  const key = `${moduleIdx}-${lessonIdx}`;
  const cached = await store.lesson_content.findOne({ program_id: program.id, lesson_key: key });
  if (cached) return res.json({ lesson: JSON.parse(cached.content) });
  const mod = program.modules?.[moduleIdx]; const title = mod?.lessons?.[lessonIdx];
  if (!title) return res.status(404).json({ error: "Lesson not found." });
  const prompt = `Learner is mastering "${program.goal}". Module: "${mod.title}". Lesson: "${title}".
Return ONLY minified JSON: {"reading":"130-180 word focused, concrete explanation of this lesson's core idea","videoQuery":"a precise YouTube search phrase for a great tutorial on this lesson","activity":"a short hands-on task (1-2 sentences) to apply it","quiz":[{"q":"question","options":["a","b","c","d"],"answer":<0-3>}]}
Exactly 3 quiz questions. Make the correct answer index accurate.`;
  const fb = { reading: `This lesson covers ${title}. Focus on the core idea, then practice it. (Add an ANTHROPIC_API_KEY for full AI lessons.)`,
    videoQuery: `${title} tutorial`, activity: `Spend 10 minutes applying "${title}" to your own goal: ${program.goal}.`,
    quiz: [{ q: `What is the focus of "${title}"?`, options: ["The core concept", "Something unrelated", "Nothing", "Random"], answer: 0 }] };
  try {
    const lesson = await generateJSON(prompt, fb, 900);
    lesson.videoUrl = "https://www.youtube.com/results?search_query=" + encodeURIComponent(lesson.videoQuery || title);
    await store.lesson_content.updateOne({ program_id: program.id, lesson_key: key }, { $set: { content: JSON.stringify(lesson) } }, { upsert: true });
    res.json({ lesson });
  } catch (e) { console.error("lesson:", e.message); res.status(502).json({ error: "Couldn't load this lesson. Try again." }); }
});

app.post("/api/courses/:id/progress", requireAuth, async (req, res) => {
  const { lessonKey, quizScore } = req.body || {};
  if (!await getActiveEnrollment(req.user.id, req.params.id)) return res.status(403).json({ error: "Not enrolled." });
  await store.progress.updateOne(
    { user_id: Number(req.user.id), program_id: Number(req.params.id), lesson_key: String(lessonKey) },
    { $set: { completed: 1, quiz_score: quizScore ?? null, updated_at: new Date().toISOString() } }, { upsert: true });
  res.json({ ok: true });
});

// Study heartbeat: +1 minute of study time toward the current window.
app.post("/api/courses/:id/heartbeat", requireAuth, async (req, res) => {
  const enr = await getActiveEnrollment(req.user.id, req.params.id);
  if (!enr) return res.status(403).json({ error: "Not enrolled." });
  const now = new Date().toISOString();
  let mins = (enr.minutes_period || 0) + 1;
  let status = enr.course_status;
  // Completing a catch-up session reactivates a paused course and starts a fresh window.
  if (status === "paused" && mins >= STUDY_MINUTES_REQUIRED) {
    await store.enrollments.updateOne({ id: enr.id }, { $set: { minutes_period: 0, period_start: now, course_status: "active", last_active: now } });
    return res.json({ minutes: 0, status: "active", required: STUDY_MINUTES_REQUIRED });
  }
  await store.enrollments.updateOne({ id: enr.id }, { $set: { minutes_period: mins, last_active: now } });
  res.json({ minutes: mins, status, required: STUDY_MINUTES_REQUIRED });
});

// AI tutor.
app.post("/api/courses/:id/tutor", requireAuth, async (req, res) => {
  const { messages, lessonTitle } = req.body || {};
  const r = await store.programs.findOne({ id: Number(req.params.id) });
  if (!r) return res.status(404).json({ error: "Program not found." });
  const program = rowProgram(r);
  if (!await getActiveEnrollment(req.user.id, program.id)) return res.status(403).json({ error: "Start a free trial or enroll to use the tutor." });
  if (!anthropic) return res.json({ reply: "The AI tutor needs an ANTHROPIC_API_KEY configured on the server. Once it's set, I'll answer your questions about this lesson." });
  try {
    const system = `You are a patient, encouraging tutor helping a learner master "${program.goal}".${lessonTitle ? ` They are on the lesson "${lessonTitle}".` : ""} Keep replies concise and concrete. Use plain language, small examples, and ask a guiding question when it helps them think. Never do their capstone for them — coach instead.`;
    const msg = await anthropic.messages.create({ model: MODEL, max_tokens: 700, system,
      messages: (messages || []).slice(-12).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 2000) })) });
    res.json({ reply: (msg.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n") });
  } catch (e) { console.error("tutor:", e.message); res.status(502).json({ error: "The tutor is unavailable right now. Try again." }); }
});

app.post("/api/courses/:id/capstone", requireAuth, async (req, res) => {
  if (!await getActiveEnrollment(req.user.id, req.params.id)) return res.status(403).json({ error: "Not enrolled." });
  await store.progress.updateOne(
    { user_id: Number(req.user.id), program_id: Number(req.params.id), lesson_key: "capstone" },
    { $set: { completed: 1, updated_at: new Date().toISOString() } }, { upsert: true });
  res.json({ ok: true });
});

/* ----------------------------- certificates ----------------------------- */
app.get("/api/certificates", requireAuth, async (req, res) => {
  const rows = await store.certificates.find({ user_id: Number(req.user.id) }).sort({ issued_at: -1 }).toArray();
  res.json({ certificates: rows.map((c) => ({ credId: c.cred_id, name: c.name, programTitle: c.program_title, skills: JSON.parse(c.skills || "[]"), issuedAt: c.issued_at })) });
});
app.get("/api/verify/:credId", async (req, res) => {
  const c = await store.certificates.findOne({ cred_id: req.params.credId });
  if (!c) return res.json({ valid: false });
  res.json({ valid: true, name: c.name, programTitle: c.program_title, skills: JSON.parse(c.skills || "[]"), issuedAt: c.issued_at });
});

/* ----------------------------- admin ----------------------------- */
// Learner overview: who has started (trial or paid), how far they are, and how to reach them.
app.get("/api/admin/overview", requireAdmin, async (req, res) => {
  try {
    const [users, programs, enrollments, progress, certs] = await Promise.all([
      store.users.find({}).toArray(),
      store.programs.find({}).toArray(),
      store.enrollments.find({}).toArray(),
      store.progress.find({}).toArray(),
      store.certificates.find({}).toArray(),
    ]);
    const userById = new Map(users.map((u) => [u.id, u]));
    const progById = new Map(programs.map((p) => [p.id, p]));
    const key = (uid, pid) => `${uid}:${pid}`;

    // Completed-lesson counts per (user, program).
    const doneMap = new Map();
    for (const pr of progress) {
      if (!pr.completed) continue;
      const k = key(pr.user_id, pr.program_id);
      if (!doneMap.has(k)) doneMap.set(k, { lessons: 0, capstone: false });
      if (pr.lesson_key === "capstone") doneMap.get(k).capstone = true;
      else doneMap.get(k).lessons++;
    }
    const certSet = new Set(certs.map((c) => key(c.user_id, c.program_id)));
    const now = Date.now();

    const rows = enrollments
      .filter((e) => e.status === "trial" || e.status === "paid")
      .map((e) => {
        const u = userById.get(e.user_id) || {};
        const p = progById.get(e.program_id) || {};
        let total = 0;
        try { JSON.parse(p.modules || "[]").forEach((m) => (m.lessons || []).forEach(() => total++)); } catch {}
        const d = doneMap.get(key(e.user_id, e.program_id)) || { lessons: 0, capstone: false };
        const trialLive = e.status === "trial" && e.trial_expires && new Date(e.trial_expires).getTime() > now;
        const status = e.status === "paid" ? "paid" : trialLive ? "trial" : "trial_expired";
        const done = d.lessons + (d.capstone ? 1 : 0);
        const percent = total ? Math.round((done / (total + 1)) * 100) : 0;
        return {
          name: u.name || "—",
          email: u.email || "—",
          program: p.title || `Program #${e.program_id}`,
          programId: e.program_id,
          status,
          lessonsDone: d.lessons,
          totalLessons: total,
          capstoneDone: d.capstone,
          percent,
          minutes: e.minutes_period || 0,
          trialDaysLeft: trialLive ? Math.max(0, Math.ceil((new Date(e.trial_expires).getTime() - now) / 86400000)) : null,
          hasCredential: certSet.has(key(e.user_id, e.program_id)),
          startedAt: e.created_at || null,
          lastActive: e.last_active || null,
        };
      });

    rows.sort((a, b) => new Date(b.lastActive || b.startedAt || 0) - new Date(a.lastActive || a.startedAt || 0));

    const stats = {
      users: users.length,
      programs: programs.length,
      learners: rows.length,
      activeTrials: rows.filter((r) => r.status === "trial").length,
      paid: rows.filter((r) => r.status === "paid").length,
      expiredTrials: rows.filter((r) => r.status === "trial_expired").length,
      credentials: certs.length,
      completed: rows.filter((r) => r.percent >= 100).length,
    };
    res.json({ stats, rows });
  } catch (e) {
    console.error("admin overview:", e.message);
    res.status(500).json({ error: "Could not load admin data." });
  }
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

store.connect()
  .then(() => app.listen(PORT, () => console.log(`Learnable running on ${APP_URL}`)))
  .catch((e) => { console.error("Could not connect to MongoDB:", e.message); process.exit(1); });

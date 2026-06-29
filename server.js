// server.js — Learnable API + static frontend.
require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const PROD = process.env.NODE_ENV === "production";

// Pricing (subunits are computed as PRICE * 100). Set currency to match your Paystack account.
const PRICE = Number(process.env.PRICE || 35);
const CURRENCY = process.env.PAYSTACK_CURRENCY || "ZAR";

// Claude
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";

// Paystack
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

if (!ANTHROPIC_KEY) console.warn("[warn] ANTHROPIC_API_KEY not set — using sample fallbacks for program/CV generation.");
if (!PAYSTACK_SECRET) console.warn("[warn] PAYSTACK_SECRET_KEY not set — enrollment will simulate a successful payment (dev mode).");
if (!process.env.JWT_SECRET) console.warn("[warn] JWT_SECRET not set — using an ephemeral secret (sessions reset on restart).");

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

/* ----------------------------- helpers ----------------------------- */
function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "30d" });
}
function setAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true, sameSite: "lax", secure: PROD, maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}
function currentUser(req) {
  const t = req.cookies?.token;
  if (!t) return null;
  try { return jwt.verify(t, JWT_SECRET); } catch { return null; }
}
function requireAuth(req, res, next) {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: "Please sign in." });
  req.user = u; next();
}
function credId() {
  const s = () => crypto.randomBytes(2).toString("hex").toUpperCase();
  return `LRN-${s()}-${s()}`;
}
function rowProgram(r) {
  return {
    id: r.id, goal: r.goal, why: r.why, title: r.title, subtitle: r.subtitle,
    level: r.level, totalHours: r.total_hours, summary: r.summary,
    skills: JSON.parse(r.skills || "[]"), modules: JSON.parse(r.modules || "[]"),
    capstone: JSON.parse(r.capstone || "{}"),
  };
}
async function generateJSON(prompt, fallback) {
  if (!anthropic) return fallback;
  const msg = await anthropic.messages.create({
    model: MODEL, max_tokens: 1800, messages: [{ role: "user", content: prompt }],
  });
  const text = (msg.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  return JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
}

/* ----------------------------- auth ----------------------------- */
app.post("/api/auth/signup", (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: "Name, email, and password are required." });
  if (String(password).length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
  const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(String(email).toLowerCase());
  if (exists) return res.status(409).json({ error: "That email already has an account. Try signing in." });
  const hash = bcrypt.hashSync(String(password), 10);
  const info = db.prepare("INSERT INTO users (name,email,password_hash) VALUES (?,?,?)")
    .run(name, String(email).toLowerCase(), hash);
  const user = { id: info.lastInsertRowid, name, email: String(email).toLowerCase() };
  setAuthCookie(res, signToken(user));
  res.json({ user });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const u = db.prepare("SELECT * FROM users WHERE email = ?").get(String(email || "").toLowerCase());
  if (!u || !bcrypt.compareSync(String(password || ""), u.password_hash))
    return res.status(401).json({ error: "Wrong email or password." });
  const user = { id: u.id, name: u.name, email: u.email };
  setAuthCookie(res, signToken(user));
  res.json({ user });
});

app.post("/api/auth/logout", (req, res) => { res.clearCookie("token"); res.json({ ok: true }); });
app.get("/api/auth/me", (req, res) => res.json({ user: currentUser(req) }));

/* ----------------------------- programs (Claude) ----------------------------- */
app.post("/api/programs", async (req, res) => {
  const { goal, why } = req.body || {};
  if (!goal || !String(goal).trim()) return res.status(400).json({ error: "Tell us what you want to master." });
  const user = currentUser(req);
  const prompt = `You design a premium micro-credential program. The learner wants to master: "${goal}". Their reason: "${why || "career growth"}".
Return ONLY minified JSON (no markdown): {"title":"program name, <8 words","subtitle":"one compelling line, <14 words","level":"Foundational|Professional|Advanced","totalHours":<int 8-40>,"summary":"2 sentences on what they'll be able to do","skills":["6 concrete, resume-ready skills"],"modules":[{"title":"...","hours":<int>,"lessons":["3 short lesson titles"]}],"capstone":{"title":"...","description":"1-2 sentences, a deliverable tied to their reason"}}
Exactly 5 modules. Keep strings tight.`;
  const fallback = {
    title: `Foundations of ${String(goal).slice(0, 40)}`,
    subtitle: "A focused, build-something path from zero to credentialed.",
    level: "Professional", totalHours: 20,
    summary: "You'll gain working command of the core concepts and finish with a deliverable you can show. Tailored to your stated goal.",
    skills: ["Core concepts", "Practical application", "Tooling", "Analysis", "Communication", "A finished capstone"],
    modules: [1, 2, 3, 4, 5].map((n) => ({ title: `Module ${n}`, hours: 4, lessons: ["Lesson A", "Lesson B", "Lesson C"] })),
    capstone: { title: "Your capstone", description: "A real deliverable tied directly to why you started learning this." },
  };
  try {
    const p = await generateJSON(prompt, fallback);
    const info = db.prepare(`INSERT INTO programs (user_id,goal,why,title,subtitle,level,total_hours,summary,skills,modules,capstone)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
      user?.id ?? null, goal, why || null, p.title, p.subtitle, p.level, p.totalHours, p.summary,
      JSON.stringify(p.skills || []), JSON.stringify(p.modules || []), JSON.stringify(p.capstone || {})
    );
    res.json({ program: { id: info.lastInsertRowid, ...p, goal, why } });
  } catch (e) {
    console.error("generate program failed:", e.message);
    res.status(502).json({ error: "Couldn't generate the program. Please try again." });
  }
});

app.get("/api/programs", requireAuth, (req, res) => {
  const rows = db.prepare("SELECT * FROM programs WHERE user_id = ? ORDER BY id DESC").all(req.user.id);
  res.json({ programs: rows.map(rowProgram) });
});

app.get("/api/programs/:id", (req, res) => {
  const r = db.prepare("SELECT * FROM programs WHERE id = ?").get(req.params.id);
  if (!r) return res.status(404).json({ error: "Program not found." });
  res.json({ program: rowProgram(r) });
});

app.post("/api/programs/:id/cv", async (req, res) => {
  const r = db.prepare("SELECT * FROM programs WHERE id = ?").get(req.params.id);
  if (!r) return res.status(404).json({ error: "Program not found." });
  const p = rowProgram(r);
  const prompt = `A learner completed a credential in "${p.title}" (skills: ${(p.skills || []).join(", ")}). Reason: "${p.why || "career growth"}".
Return ONLY minified JSON: {"headline":"one-line resume positioning statement","bullets":["4 achievement resume bullets, strong verbs"],"linkedin":"2-sentence first-person LinkedIn About"}`;
  const fallback = {
    headline: `${p.title} — credentialed and capstone-proven`,
    bullets: ["Completed a structured program and shipped a real capstone deliverable.",
      "Built working command of " + (p.skills || []).slice(0, 3).join(", ") + ".",
      "Applied new skills directly to a self-directed project.",
      "Earned a verifiable credential demonstrating finished, independent work."],
    linkedin: `I recently earned a credential in ${p.title}. I put it to work straight away on a hands-on capstone.`,
  };
  try { res.json({ cv: await generateJSON(prompt, fallback) }); }
  catch (e) { console.error("cv failed:", e.message); res.status(502).json({ error: "Couldn't generate CV content. Try again." }); }
});

/* ----------------------------- enrollment + payments ----------------------------- */
function issueCertificate(user, program) {
  const id = credId();
  db.prepare(`INSERT INTO certificates (cred_id,user_id,program_id,name,program_title,skills) VALUES (?,?,?,?,?,?)`)
    .run(id, user.id, program.id, user.name, program.title, JSON.stringify(program.skills || []));
  return id;
}

app.post("/api/programs/:id/enroll", requireAuth, async (req, res) => {
  const r = db.prepare("SELECT * FROM programs WHERE id = ?").get(req.params.id);
  if (!r) return res.status(404).json({ error: "Program not found." });
  const program = rowProgram(r);
  const amountMinor = Math.round(PRICE * 100);

  // Dev mode: no Paystack key -> simulate a paid enrollment and issue the certificate immediately.
  if (!PAYSTACK_SECRET) {
    db.prepare("INSERT INTO enrollments (user_id,program_id,status,amount,currency,reference) VALUES (?,?,?,?,?,?)")
      .run(req.user.id, program.id, "paid", amountMinor, CURRENCY, "dev-" + Date.now());
    const fullUser = db.prepare("SELECT id,name FROM users WHERE id = ?").get(req.user.id);
    const cred = issueCertificate(fullUser, program);
    return res.json({ devPaid: true, credId: cred });
  }

  // Production: initialize a Paystack transaction and hand back the checkout URL.
  try {
    const reference = "lrn_" + crypto.randomBytes(8).toString("hex");
    db.prepare("INSERT INTO enrollments (user_id,program_id,status,amount,currency,reference) VALUES (?,?,?,?,?,?)")
      .run(req.user.id, program.id, "pending", amountMinor, CURRENCY, reference);
    const init = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: req.user.email, amount: amountMinor, currency: CURRENCY, reference,
        callback_url: `${APP_URL}/?reference=${reference}`,
        metadata: { program_id: program.id, user_id: req.user.id },
      }),
    });
    const data = await init.json();
    if (!data.status) return res.status(502).json({ error: data.message || "Could not start payment." });
    res.json({ authorization_url: data.data.authorization_url, reference });
  } catch (e) {
    console.error("paystack init failed:", e.message);
    res.status(502).json({ error: "Could not start payment. Try again." });
  }
});

// Called by the frontend after Paystack redirects back with ?reference=...
app.get("/api/payments/verify", requireAuth, async (req, res) => {
  const reference = req.query.reference;
  if (!reference) return res.status(400).json({ error: "Missing reference." });
  const enr = db.prepare("SELECT * FROM enrollments WHERE reference = ?").get(reference);
  if (!enr) return res.status(404).json({ error: "Enrollment not found." });
  if (enr.status === "paid") {
    const cert = db.prepare("SELECT cred_id FROM certificates WHERE program_id = ? AND user_id = ? ORDER BY rowid DESC")
      .get(enr.program_id, enr.user_id);
    return res.json({ paid: true, credId: cert?.cred_id });
  }
  if (!PAYSTACK_SECRET) return res.status(400).json({ error: "Payments not configured." });
  try {
    const v = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const data = await v.json();
    if (data.status && data.data.status === "success") {
      db.prepare("UPDATE enrollments SET status='paid' WHERE reference = ?").run(reference);
      const program = rowProgram(db.prepare("SELECT * FROM programs WHERE id = ?").get(enr.program_id));
      const user = db.prepare("SELECT id,name FROM users WHERE id = ?").get(enr.user_id);
      const cred = issueCertificate(user, program);
      return res.json({ paid: true, credId: cred });
    }
    res.json({ paid: false });
  } catch (e) {
    console.error("paystack verify failed:", e.message);
    res.status(502).json({ error: "Could not verify payment." });
  }
});

// Paystack webhook (optional but recommended for reliability).
app.post("/api/payments/webhook", express.raw({ type: "*/*" }), (req, res) => {
  if (!PAYSTACK_SECRET) return res.sendStatus(200);
  const sig = crypto.createHmac("sha512", PAYSTACK_SECRET).update(req.body).digest("hex");
  if (sig !== req.headers["x-paystack-signature"]) return res.sendStatus(401);
  const event = JSON.parse(req.body.toString());
  if (event.event === "charge.success") {
    const ref = event.data.reference;
    const enr = db.prepare("SELECT * FROM enrollments WHERE reference = ?").get(ref);
    if (enr && enr.status !== "paid") {
      db.prepare("UPDATE enrollments SET status='paid' WHERE reference = ?").run(ref);
      const program = rowProgram(db.prepare("SELECT * FROM programs WHERE id = ?").get(enr.program_id));
      const user = db.prepare("SELECT id,name FROM users WHERE id = ?").get(enr.user_id);
      const exists = db.prepare("SELECT cred_id FROM certificates WHERE program_id=? AND user_id=?").get(enr.program_id, enr.user_id);
      if (!exists) issueCertificate(user, program);
    }
  }
  res.sendStatus(200);
});

/* ----------------------------- certificates ----------------------------- */
app.get("/api/certificates", requireAuth, (req, res) => {
  const rows = db.prepare("SELECT * FROM certificates WHERE user_id = ? ORDER BY issued_at DESC").all(req.user.id);
  res.json({ certificates: rows.map((c) => ({ credId: c.cred_id, name: c.name, programTitle: c.program_title, skills: JSON.parse(c.skills || "[]"), issuedAt: c.issued_at })) });
});

// Public verification — no auth. This is what employers hit.
app.get("/api/verify/:credId", (req, res) => {
  const c = db.prepare("SELECT * FROM certificates WHERE cred_id = ?").get(req.params.credId);
  if (!c) return res.json({ valid: false });
  res.json({ valid: true, name: c.name, programTitle: c.program_title, skills: JSON.parse(c.skills || "[]"), issuedAt: c.issued_at });
});

/* ----------------------------- SPA fallback ----------------------------- */
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`Learnable running on ${APP_URL}`));

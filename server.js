// server.js — Learnable API + static frontend (course player, AI tutor, study tracking, Dodo Payments).
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
const PRICE = Number(process.env.PRICE || 35);

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";

// ---- Dodo Payments ----
const DODO_KEY = process.env.DODO_PAYMENTS_API_KEY;
const DODO_PRODUCT_ID = process.env.DODO_PRODUCT_ID;
const DODO_WEBHOOK_SECRET = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;
const DODO_BASE = process.env.DODO_MODE === "live" ? "https://live.dodopayments.com" : "https://test.dodopayments.com";
const DODO_COUNTRY = process.env.DODO_COUNTRY || "ZA";

// Study rule
const STUDY_MINUTES_REQUIRED = Number(process.env.STUDY_MINUTES_REQUIRED || 30);
const STUDY_PERIOD_DAYS = Number(process.env.STUDY_PERIOD_DAYS || 14);

if (!ANTHROPIC_KEY) console.warn("[warn] ANTHROPIC_API_KEY not set — using sample fallbacks.");
if (!DODO_KEY || !DODO_PRODUCT_ID) console.warn("[warn] Dodo not fully configured — enrollment runs in DEV MODE (simulated payment).");

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

/* ----------------------------- helpers ----------------------------- */
const signToken = (u) => jwt.sign({ id: u.id, email: u.email, name: u.name }, JWT_SECRET, { expiresIn: "30d" });
const setAuthCookie = (res, t) => res.cookie("token", t, { httpOnly: true, sameSite: "lax", secure: PROD, maxAge: 2592000000 });
function currentUser(req) { const t = req.cookies?.token; if (!t) return null; try { return jwt.verify(t, JWT_SECRET); } catch { return null; } }
function requireAuth(req, res, next) { const u = currentUser(req); if (!u) return res.status(401).json({ error: "Please sign in." }); req.user = u; next(); }
function credId() { const s = () => crypto.randomBytes(2).toString("hex").toUpperCase(); return `LRN-${s()}-${s()}`; }
function fullUser(id) {
  const u = db.prepare("SELECT id,name,email,avatar,headline,education,linkedin,alumni_visible FROM users WHERE id=?").get(Number(id));
  if (!u) return null;
  return { id: Number(u.id), name: u.name, email: u.email, avatar: u.avatar || null,
    headline: u.headline || "", education: u.education || "", linkedin: u.linkedin || "", alumniVisible: !!u.alumni_visible };
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
function getPaidEnrollment(userId, programId) {
  return db.prepare("SELECT * FROM enrollments WHERE user_id=? AND program_id=? AND status='paid' ORDER BY id DESC").get(userId, programId);
}

/* ----------------------------- auth ----------------------------- */
app.post("/api/auth/signup", (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: "Name, email, and password are required." });
  if (String(password).length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
  if (db.prepare("SELECT id FROM users WHERE email=?").get(String(email).toLowerCase()))
    return res.status(409).json({ error: "That email already has an account. Try signing in." });
  const info = db.prepare("INSERT INTO users (name,email,password_hash) VALUES (?,?,?)")
    .run(name, String(email).toLowerCase(), bcrypt.hashSync(String(password), 10));
  const user = fullUser(Number(info.lastInsertRowid));
  setAuthCookie(res, signToken(user)); res.json({ user });
});
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const u = db.prepare("SELECT * FROM users WHERE email=?").get(String(email || "").toLowerCase());
  if (!u || !bcrypt.compareSync(String(password || ""), u.password_hash)) return res.status(401).json({ error: "Wrong email or password." });
  const user = fullUser(u.id);
  setAuthCookie(res, signToken(user)); res.json({ user });
});
app.post("/api/auth/logout", (req, res) => { res.clearCookie("token"); res.json({ ok: true }); });
app.get("/api/auth/me", (req, res) => { const u = currentUser(req); res.json({ user: u ? fullUser(u.id) : null }); });

// Update profile (name, avatar, education, LinkedIn, alumni visibility).
app.put("/api/profile", requireAuth, (req, res) => {
  const { name, avatar, headline, education, linkedin, alumniVisible } = req.body || {};
  if (avatar && String(avatar).length > 350000) return res.status(400).json({ error: "That image is too large. Please use a smaller photo." });
  if (linkedin && !/^https?:\/\//i.test(linkedin)) return res.status(400).json({ error: "LinkedIn must be a full URL (https://...)." });
  const cur = fullUser(req.user.id);
  db.prepare("UPDATE users SET name=?, avatar=?, headline=?, education=?, linkedin=?, alumni_visible=? WHERE id=?")
    .run(name ?? cur.name, avatar ?? cur.avatar, headline ?? cur.headline, education ?? cur.education,
      linkedin ?? cur.linkedin, alumniVisible === undefined ? (cur.alumniVisible ? 1 : 0) : (alumniVisible ? 1 : 0), req.user.id);
  res.json({ user: fullUser(req.user.id) });
});

// Alumni directory — credentialed, visible members. A core paid benefit.
app.get("/api/alumni", requireAuth, (req, res) => {
  const skill = (req.query.skill || "").toString().toLowerCase().trim();
  const rows = db.prepare(`SELECT u.id,u.name,u.avatar,u.headline,u.education,u.linkedin,c.program_title,c.skills,c.issued_at
    FROM users u JOIN certificates c ON c.user_id=u.id WHERE u.alumni_visible=1 ORDER BY c.issued_at DESC`).all();
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.id)) map.set(r.id, { id: Number(r.id), name: r.name, avatar: r.avatar || null,
      headline: r.headline || "", education: r.education || "", linkedin: r.linkedin || "", credentials: [] });
    map.get(r.id).credentials.push({ programTitle: r.program_title, skills: JSON.parse(r.skills || "[]") });
  }
  let list = [...map.values()];
  if (skill) list = list.filter((a) => a.credentials.some((c) =>
    c.programTitle.toLowerCase().includes(skill) || (c.skills || []).some((s) => s.toLowerCase().includes(skill))));
  res.json({ alumni: list.slice(0, 80), total: list.length });
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
    const info = db.prepare(`INSERT INTO programs (user_id,goal,why,title,subtitle,level,total_hours,summary,skills,modules,capstone) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(user?.id ?? null, goal, why || null, p.title, p.subtitle, p.level, p.totalHours, p.summary,
        JSON.stringify(p.skills || []), JSON.stringify(p.modules || []), JSON.stringify(p.capstone || {}));
    res.json({ program: { id: Number(info.lastInsertRowid), ...p, goal, why } });
  } catch (e) { console.error("generate program:", e.message); res.status(502).json({ error: "Couldn't generate the program. Please try again." }); }
});
app.get("/api/programs", requireAuth, (req, res) =>
  res.json({ programs: db.prepare("SELECT * FROM programs WHERE user_id=? ORDER BY id DESC").all(req.user.id).map(rowProgram) }));
app.get("/api/programs/:id", (req, res) => {
  const r = db.prepare("SELECT * FROM programs WHERE id=?").get(req.params.id);
  if (!r) return res.status(404).json({ error: "Program not found." });
  res.json({ program: rowProgram(r) });
});
app.post("/api/programs/:id/cv", async (req, res) => {
  const r = db.prepare("SELECT * FROM programs WHERE id=?").get(req.params.id);
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
function issueCertificate(user, program) {
  const existing = db.prepare("SELECT cred_id FROM certificates WHERE user_id=? AND program_id=?").get(user.id, program.id);
  if (existing) return existing.cred_id;
  const id = credId();
  db.prepare("INSERT INTO certificates (cred_id,user_id,program_id,name,program_title,skills) VALUES (?,?,?,?,?,?)")
    .run(id, user.id, program.id, user.name, program.title, JSON.stringify(program.skills || []));
  return id;
}
function activateEnrollment(userId, programId, reference, paymentId) {
  const now = new Date().toISOString();
  const existing = db.prepare("SELECT id FROM enrollments WHERE reference=?").get(reference);
  if (existing) db.prepare("UPDATE enrollments SET status='paid', period_start=?, course_status='active', payment_id=? WHERE id=?").run(now, paymentId || null, existing.id);
  else db.prepare("INSERT INTO enrollments (user_id,program_id,status,amount,currency,reference,payment_id,period_start,course_status) VALUES (?,?,?,?,?,?,?,?, 'active')")
    .run(userId, programId, "paid", Math.round(PRICE * 100), "USD", reference, paymentId || null, now);
}

app.post("/api/programs/:id/enroll", requireAuth, async (req, res) => {
  const r = db.prepare("SELECT * FROM programs WHERE id=?").get(req.params.id);
  if (!r) return res.status(404).json({ error: "Program not found." });
  const program = rowProgram(r);
  if (getPaidEnrollment(req.user.id, program.id)) return res.json({ alreadyEnrolled: true });
  const reference = "lrn_" + crypto.randomBytes(8).toString("hex");

  if (!DODO_KEY || !DODO_PRODUCT_ID) { // DEV MODE
    activateEnrollment(req.user.id, program.id, reference, "dev");
    return res.json({ devPaid: true });
  }
  try {
    db.prepare("INSERT INTO enrollments (user_id,program_id,status,amount,currency,reference) VALUES (?,?,?,?,?,?)")
      .run(req.user.id, program.id, "pending", Math.round(PRICE * 100), "USD", reference);
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
    const data = await r2.json();
    if (!r2.ok || !data.payment_link) { console.error("dodo create:", data); return res.status(502).json({ error: "Could not start payment." }); }
    db.prepare("UPDATE enrollments SET payment_id=? WHERE reference=?").run(data.payment_id || null, reference);
    res.json({ checkout_url: data.payment_link, reference });
  } catch (e) { console.error("dodo enroll:", e.message); res.status(502).json({ error: "Could not start payment. Try again." }); }
});

// Called when Dodo redirects back to ?ref=...
app.get("/api/payments/verify", requireAuth, async (req, res) => {
  const ref = req.query.ref;
  const enr = db.prepare("SELECT * FROM enrollments WHERE reference=?").get(ref);
  if (!enr) return res.status(404).json({ error: "Enrollment not found." });
  if (enr.status === "paid") return res.json({ paid: true });
  if (!DODO_KEY) return res.status(400).json({ error: "Payments not configured." });
  try {
    const v = await fetch(`${DODO_BASE}/payments/${enr.payment_id}`, { headers: { Authorization: `Bearer ${DODO_KEY}` } });
    const data = await v.json();
    const ok = (data.status || "").toLowerCase() === "succeeded";
    if (ok) { activateEnrollment(enr.user_id, enr.program_id, ref, enr.payment_id); return res.json({ paid: true }); }
    res.json({ paid: false });
  } catch (e) { console.error("dodo verify:", e.message); res.status(502).json({ error: "Could not verify payment." }); }
});

// Dodo webhook (Standard Webhooks signature). Optional but recommended.
app.post("/api/payments/webhook", express.raw({ type: "*/*" }), (req, res) => {
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
        activateEnrollment(Number(meta.user_id), Number(meta.program_id), meta.reference, evt.data?.payment_id);
    }
    res.sendStatus(200);
  } catch (e) { console.error("webhook:", e.message); res.sendStatus(200); }
});

/* ----------------------------- COURSE (enrolled only) ----------------------------- */
function computeCourseState(enr) {
  // Roll / pause the 2-week study window.
  const now = Date.now();
  let { period_start, minutes_period, course_status } = enr;
  const start = period_start ? new Date(period_start).getTime() : now;
  const daysIn = (now - start) / 86400000;
  let status = course_status || "active";
  if (minutes_period >= STUDY_MINUTES_REQUIRED && daysIn >= STUDY_PERIOD_DAYS) {
    // met the requirement and the window elapsed -> start a fresh window
    db.prepare("UPDATE enrollments SET period_start=?, minutes_period=0, course_status='active' WHERE id=?").run(new Date().toISOString(), enr.id);
    return { status: "active", minutes: 0, required: STUDY_MINUTES_REQUIRED, daysLeft: STUDY_PERIOD_DAYS };
  }
  if (minutes_period < STUDY_MINUTES_REQUIRED && daysIn >= STUDY_PERIOD_DAYS) {
    status = "paused";
    if (course_status !== "paused") db.prepare("UPDATE enrollments SET course_status='paused' WHERE id=?").run(enr.id);
  }
  return { status, minutes: minutes_period, required: STUDY_MINUTES_REQUIRED, daysLeft: Math.max(0, Math.ceil(STUDY_PERIOD_DAYS - daysIn)) };
}

app.get("/api/courses/:id/state", requireAuth, (req, res) => {
  const r = db.prepare("SELECT * FROM programs WHERE id=?").get(req.params.id);
  if (!r) return res.status(404).json({ error: "Program not found." });
  const program = rowProgram(r);
  const enr = getPaidEnrollment(req.user.id, program.id);
  if (!enr) return res.json({ enrolled: false, program });
  const study = computeCourseState(enr);
  const prog = db.prepare("SELECT lesson_key,completed,quiz_score FROM progress WHERE user_id=? AND program_id=?").all(req.user.id, program.id);
  const done = new Set(prog.filter((p) => p.completed).map((p) => p.lesson_key));
  let total = 0; (program.modules || []).forEach((m, mi) => (m.lessons || []).forEach((_, li) => { total++; }));
  const capstoneDone = done.has("capstone");
  const lessonsDone = [...done].filter((k) => k !== "capstone").length;
  const allDone = lessonsDone >= total && capstoneDone;
  let cred = null;
  if (allDone) { const u = db.prepare("SELECT id,name FROM users WHERE id=?").get(req.user.id); cred = issueCertificate(u, program); }
  res.json({ enrolled: true, program, study, completed: [...done], total, lessonsDone, capstoneDone, allDone, credId: cred });
});

app.post("/api/courses/:id/lesson", requireAuth, async (req, res) => {
  const { moduleIdx, lessonIdx } = req.body || {};
  const r = db.prepare("SELECT * FROM programs WHERE id=?").get(req.params.id);
  if (!r) return res.status(404).json({ error: "Program not found." });
  const program = rowProgram(r);
  if (!getPaidEnrollment(req.user.id, program.id)) return res.status(403).json({ error: "Enroll to access lessons." });
  const key = `${moduleIdx}-${lessonIdx}`;
  const cached = db.prepare("SELECT content FROM lesson_content WHERE program_id=? AND lesson_key=?").get(program.id, key);
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
    db.prepare("INSERT OR REPLACE INTO lesson_content (program_id,lesson_key,content) VALUES (?,?,?)").run(program.id, key, JSON.stringify(lesson));
    res.json({ lesson });
  } catch (e) { console.error("lesson:", e.message); res.status(502).json({ error: "Couldn't load this lesson. Try again." }); }
});

app.post("/api/courses/:id/progress", requireAuth, (req, res) => {
  const { lessonKey, quizScore } = req.body || {};
  if (!getPaidEnrollment(req.user.id, req.params.id)) return res.status(403).json({ error: "Not enrolled." });
  db.prepare("INSERT OR REPLACE INTO progress (user_id,program_id,lesson_key,completed,quiz_score,updated_at) VALUES (?,?,?,1,?,datetime('now'))")
    .run(req.user.id, Number(req.params.id), String(lessonKey), quizScore ?? null);
  res.json({ ok: true });
});

// Study heartbeat: +1 minute of study time toward the current window.
app.post("/api/courses/:id/heartbeat", requireAuth, (req, res) => {
  const enr = getPaidEnrollment(req.user.id, req.params.id);
  if (!enr) return res.status(403).json({ error: "Not enrolled." });
  const now = new Date().toISOString();
  let mins = (enr.minutes_period || 0) + 1;
  let status = enr.course_status;
  // Completing a catch-up session reactivates a paused course and starts a fresh window.
  if (status === "paused" && mins >= STUDY_MINUTES_REQUIRED) {
    db.prepare("UPDATE enrollments SET minutes_period=0, period_start=?, course_status='active', last_active=? WHERE id=?").run(now, now, enr.id);
    return res.json({ minutes: 0, status: "active", required: STUDY_MINUTES_REQUIRED });
  }
  db.prepare("UPDATE enrollments SET minutes_period=?, last_active=? WHERE id=?").run(mins, now, enr.id);
  res.json({ minutes: mins, status, required: STUDY_MINUTES_REQUIRED });
});

// AI tutor.
app.post("/api/courses/:id/tutor", requireAuth, async (req, res) => {
  const { messages, lessonTitle } = req.body || {};
  const r = db.prepare("SELECT * FROM programs WHERE id=?").get(req.params.id);
  if (!r) return res.status(404).json({ error: "Program not found." });
  const program = rowProgram(r);
  if (!getPaidEnrollment(req.user.id, program.id)) return res.status(403).json({ error: "Enroll to use the tutor." });
  if (!anthropic) return res.json({ reply: "The AI tutor needs an ANTHROPIC_API_KEY configured on the server. Once it's set, I'll answer your questions about this lesson." });
  try {
    const system = `You are a patient, encouraging tutor helping a learner master "${program.goal}".${lessonTitle ? ` They are on the lesson "${lessonTitle}".` : ""} Keep replies concise and concrete. Use plain language, small examples, and ask a guiding question when it helps them think. Never do their capstone for them — coach instead.`;
    const msg = await anthropic.messages.create({ model: MODEL, max_tokens: 700, system,
      messages: (messages || []).slice(-12).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 2000) })) });
    res.json({ reply: (msg.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n") });
  } catch (e) { console.error("tutor:", e.message); res.status(502).json({ error: "The tutor is unavailable right now. Try again." }); }
});

app.post("/api/courses/:id/capstone", requireAuth, (req, res) => {
  if (!getPaidEnrollment(req.user.id, req.params.id)) return res.status(403).json({ error: "Not enrolled." });
  db.prepare("INSERT OR REPLACE INTO progress (user_id,program_id,lesson_key,completed,updated_at) VALUES (?,?,?,1,datetime('now'))")
    .run(req.user.id, Number(req.params.id), "capstone");
  res.json({ ok: true });
});

/* ----------------------------- certificates ----------------------------- */
app.get("/api/certificates", requireAuth, (req, res) =>
  res.json({ certificates: db.prepare("SELECT * FROM certificates WHERE user_id=? ORDER BY issued_at DESC").all(req.user.id)
    .map((c) => ({ credId: c.cred_id, name: c.name, programTitle: c.program_title, skills: JSON.parse(c.skills || "[]"), issuedAt: c.issued_at })) }));
app.get("/api/verify/:credId", (req, res) => {
  const c = db.prepare("SELECT * FROM certificates WHERE cred_id=?").get(req.params.credId);
  if (!c) return res.json({ valid: false });
  res.json({ valid: true, name: c.name, programTitle: c.program_title, skills: JSON.parse(c.skills || "[]"), issuedAt: c.issued_at });
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`Learnable running on ${APP_URL}`));

// db.js — uses Node's built-in SQLite (node:sqlite). No native build step, so deploys can't
// fail on a compiler error the way better-sqlite3 did. Requires Node 22.5+.
const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "learnable.db");
const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  avatar TEXT, headline TEXT, education TEXT, linkedin TEXT,
  alumni_visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER, goal TEXT NOT NULL, why TEXT,
  title TEXT, subtitle TEXT, level TEXT, total_hours INTEGER, summary TEXT,
  skills TEXT, modules TEXT, capstone TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL, program_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  amount INTEGER, currency TEXT, reference TEXT, payment_id TEXT,
  period_start TEXT, minutes_period INTEGER NOT NULL DEFAULT 0,
  last_active TEXT, course_status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS progress (
  user_id INTEGER NOT NULL, program_id INTEGER NOT NULL, lesson_key TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 1, quiz_score INTEGER,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, program_id, lesson_key)
);
CREATE TABLE IF NOT EXISTS lesson_content (
  program_id INTEGER NOT NULL, lesson_key TEXT NOT NULL, content TEXT NOT NULL,
  PRIMARY KEY (program_id, lesson_key)
);
CREATE TABLE IF NOT EXISTS certificates (
  cred_id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, program_id INTEGER NOT NULL,
  name TEXT NOT NULL, program_title TEXT NOT NULL, skills TEXT,
  issued_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// migrations for older DBs (ignore "duplicate column")
for (const sql of [
  "ALTER TABLE users ADD COLUMN avatar TEXT",
  "ALTER TABLE users ADD COLUMN headline TEXT",
  "ALTER TABLE users ADD COLUMN education TEXT",
  "ALTER TABLE users ADD COLUMN linkedin TEXT",
  "ALTER TABLE users ADD COLUMN alumni_visible INTEGER NOT NULL DEFAULT 1",
  "ALTER TABLE enrollments ADD COLUMN payment_id TEXT",
  "ALTER TABLE enrollments ADD COLUMN period_start TEXT",
  "ALTER TABLE enrollments ADD COLUMN minutes_period INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE enrollments ADD COLUMN last_active TEXT",
  "ALTER TABLE enrollments ADD COLUMN course_status TEXT NOT NULL DEFAULT 'active'",
]) { try { db.exec(sql); } catch (e) {} }

module.exports = db;

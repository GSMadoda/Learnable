// db.js — SQLite via better-sqlite3. Zero external setup; the file is created on first run.
// For production persistence on Render, attach a Persistent Disk and point DB_PATH at it,
// or swap this layer for Postgres (see README "Scaling up").
const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "learnable.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  goal TEXT NOT NULL,
  why TEXT,
  title TEXT, subtitle TEXT, level TEXT, total_hours INTEGER, summary TEXT,
  skills TEXT, modules TEXT, capstone TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  program_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | paid
  amount INTEGER, currency TEXT, reference TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS certificates (
  cred_id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  program_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  program_title TEXT NOT NULL,
  skills TEXT,
  issued_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

module.exports = db;

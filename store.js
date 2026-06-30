// store.js — MongoDB data layer for Learnable.
// Keeps integer IDs (via an auto-increment "counters" collection) so the rest of the app and the
// frontend are unchanged — only the storage mechanics differ from the old SQLite version.
const { MongoClient } = require("mongodb");

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "learnable";

const store = { ready: false };
let client;

store.connect = async function connect() {
  let db;
  if (process.env.MONGO_MEMORY === "1") {
    // local testing only — no Atlas needed
    db = require("./mongo_mock").makeMemoryDb();
  } else {
    if (!URI) throw new Error("MONGODB_URI is not set. Add your MongoDB Atlas connection string.");
    client = new MongoClient(URI, { maxPoolSize: 10 });
    await client.connect();
    db = client.db(DB_NAME);
  }

  store.users = db.collection("users");
  store.programs = db.collection("programs");
  store.enrollments = db.collection("enrollments");
  store.progress = db.collection("progress");
  store.lesson_content = db.collection("lesson_content");
  store.certificates = db.collection("certificates");
  store.counters = db.collection("counters");

  // Indexes (idempotent). Unique where the old SQLite schema had a primary/unique key.
  await store.users.createIndex({ id: 1 }, { unique: true });
  await store.users.createIndex({ email: 1 }, { unique: true });
  await store.programs.createIndex({ id: 1 }, { unique: true });
  await store.programs.createIndex({ user_id: 1 });
  await store.enrollments.createIndex({ id: 1 }, { unique: true });
  await store.enrollments.createIndex({ reference: 1 });
  await store.enrollments.createIndex({ user_id: 1, program_id: 1 });
  await store.progress.createIndex({ user_id: 1, program_id: 1, lesson_key: 1 }, { unique: true });
  await store.lesson_content.createIndex({ program_id: 1, lesson_key: 1 }, { unique: true });
  await store.certificates.createIndex({ cred_id: 1 }, { unique: true });
  await store.certificates.createIndex({ user_id: 1 });

  store.ready = true;
  return store;
};

// Atomic-ish auto-increment to mint sequential integer IDs (users:1, programs:1, ...).
store.nextId = async function nextId(name) {
  await store.counters.updateOne({ _id: name }, { $inc: { seq: 1 } }, { upsert: true });
  const doc = await store.counters.findOne({ _id: name });
  return doc.seq;
};

store.close = async function close() { if (client) await client.close(); };

module.exports = store;

// mongo_mock.js — a tiny in-memory stand-in for the MongoDB driver, used ONLY for local testing
// (set MONGO_MEMORY=1). It implements the exact subset of the driver API that store.js/server.js use:
//   findOne, find().sort().toArray(), insertOne, updateOne ($set/$inc, upsert), createIndex (no-op).
// Filters support equality and { field: { $in: [...] } }. This file is never used in production —
// when MONGODB_URI is set the app talks to real MongoDB Atlas through the official driver.
const clone = (v) => (typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v)));

function matches(doc, filter) {
  for (const k of Object.keys(filter)) {
    const cond = filter[k];
    if (cond && typeof cond === "object" && !Array.isArray(cond) && "$in" in cond) {
      if (!cond.$in.some((v) => doc[k] === v)) return false;
    } else if (doc[k] !== cond) {
      return false;
    }
  }
  return true;
}

function applyUpdate(doc, update) {
  if (update.$set) for (const [k, v] of Object.entries(update.$set)) doc[k] = v;
  if (update.$inc) for (const [k, v] of Object.entries(update.$inc)) doc[k] = (doc[k] || 0) + v;
  return doc;
}

class Cursor {
  constructor(docs) { this._docs = docs; }
  sort(spec) {
    const [field, dir] = Object.entries(spec)[0];
    this._docs.sort((a, b) => {
      const x = a[field], y = b[field];
      if (x === y) return 0;
      if (x === undefined || x === null) return 1;
      if (y === undefined || y === null) return -1;
      return (x < y ? -1 : 1) * (dir < 0 ? -1 : 1);
    });
    return this;
  }
  async toArray() { return this._docs.map(clone); }
}

class Collection {
  constructor() { this.docs = []; }
  async findOne(filter = {}) { const d = this.docs.find((x) => matches(x, filter)); return d ? clone(d) : null; }
  find(filter = {}) { return new Cursor(this.docs.filter((x) => matches(x, filter)).map(clone)); }
  async insertOne(doc) { const c = clone(doc); this.docs.push(c); return { acknowledged: true, insertedId: c._id ?? c.id ?? null }; }
  async updateOne(filter, update, opts = {}) {
    const found = this.docs.find((x) => matches(x, filter));
    if (found) { applyUpdate(found, update); return { matchedCount: 1, modifiedCount: 1, upsertedId: null, upsertedCount: 0 }; }
    if (opts.upsert) {
      const base = {};
      for (const k of Object.keys(filter)) if (!(filter[k] && typeof filter[k] === "object")) base[k] = filter[k];
      applyUpdate(base, update);
      this.docs.push(base);
      return { matchedCount: 0, modifiedCount: 0, upsertedId: base._id ?? base.id ?? null, upsertedCount: 1 };
    }
    return { matchedCount: 0, modifiedCount: 0, upsertedId: null, upsertedCount: 0 };
  }
  async createIndex() { return "ok"; } // no-op in memory
}

function makeMemoryDb() {
  const cols = {};
  return { collection(name) { return (cols[name] = cols[name] || new Collection()); } };
}

module.exports = { makeMemoryDb };

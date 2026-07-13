import { buildSeedDb, type MockDb } from "./seed";

const STORAGE_KEY = "mini-trello-mock-db";

let cached: MockDb | null = null;

function load(): MockDb {
  if (cached) return cached;
  if (typeof window === "undefined") {
    // SSR/build pass — return a fresh in-memory seed, never persisted.
    return buildSeedDb();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cached = raw ? (JSON.parse(raw) as MockDb) : buildSeedDb();
  } catch {
    cached = buildSeedDb();
  }
  if (!window.localStorage.getItem(STORAGE_KEY)) {
    persist(cached);
  }
  return cached;
}

function persist(db: MockDb) {
  cached = db;
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

/** Read-only snapshot of the current mock DB. Mutate the returned object, then call `save()`. */
export function getDb(): MockDb {
  return load();
}

/** Persists mutations made to the object returned by getDb(). */
export function save(db: MockDb) {
  persist(db);
}

export function nextId(db: MockDb, kind: keyof MockDb["nextId"]): number {
  const id = db.nextId[kind];
  db.nextId[kind] = id + 1;
  return id;
}

/** Wipes all local changes and restores the original seed data. */
export function resetMockDb() {
  cached = buildSeedDb();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  }
}

/**
 * Storage adapter for zustand's `persist` middleware, backed by IndexedDB
 * instead of localStorage.
 *
 * Why: Forge stores exercise photos and progress photos as base64 data URLs
 * inside the persisted state. localStorage has a hard ~5-10MB per-origin quota
 * shared with everything else on the domain, and `setItem` throws
 * synchronously (and silently, if the write isn't wrapped) once it's full —
 * a user could lose their most recent session just by taking a couple of
 * progress photos. IndexedDB's quota is a large fraction of free disk space,
 * so the same data comfortably fits.
 *
 * This falls back to localStorage if IndexedDB is unavailable (old WebViews,
 * some private-browsing modes), and migrates any existing localStorage value
 * into IndexedDB the first time it's read, so upgrading doesn't lose data.
 */

const DB_NAME = "forge-db";
const STORE_NAME = "kv";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;
let idbAvailable = typeof indexedDB !== "undefined";

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE_NAME)) {
          req.result.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const req = fn(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

function readLocalStorage(name: string): string | null {
  try {
    return localStorage.getItem(name);
  } catch {
    return null;
  }
}

export const idbStorage = {
  async getItem(name: string): Promise<string | null> {
    if (!idbAvailable) return readLocalStorage(name);
    try {
      const existing = await withStore<string | undefined>("readonly", (s) => s.get(name));
      if (existing !== undefined) return existing;
      // One-time migration: an older build of Forge may have written this
      // key to localStorage. Adopt it into IndexedDB so nothing is lost.
      const legacy = readLocalStorage(name);
      if (legacy != null) {
        await withStore("readwrite", (s) => s.put(legacy, name));
        try {
          localStorage.removeItem(name);
        } catch {
          /* not critical if this fails */
        }
        return legacy;
      }
      return null;
    } catch {
      idbAvailable = false;
      return readLocalStorage(name);
    }
  },
  async setItem(name: string, value: string): Promise<void> {
    if (!idbAvailable) {
      try {
        localStorage.setItem(name, value);
      } catch {
        /* both storages unavailable; state only lives in memory this session */
      }
      return;
    }
    try {
      await withStore("readwrite", (s) => s.put(value, name));
    } catch {
      idbAvailable = false;
      try {
        localStorage.setItem(name, value);
      } catch {
        /* both storages unavailable; state only lives in memory this session */
      }
    }
  },
  async removeItem(name: string): Promise<void> {
    if (!idbAvailable) {
      try {
        localStorage.removeItem(name);
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      await withStore("readwrite", (s) => s.delete(name));
    } catch {
      idbAvailable = false;
      try {
        localStorage.removeItem(name);
      } catch {
        /* ignore */
      }
    }
  },
};

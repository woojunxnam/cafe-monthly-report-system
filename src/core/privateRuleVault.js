const DB_NAME = "cafe-monthly-report-system";
const DB_VERSION = 1;
const STORE_NAME = "private-rule-vault";
const FALLBACK_PREFIX = "private-rule-vault:";

export function createPrivateRuleVault() {
  return {
    list: () => listEntries(),
    get: (accountId) => getEntry(accountId),
    save: (accountId, rules, options) => saveEntry(accountId, rules, options),
    remove: (accountId) => deleteEntry(accountId),
    exportEntry: (accountId) => exportEntry(accountId),
    importEntry: (payload) => importEntry(payload)
  };
}

async function listEntries() {
  return withStore("readonly", (store) => promisifyRequest(store.getAll()))
    .catch(() => listFallbackEntries());
}

async function getEntry(accountId) {
  return withStore("readonly", (store) => promisifyRequest(store.get(accountId)))
    .catch(() => getFallbackEntry(accountId));
}

async function saveEntry(accountId, rules, options = {}) {
  const entry = {
    accountId,
    rules,
    updatedAt: options.updatedAt ?? new Date().toISOString(),
    schemaVersion: options.schemaVersion ?? 1
  };

  return withStore("readwrite", (store) => promisifyRequest(store.put(entry)))
    .then(() => entry)
    .catch(() => saveFallbackEntry(entry));
}

async function deleteEntry(accountId) {
  return withStore("readwrite", (store) => promisifyRequest(store.delete(accountId)))
    .catch(() => deleteFallbackEntry(accountId));
}

async function exportEntry(accountId) {
  const entry = await getEntry(accountId);
  if (!entry) {
    throw new Error("내보낼 저장 규칙이 없습니다.");
  }

  return {
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    accountId: entry.accountId,
    updatedAt: entry.updatedAt,
    rules: entry.rules
  };
}

async function importEntry(payload) {
  if (!payload || !payload.accountId || !payload.rules) {
    throw new Error("가져오기 JSON 형식이 올바르지 않습니다.");
  }
  return saveEntry(payload.accountId, payload.rules, {
    updatedAt: payload.updatedAt,
    schemaVersion: payload.schemaVersion
  });
}

function withStore(mode, callback) {
  return openDatabase().then((db) =>
    new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      let requestResult;

      try {
        requestResult = callback(store);
      } catch (error) {
        reject(error);
        return;
      }

      Promise.resolve(requestResult)
        .then((result) => {
          transaction.oncomplete = () => resolve(result);
          transaction.onerror = () => reject(transaction.error || new Error("IndexedDB transaction failed."));
          transaction.onabort = () => reject(transaction.error || new Error("IndexedDB transaction aborted."));
        })
        .catch(reject);
    })
  );
}

function openDatabase() {
  if (!("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "accountId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB open failed."));
  });
}

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed."));
  });
}

function fallbackKey(accountId) {
  return `${FALLBACK_PREFIX}${accountId}`;
}

function listFallbackEntries() {
  return Object.keys(window.localStorage)
    .filter((key) => key.startsWith(FALLBACK_PREFIX))
    .map((key) => JSON.parse(window.localStorage.getItem(key)))
    .filter(Boolean);
}

function getFallbackEntry(accountId) {
  const raw = window.localStorage.getItem(fallbackKey(accountId));
  return raw ? JSON.parse(raw) : null;
}

function saveFallbackEntry(entry) {
  window.localStorage.setItem(fallbackKey(entry.accountId), JSON.stringify(entry));
  return entry;
}

function deleteFallbackEntry(accountId) {
  window.localStorage.removeItem(fallbackKey(accountId));
}

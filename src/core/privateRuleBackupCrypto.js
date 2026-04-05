const BACKUP_FORMAT = "private-rule-backup";
const BACKUP_VERSION = 2;
const PBKDF2_ITERATIONS = 250000;
const AES_KEY_LENGTH = 256;

export function createPlainBackupPayload(entry) {
  validateEntry(entry);
  return {
    backupFormat: BACKUP_FORMAT,
    exportVersion: BACKUP_VERSION,
    accountId: entry.accountId,
    exportedAt: new Date().toISOString(),
    encrypted: false,
    entry: {
      accountId: entry.accountId,
      rules: entry.rules,
      updatedAt: entry.updatedAt,
      schemaVersion: entry.schemaVersion ?? 1
    }
  };
}

export async function createEncryptedBackupPayload(entry, passphrase) {
  validateEntry(entry);
  validatePassphrase(passphrase);
  assertCryptoAvailable();

  const payload = createPlainBackupPayload(entry);
  const plainBytes = encoder().encode(JSON.stringify(payload.entry));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plainBytes);

  return {
    backupFormat: BACKUP_FORMAT,
    exportVersion: BACKUP_VERSION,
    accountId: entry.accountId,
    exportedAt: payload.exportedAt,
    encrypted: true,
    algorithm: "AES-GCM",
    kdf: {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: PBKDF2_ITERATIONS,
      salt: bytesToBase64(salt)
    },
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(cipherBuffer))
  };
}

export async function importBackupPayload(payload, passphraseResolver) {
  if (payload?.encrypted) {
    assertCryptoAvailable();
    const passphrase = await passphraseResolver?.(payload);
    validatePassphrase(passphrase);
    const entry = await decryptBackupPayload(payload, passphrase);
    return { ...entry, backupMode: "encrypted" };
  }

  if (payload?.backupFormat === BACKUP_FORMAT && payload.entry) {
    validateEntry(payload.entry);
    return { ...payload.entry, backupMode: "plain" };
  }

  if (payload?.accountId && payload?.rules) {
    return {
      accountId: payload.accountId,
      rules: payload.rules,
      updatedAt: payload.updatedAt ?? new Date().toISOString(),
      schemaVersion: payload.schemaVersion ?? 1,
      backupMode: "legacy-plain"
    };
  }

  throw new Error("가져오기 JSON 형식이 올바르지 않습니다.");
}

async function decryptBackupPayload(payload, passphrase) {
  if (!payload.kdf?.salt || !payload.iv || !payload.ciphertext) {
    throw new Error("암호화 백업 파일 형식이 올바르지 않습니다.");
  }

  try {
    const salt = base64ToBytes(payload.kdf.salt);
    const iv = base64ToBytes(payload.iv);
    const ciphertext = base64ToBytes(payload.ciphertext);
    const key = await deriveKey(passphrase, salt);
    const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    const entry = JSON.parse(decoder().decode(plainBuffer));
    validateEntry(entry);
    return entry;
  } catch {
    throw new Error("암호화 백업 복호화에 실패했습니다. passphrase 또는 파일 내용을 확인해 주세요.");
  }
}

async function deriveKey(passphrase, salt) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: AES_KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return window.btoa(binary);
}

function base64ToBytes(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function validateEntry(entry) {
  if (!entry?.accountId || !entry?.rules) {
    throw new Error("백업 대상 규칙 데이터가 올바르지 않습니다.");
  }
}

function validatePassphrase(passphrase) {
  if (!passphrase || passphrase.length < 8) {
    throw new Error("passphrase는 8자 이상이어야 합니다.");
  }
}

function assertCryptoAvailable() {
  if (!window.crypto?.subtle) {
    throw new Error("이 브라우저에서는 Web Crypto API를 사용할 수 없습니다.");
  }
}

function encoder() {
  return new TextEncoder();
}

function decoder() {
  return new TextDecoder();
}

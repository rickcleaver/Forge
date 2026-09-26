/** Opt-in Forge Sync MVP — local-first with encrypted export / account backup hooks. */

import { buildBackup, parseBackup, type ForgeBackup } from "./backup";
import type { Program, ProgressPhoto, Session, Settings, StepLog, WeighIn } from "./types";

export type SyncStatus = {
  enabled: boolean;
  lastExportAt: number | null;
  label: string;
};

const KEY = "forge-sync-v1";

export function getSyncStatus(): SyncStatus {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { enabled: false, lastExportAt: null, label: "Local only" };
    const parsed = JSON.parse(raw) as SyncStatus;
    return {
      enabled: Boolean(parsed.enabled),
      lastExportAt: parsed.lastExportAt ?? null,
      label: parsed.enabled ? "Forge Sync on (export MVP)" : "Local only",
    };
  } catch {
    return { enabled: false, lastExportAt: null, label: "Local only" };
  }
}

export function setSyncEnabled(enabled: boolean): SyncStatus {
  const next: SyncStatus = {
    enabled,
    lastExportAt: getSyncStatus().lastExportAt,
    label: enabled ? "Forge Sync on (export MVP)" : "Local only",
  };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  const saltBuf = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer;
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBuf, iterations: 120_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function b64(bytes: ArrayBuffer | Uint8Array) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of u8) s += String.fromCharCode(b);
  return btoa(s);
}

function fromB64(s: string) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function encryptBackup(backup: ForgeBackup, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const payload = new TextEncoder().encode(JSON.stringify(backup));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, payload);
  return JSON.stringify({
    v: 1,
    kind: "forge-sync-encrypted",
    salt: b64(salt),
    iv: b64(iv),
    data: b64(cipher),
  });
}

export async function decryptBackup(raw: string, passphrase: string): Promise<ForgeBackup> {
  const parsed = JSON.parse(raw) as { kind?: string; salt: string; iv: string; data: string };
  if (parsed.kind !== "forge-sync-encrypted") throw new Error("Not an encrypted Forge Sync file.");
  const key = await deriveKey(passphrase, fromB64(parsed.salt));
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(parsed.iv) },
    key,
    fromB64(parsed.data),
  );
  return parseBackup(new TextDecoder().decode(plain));
}

export function downloadEncrypted(text: string) {
  const day = new Date().toISOString().slice(0, 10);
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `forge-sync-${day}.json`;
  a.click();
  URL.revokeObjectURL(url);
  const status = getSyncStatus();
  status.lastExportAt = Date.now();
  localStorage.setItem(KEY, JSON.stringify(status));
}

export function packForSync(data: {
  sessions: Session[];
  settings: Settings;
  weighIns: WeighIn[];
  stepLogs: StepLog[];
  progressPhotos: ProgressPhoto[];
  programs: Program[];
}) {
  return buildBackup(data);
}

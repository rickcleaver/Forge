import type { Program, ProgressPhoto, Session, Settings, StepLog, WeighIn } from "./types";

export const BACKUP_VERSION = 1;

export type ForgeBackup = {
  v: number;
  exportedAt: number;
  sessions: Session[];
  settings: Settings;
  weighIns: WeighIn[];
  stepLogs: StepLog[];
  progressPhotos: ProgressPhoto[];
  programs: Program[];
};

export function buildBackup(data: {
  sessions: Session[];
  settings: Settings;
  weighIns: WeighIn[];
  stepLogs: StepLog[];
  progressPhotos: ProgressPhoto[];
  programs: Program[];
}): ForgeBackup {
  return {
    v: BACKUP_VERSION,
    exportedAt: Date.now(),
    sessions: data.sessions,
    settings: data.settings,
    weighIns: data.weighIns,
    stepLogs: data.stepLogs,
    progressPhotos: data.progressPhotos,
    programs: data.programs,
  };
}

export function downloadBackup(backup: ForgeBackup): void {
  const day = new Date(backup.exportedAt).toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `forge-backup-${day}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseBackup(raw: string): ForgeBackup {
  let data: ForgeBackup;
  try {
    data = JSON.parse(raw) as ForgeBackup;
  } catch {
    throw new Error("Not a Forge backup.");
  }
  if (!data || typeof data !== "object") throw new Error("Not a Forge backup.");
  if (!Array.isArray(data.sessions)) throw new Error("Backup is missing sessions.");
  return {
    v: typeof data.v === "number" ? data.v : 1,
    exportedAt: typeof data.exportedAt === "number" ? data.exportedAt : Date.now(),
    sessions: data.sessions,
    settings: data.settings,
    weighIns: Array.isArray(data.weighIns) ? data.weighIns : [],
    stepLogs: Array.isArray(data.stepLogs) ? data.stepLogs : [],
    progressPhotos: Array.isArray(data.progressPhotos) ? data.progressPhotos : [],
    programs: Array.isArray(data.programs) ? data.programs : [],
  };
}

export const BACKUP_REMINDER_DAYS = 14;
export const BACKUP_REMINDER_SESSIONS = 5;
const DAY_MS = 86_400_000;

export function backupStatus(
  sessionCount: number,
  lastBackupAt: number | null,
  sessionsAtLastBackup: number,
  now = Date.now(),
): { stale: boolean; daysSince: number | null; newSessions: number } {
  const daysSince = lastBackupAt == null ? null : Math.floor((now - lastBackupAt) / DAY_MS);
  const newSessions = sessionCount - sessionsAtLastBackup;
  const stale =
    lastBackupAt == null
      ? sessionCount > 0
      : (daysSince ?? 0) >= BACKUP_REMINDER_DAYS || newSessions >= BACKUP_REMINDER_SESSIONS;
  return { stale, daysSince, newSessions };
}

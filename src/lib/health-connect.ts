/**
 * Health Connect / health data bridge for Forge.
 *
 * Platform capabilities required for automatic Health Connect reads:
 * - Android native wrapper (TWA WebView / Capacitor): must postMessage JSON
 *   `{ type: "forge-health", source: "health-connect", steps?, weightLb?, sleepHrs?, readiness?, workouts? }`
 *   after the user grants Health Connect permissions in the system sheet.
 * - This PWA alone cannot call the Android Health Connect SDK. "Connected" in
 *   Forge means we successfully ingested real metrics into the gym store — never
 *   a marketing toggle without data flow.
 *
 * Working web paths (all write into stepLogs / weighIns / readiness via store):
 * 1) Native bridge postMessage / window.forgeApplyHealth / ?healthSteps=
 * 2) JSON or CSV file import (steps, weight, sleep)
 * 3) Manual entry + on-device DeviceMotion pedometer (Steps card)
 */

export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}

function openIntent(primary: string, fallback: string) {
  try {
    window.location.assign(isAndroid() ? primary : fallback);
  } catch {
    window.open(fallback, "_blank", "noopener");
  }
}

export function openHealthConnect(): void {
  openIntent(
    "intent://#Intent;action=androidx.health.ACTION_HEALTH_CONNECT_SETTINGS;end",
    "https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata",
  );
}

export function openGarminConnect(): void {
  openIntent(
    "intent://#Intent;package=com.garmin.android.apps.connectmobile;scheme=https;end",
    "https://play.google.com/store/apps/details?id=com.garmin.android.apps.connectmobile",
  );
}

export type HealthSource = "bridge" | "import" | "query" | "manual" | "motion";

export type HealthSnapshot = {
  steps?: number;
  weightLb?: number;
  sleepHrs?: number;
  restingHr?: number;
  readiness?: number;
  source?: HealthSource;
};

export type HealthSyncState = {
  /** True only after at least one successful ingest into the store. */
  linked: boolean;
  lastSyncedAt: number | null;
  lastSource: HealthSource | null;
  lastError: string | null;
  lastSteps: number | null;
  lastWeightLb: number | null;
};

export const DEFAULT_HEALTH_SYNC: HealthSyncState = {
  linked: false,
  lastSyncedAt: null,
  lastSource: null,
  lastError: null,
  lastSteps: null,
  lastWeightLb: null,
};

function num(v: unknown): number | null {
  const n = typeof v === "string" && v.trim() === "" ? NaN : Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function stepsFromBridge(data: unknown): number | null {
  return healthFromBridge(data)?.steps ?? null;
}

export function stepsFromQuery(search: string): number | null {
  const raw = new URLSearchParams(search).get("healthSteps");
  if (raw == null || raw.trim() === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

/** Accept steps plus optional sleep / recovery / weight from a native bridge. */
export function healthFromBridge(data: unknown): HealthSnapshot | null {
  if (!data || typeof data !== "object") return null;
  const rec = data as Record<string, unknown>;
  if (rec.type !== "forge-health" && rec.source !== "health-connect") return null;
  return normalizeSnapshot(rec, "bridge");
}

export function sleepFromBridge(data: unknown): number | null {
  return healthFromBridge(data)?.sleepHrs ?? null;
}

export function readinessFromBridge(data: unknown): number | null {
  return healthFromBridge(data)?.readiness ?? null;
}

export function normalizeSnapshot(
  rec: Record<string, unknown>,
  source: HealthSource,
): HealthSnapshot | null {
  const out: HealthSnapshot = { source };
  const steps = num(rec.steps ?? rec.stepCount ?? rec.Steps);
  if (steps != null && steps >= 0) out.steps = Math.round(steps);

  const kg = num(rec.weightKg ?? rec.weight_kg);
  const lb = num(rec.weightLb ?? rec.weight_lb ?? rec.weight ?? rec.Weight);
  if (lb != null && lb > 40 && lb < 800) out.weightLb = Math.round(lb * 10) / 10;
  else if (kg != null && kg > 20 && kg < 360) out.weightLb = Math.round(kg * 2.20462 * 10) / 10;

  const sleep = num(rec.sleepHrs ?? rec.sleepHours ?? rec.sleep ?? rec.Sleep);
  if (sleep != null && sleep >= 0 && sleep <= 24) out.sleepHrs = Math.round(sleep * 10) / 10;

  const rhr = num(rec.restingHr ?? rec.rhr);
  if (rhr != null && rhr > 20 && rhr < 220) out.restingHr = Math.round(rhr);

  const ready = num(rec.readiness ?? rec.recovery);
  if (ready != null && ready >= 0 && ready <= 100) out.readiness = Math.round(ready);

  return Object.keys(out).length > 1 || out.steps != null || out.weightLb != null ? out : null;
}

/** Parse a JSON object or CSV text into a health snapshot. */
export function parseHealthImport(text: string): { ok: true; snap: HealthSnapshot } | { ok: false; error: string } {
  const raw = text.trim();
  if (!raw) return { ok: false, error: "File is empty." };

  if (raw.startsWith("{") || raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      const rec = Array.isArray(parsed)
        ? ((parsed[0] as Record<string, unknown> | undefined) ?? {})
        : (parsed as Record<string, unknown>);
      const snap = normalizeSnapshot(rec, "import");
      if (!snap || (snap.steps == null && snap.weightLb == null && snap.sleepHrs == null)) {
        return { ok: false, error: "JSON needs steps, weight, or sleepHrs." };
      }
      return { ok: true, snap };
    } catch {
      return { ok: false, error: "Could not parse JSON." };
    }
  }

  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { ok: false, error: "CSV needs a header row and one data row." };
  const headers = lines[0].split(/[,;\t]/).map((h) => h.trim().toLowerCase());
  const values = lines[lines.length - 1].split(/[,;\t]/).map((v) => v.trim());
  const rec: Record<string, unknown> = {};
  headers.forEach((h, i) => {
    rec[h] = values[i];
  });
  // Map common CSV headers
  if (rec.steps == null && rec.step != null) rec.steps = rec.step;
  if (rec.weightlb == null && rec["weight (lb)"] != null) rec.weightLb = rec["weight (lb)"];
  if (rec.weightlb != null) rec.weightLb = rec.weightlb;
  if (rec.weightkg != null) rec.weightKg = rec.weightkg;
  if (rec.sleephrs != null) rec.sleepHrs = rec.sleephrs;

  const snap = normalizeSnapshot(rec, "import");
  if (!snap || (snap.steps == null && snap.weightLb == null && snap.sleepHrs == null)) {
    return { ok: false, error: "CSV needs a steps, weight, or sleepHrs column." };
  }
  return { ok: true, snap };
}

export function describeHealthCapability(): string {
  if (isAndroid()) {
    return "On Android, open Health Connect permissions, then Sync — or use a native Forge wrapper that posts forge-health. Import a file anytime.";
  }
  return "Web cannot read Health Connect directly. Import a JSON/CSV export, paste steps, or use a native bridge that posts forge-health.";
}

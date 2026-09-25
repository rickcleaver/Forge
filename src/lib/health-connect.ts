/** Health Connect is an on-device Android SDK. A TWA/PWA cannot read it. */

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

export function stepsFromBridge(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  const rec = data as Record<string, unknown>;
  if (rec.type !== "forge-health" && rec.source !== "health-connect") return null;
  const n = Number(rec.steps);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

export function stepsFromQuery(search: string): number | null {
  const n = Number(new URLSearchParams(search).get("healthSteps"));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}


export type HealthSnapshot = {
  steps?: number;
  sleepHrs?: number;
  restingHr?: number;
  readiness?: number;
};

/** Accept steps plus optional sleep / recovery fields from a native bridge. */
export function healthFromBridge(data: unknown): HealthSnapshot | null {
  if (!data || typeof data !== "object") return null;
  const rec = data as Record<string, unknown>;
  if (rec.type !== "forge-health" && rec.source !== "health-connect") return null;
  const out: HealthSnapshot = {};
  const steps = Number(rec.steps);
  if (Number.isFinite(steps) && steps >= 0) out.steps = Math.round(steps);
  const sleep = Number(rec.sleepHrs ?? rec.sleepHours ?? rec.sleep);
  if (Number.isFinite(sleep) && sleep >= 0 && sleep <= 24) out.sleepHrs = Math.round(sleep * 10) / 10;
  const rhr = Number(rec.restingHr ?? rec.rhr);
  if (Number.isFinite(rhr) && rhr > 20 && rhr < 220) out.restingHr = Math.round(rhr);
  const ready = Number(rec.readiness ?? rec.recovery);
  if (Number.isFinite(ready) && ready >= 0 && ready <= 100) out.readiness = Math.round(ready);
  return Object.keys(out).length ? out : null;
}

export function sleepFromBridge(data: unknown): number | null {
  return healthFromBridge(data)?.sleepHrs ?? null;
}

export function readinessFromBridge(data: unknown): number | null {
  return healthFromBridge(data)?.readiness ?? null;
}

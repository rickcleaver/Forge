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

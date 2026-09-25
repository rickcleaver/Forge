const VISIT_KEY = "forge-checkin-day";

function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function checkinDoneToday(readinessLogs?: { at: number }[]): boolean {
  const key = todayKey();
  if (readinessLogs?.some((l) => todayKey(new Date(l.at)) === key)) return true;
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(VISIT_KEY) === key;
  } catch {
    return false;
  }
}

export function markCheckinDone(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(VISIT_KEY, todayKey());
    window.dispatchEvent(new Event("forge-checkin-done"));
  } catch {
    /* ignore */
  }
}

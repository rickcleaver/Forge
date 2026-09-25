import { buildSpotterPack } from "@/lib/spotter";
import { publishWeek, pullCoachPlan } from "@/lib/spotter-api";
import { useGym } from "@/lib/store";

const APPLIED_KEY = "forge-applied-plan";

export async function pushWeekToCoach(): Promise<void> {
  const s = useGym.getState();
  const pack = buildSpotterPack({
    sessions: s.sessions,
    settings: s.settings,
    handle: "Athlete",
  });
  await publishWeek({ data: JSON.stringify(pack) });
}

export async function applyWaitingCoachPlan(): Promise<string | null> {
  const plan = await pullCoachPlan();
  if (!plan?.days.length) return null;
  const stamp = String(plan.exportedAt || plan.name);
  try {
    if (sessionStorage.getItem(APPLIED_KEY) === stamp) return null;
  } catch {
    /* ignore */
  }
  useGym.getState().importProgramPack({
    name: plan.name,
    source: "Spotter",
    mapWeek: true,
    days: plan.days,
  });
  try {
    sessionStorage.setItem(APPLIED_KEY, stamp);
  } catch {
    /* ignore */
  }
  return plan.name;
}

export function coachWeekText(pack: {
  handle: string;
  sessions: number;
  volume: number;
  unit: "lb" | "kg";
  days: Array<{ at: number; name: string; sets: number }>;
  lifts: Array<{ name: string; weight: number | null; reps: number | null }>;
  note: string;
}): string {
  const lines = [
    `Forge week — ${pack.handle}`,
    `${pack.sessions} sessions`,
    "",
    ...pack.days.map((d) => `${new Date(d.at).toLocaleDateString()} · ${d.name} · ${d.sets} sets`),
    "",
    ...pack.lifts.map((l) => `${l.name} ${l.weight ?? "—"} × ${l.reps ?? "—"}`),
    pack.note ? `\nNote: ${pack.note}` : "",
  ];
  return lines.filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");
}

export const CLIENT_PRIVACY =
  "Forge Spotter shares with your linked coach: session names, set counts, and recent loads for this week, plus chat and the plan they send back. Photos, full history, body weight, and backups stay on your phone. You can unlink by signing out or switching desks.";

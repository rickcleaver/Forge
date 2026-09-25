import type { Intensity, Session } from "./types";
import { sessionClockStart, sessionDurationMs, sessionSetCount } from "./stats";
import { formatDuration } from "./utils";

export const MFP_EXERCISE_URL = "https://www.myfitnesspal.com/exercise/add";
export const MFP_HOME_URL = "https://www.myfitnesspal.com/";

const LB_TO_KG = 0.453592;
const DEFAULT_BODY_LB = 180;

export const INTENSITY_LABEL: Record<Intensity, string> = {
  light: "Light",
  moderate: "Moderate",
  hard: "Hard",
};

// MET (metabolic equivalent) multipliers by session type and self-reported
// intensity. These are still a guess, not a measurement — the UI should
// always present the result as an estimate, never a precise number.
const MET_TABLE: Record<"cardio" | "band" | "lift", Record<Intensity, number>> = {
  lift: { light: 3.5, moderate: 5, hard: 6.5 },
  band: { light: 3, moderate: 4, hard: 5.5 },
  cardio: { light: 5, moderate: 7, hard: 9.5 },
};

function sessionKind(session: Session): "cardio" | "band" | "lift" {
  const name = (session.name ?? "").toLowerCase();
  const lifts = session.exercises ?? [];
  const cardio = lifts.some((e) => (e.muscles ?? []).includes("cardio"));
  if (cardio) return "cardio";
  const band = name.includes("band") || lifts.some((e) => (e.libraryId ?? "").startsWith("band-"));
  return band ? "band" : "lift";
}

export function estimateSessionKcal(
  session: Session,
  endedAt = session.finishedAt ?? Date.now(),
  bodyWeightLb: number | null = null,
  intensity: Intensity = "moderate",
): number {
  const minutes = Math.max(1, (endedAt - sessionClockStart(session)) / 60_000);
  const kg = (bodyWeightLb && bodyWeightLb > 0 ? bodyWeightLb : DEFAULT_BODY_LB) * LB_TO_KG;
  const met = MET_TABLE[sessionKind(session)][intensity];
  return Math.round(met * kg * (minutes / 60));
}

export function mfpSessionLine(session: Session, kcal: number, now = Date.now()): string {
  const mins = formatDuration(sessionDurationMs(session, session.finishedAt ?? now));
  const sets = sessionSetCount(session);
  return `Forge — ${session.name}\n${mins} · ${sets} sets · ~${kcal} kcal (estimate)\nLog in MyFitnessPal as strength / cardio.`;
}

export function openMyFitnessPal(path: "exercise" | "home" = "exercise"): void {
  const url = path === "home" ? MFP_HOME_URL : MFP_EXERCISE_URL;
  window.open(url, "_blank", "noopener,noreferrer");
}

export async function sendSessionToMfp(session: Session, kcal: number): Promise<void> {
  const text = mfpSessionLine(session, kcal);
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* clipboard may be blocked in preview; still open MFP */
  }
  openMyFitnessPal("exercise");
}

import { TEMPLATES } from "./exercises";
import type { DayPlan, Program, TrainGoal } from "./types";

export const WEEK_DAYS = [
  { i: 0, short: "Sun", label: "Sunday" },
  { i: 1, short: "Mon", label: "Monday" },
  { i: 2, short: "Tue", label: "Tuesday" },
  { i: 3, short: "Wed", label: "Wednesday" },
  { i: 4, short: "Thu", label: "Thursday" },
  { i: 5, short: "Fri", label: "Friday" },
  { i: 6, short: "Sat", label: "Saturday" },
] as const;

export const WEEK_DAYS_MON_FIRST = [...WEEK_DAYS.slice(1), WEEK_DAYS[0]];

export function isPlanSet(plan: DayPlan | null | undefined): boolean {
  if (!plan) return false;
  return plan.rest || Boolean(plan.templateId) || Boolean(plan.programId);
}

export function planLabel(plan: DayPlan | null | undefined, programs: Program[]): string | null {
  if (!plan) return null;
  if (plan.rest) return "Rest";
  if (plan.programId) {
    const p = programs.find((x) => x.id === plan.programId);
    return p?.dayLabel || p?.name || null;
  }
  if (plan.templateId) {
    const t = TEMPLATES.find((x) => x.id === plan.templateId);
    return t?.name ?? null;
  }
  return null;
}


const REST: DayPlan = { rest: true, templateId: null, programId: null };
const slot = (templateId: string): DayPlan => ({ rest: false, templateId, programId: null });

/** Map onboarding goal / days / place into a Mon-first-ish week (Sun index 0). */
export function buildWeekFromOnboarding(
  goal: TrainGoal,
  trainDays: number,
  place: "home" | "gym" | "both",
): DayPlan[] {
  const days = Math.max(2, Math.min(6, Math.round(trainDays)));
  const home = place === "home";
  const gym = place === "gym" || place === "both";

  let rotation: string[];
  if (home && !gym) {
    rotation = goal === "fitness" || goal === "fat"
      ? ["home", "cardio", "bands", "home", "cardio", "bands"]
      : ["home", "bands", "home", "bands", "home", "bands"];
  } else if (days <= 3) {
    rotation = goal === "strength"
      ? ["full", "full", "full"]
      : goal === "fitness" || goal === "fat"
        ? ["full", "cardio", "full"]
        : ["push", "pull", "legs"];
  } else if (days === 4) {
    rotation = ["push", "pull", "legs", "upper"];
  } else if (days === 5) {
    rotation = goal === "fitness" || goal === "fat"
      ? ["push", "pull", "legs", "upper", "cardio"]
      : ["push", "pull", "legs", "push", "pull"];
  } else {
    rotation = ["push", "pull", "legs", "push", "pull", "legs"];
  }

  // Prefer Mon/Tue/Wed/Thu/Fri/Sat — leave Sunday rest when possible.
  const preferred = [1, 2, 3, 4, 5, 6, 0];
  const trainIdx = new Set(preferred.slice(0, days));
  const week: DayPlan[] = Array.from({ length: 7 }, () => ({ ...REST }));
  let r = 0;
  for (let d = 0; d < 7; d++) {
    if (!trainIdx.has(d)) continue;
    const id = rotation[r % rotation.length]!;
    week[d] = slot(id);
    r++;
  }
  return week;
}

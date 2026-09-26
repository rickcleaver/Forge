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

/** JS getDay(): 0=Sun … 6=Sat */
export function dayIndex(now: number | Date = Date.now()): number {
  return new Date(now).getDay();
}

export function getDayPlan(
  weekPlan: DayPlan[] | null | undefined,
  day: number,
): DayPlan | null {
  if (!weekPlan?.length || day < 0 || day > 6) return null;
  return weekPlan[day] ?? null;
}

export function todayPlan(
  weekPlan: DayPlan[] | null | undefined,
  now: number | Date = Date.now(),
): DayPlan | null {
  return getDayPlan(weekPlan, dayIndex(now));
}

export type PlanKind = "rest" | "template" | "program" | "blank";

export function planKind(plan: DayPlan | null | undefined): PlanKind {
  if (!plan) return "blank";
  if (plan.rest) return "rest";
  if (plan.programId) return "program";
  if (plan.templateId) return "template";
  return "blank";
}

export function planChip(plan: DayPlan | null | undefined, programs: Program[]): string {
  const kind = planKind(plan);
  if (kind === "rest") return "Rest";
  if (kind === "blank") return "—";
  const label = planLabel(plan, programs);
  if (!label) return "Train";
  return label.length > 8 ? `${label.slice(0, 7)}…` : label;
}

export type WeekPlanCounts = { train: number; rest: number; blank: number };

export function weekPlanCounts(weekPlan: DayPlan[] | null | undefined): WeekPlanCounts {
  const counts: WeekPlanCounts = { train: 0, rest: 0, blank: 0 };
  for (let i = 0; i < 7; i++) {
    const kind = planKind(getDayPlan(weekPlan, i));
    if (kind === "rest") counts.rest += 1;
    else if (kind === "blank") counts.blank += 1;
    else counts.train += 1;
  }
  return counts;
}

/** One-liner for Feed / Discover cards. */
export function weekPlanSummaryLine(
  weekPlan: DayPlan[] | null | undefined,
  programs: Program[],
  now: number | Date = Date.now(),
): string {
  const counts = weekPlanCounts(weekPlan);
  const today = todayPlan(weekPlan, now);
  const todayName = planLabel(today, programs);
  const kind = planKind(today);
  const todayBit =
    kind === "rest"
      ? "Today is rest"
      : kind === "blank"
        ? "Today is open"
        : `Today: ${todayName ?? "train"}`;
  return `${todayBit} · ${counts.train} train · ${counts.rest} rest`;
}

/** Short grounded crew tips — not a fake social feed. */
export const CREW_TIPS: Array<{ id: string; title: string; body: string; vibe: string }> = [
  {
    id: "log-fast",
    title: "Log fast, flex later",
    body: "One tap per set. Save the story for after you finish — Forge keeps the numbers honest.",
    vibe: "Tip",
  },
  {
    id: "rest-counts",
    title: "Rest days still count",
    body: "A planned rest day protects the streak energy. Walk, sleep, protein — no fake FOMO.",
    vibe: "Crew",
  },
  {
    id: "form-first",
    title: "Form before ego weight",
    body: "Add a clean rep before you add plates. PRs land when the log stays consistent.",
    vibe: "Coach",
  },
  {
    id: "week-board",
    title: "Set the week board",
    body: "Tap Mon–Sun on Home, assign Push / Pull / Legs / Rest. Today and Coach follow that plan.",
    vibe: "How-to",
  },
  {
    id: "circles",
    title: "Circles ≠ followers",
    body: "One buddy code. Optional nudges stay on your phone. No public feed noise.",
    vibe: "Circles",
  },
];

export function crewTipForDay(now: number | Date = Date.now()) {
  const i = Math.abs(Math.floor(new Date(now).getTime() / 86_400_000)) % CREW_TIPS.length;
  return CREW_TIPS[i]!;
}

import { TEMPLATES } from "./exercises";
import type { DayPlan, Program } from "./types";

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

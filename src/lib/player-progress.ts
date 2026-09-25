import { startOfDay } from "date-fns";
import type { Session } from "./types";
import { sessionSetCount } from "./stats";

/** XP needed to clear a level (level 1 to 2 costs 100, then +35 each). */
export function xpForLevel(level: number): number {
  return Math.round(100 + Math.max(0, level - 1) * 35);
}

export type LevelInfo = {
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNext: number;
  progress: number;
};

export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, Math.floor(xp));
  let need = xpForLevel(level);
  while (remaining >= need) {
    remaining -= need;
    level += 1;
    need = xpForLevel(level);
  }
  return {
    level,
    xp: Math.max(0, Math.floor(xp)),
    xpIntoLevel: remaining,
    xpForNext: need,
    progress: need <= 0 ? 1 : remaining / need,
  };
}

/** Consecutive training days ending today or yesterday. */
export function trainingStreak(sessions: Session[], now = Date.now()): number {
  const days = new Set<number>();
  for (const s of sessions) {
    if (!s.finishedAt) continue;
    days.add(startOfDay(s.finishedAt).getTime());
  }
  if (days.size === 0) return 0;
  const today = startOfDay(now).getTime();
  const yesterday = startOfDay(now - 86_400_000).getTime();
  let cursor: number | null = days.has(today) ? today : days.has(yesterday) ? yesterday : null;
  if (cursor == null) return 0;
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = startOfDay(cursor - 86_400_000).getTime();
  }
  return streak;
}

export function totalWorkingSets(sessions: Session[]): number {
  return sessions.reduce((n, s) => n + sessionSetCount(s), 0);
}

/** All finished-session calendar days as start-of-day timestamps. */
export function workoutDaySet(sessions: Session[]): Set<number> {
  const days = new Set<number>();
  for (const s of sessions) {
    if (!s.finishedAt) continue;
    days.add(startOfDay(s.finishedAt).getTime());
  }
  return days;
}

/** Longest consecutive finished-workout streak in the log. */
export function bestTrainingStreak(sessions: Session[]): number {
  const days = [...workoutDaySet(sessions)].sort((a, b) => a - b);
  if (days.length === 0) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const gap = days[i]! - days[i - 1]!;
    if (gap === 86_400_000) {
      run += 1;
      best = Math.max(best, run);
    } else if (gap > 0) {
      run = 1;
    }
  }
  return best;
}

export type DayChip = {
  /** start-of-day ms */
  day: number;
  label: string;
  trained: boolean;
  isToday: boolean;
};

/** Last `count` calendar days (oldest → newest) with workout flags. */
export function recentDayChips(
  sessions: Session[],
  count = 14,
  now = Date.now(),
): DayChip[] {
  const trained = workoutDaySet(sessions);
  const today = startOfDay(now).getTime();
  const labels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const chips: DayChip[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const day = startOfDay(today - i * 86_400_000).getTime();
    chips.push({
      day,
      label: labels[new Date(day).getDay()] ?? "?",
      trained: trained.has(day),
      isToday: day === today,
    });
  }
  return chips;
}

export function trainedToday(sessions: Session[], now = Date.now()): boolean {
  return workoutDaySet(sessions).has(startOfDay(now).getTime());
}

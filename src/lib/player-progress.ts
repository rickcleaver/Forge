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

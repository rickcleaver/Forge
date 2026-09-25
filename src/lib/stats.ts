import { addDays, isSameDay, startOfWeek } from "date-fns";
import { isDurationLog } from "./exercises";
import type { MuscleId, Session, SetEntry, WeightUnit } from "./types";

/**
 * Identity used to match "the same lift" across sessions, for PRs, "last
 * performance", and history lookups.
 *
 * Previously this matched on `name.toLowerCase()` alone, which meant renaming
 * an exercise (or a typo) silently orphaned its whole history. Library lifts
 * carry a stable `libraryId`, so we key on that when present and only fall
 * back to the name for custom/freeform exercises that have none.
 */
export type ExerciseIdentity = { name: string; libraryId?: string | null };

export function exerciseKey(ex: ExerciseIdentity): string {
  return ex.libraryId ? `id:${ex.libraryId}` : `name:${ex.name.trim().toLowerCase()}`;
}

function matchesExercise(ex: ExerciseIdentity, key: string): boolean {
  return exerciseKey(ex) === key;
}

export function isWarmup(set: SetEntry): boolean {
  return Boolean(set.warmup);
}

export function isWorkingCompleted(set: SetEntry): boolean {
  if (isWarmup(set) || !set.completed) return false;
  return (set.reps ?? 0) > 0 || (set.durationMin ?? 0) > 0;
}

export function sessionVolume(session: Session): number {
  let total = 0;
  for (const ex of session.exercises) {
    for (const set of ex.sets) {
      if (!isWorkingCompleted(set)) continue;
      total += (set.weight ?? 0) * (set.reps ?? 0);
    }
  }
  return total;
}

export function sessionSetCount(session: Session): number {
  return session.exercises.reduce(
    (n, ex) => n + ex.sets.filter((s) => s.completed && !isWarmup(s)).length,
    0,
  );
}

export function sessionMuscles(session: Session): MuscleId[] {
  const seen = new Set<MuscleId>();
  for (const ex of session.exercises) {
    for (const m of ex.muscles) seen.add(m);
  }
  return [...seen];
}

export function isSetupSession(session: { liveAt?: number | null; finishedAt: number | null }): boolean {
  return session.finishedAt == null && session.liveAt == null;
}

export function sessionClockStart(session: { liveAt?: number | null; startedAt: number }): number {
  return session.liveAt ?? session.startedAt;
}

export function sessionDurationMs(session: { liveAt?: number | null; startedAt: number; finishedAt: number | null }, now = Date.now()): number {
  if (session.liveAt == null && !session.finishedAt) return 0;
  const end = session.finishedAt ?? now;
  return Math.max(0, end - sessionClockStart(session));
}

export function lastPerformance(
  sessions: Session[],
  exercise: ExerciseIdentity,
  exceptSessionId?: string,
): { weight: number | null; reps: number | null; when: number } | null {
  const sets = lastWorkingSets(sessions, exercise, exceptSessionId);
  if (!sets || sets.length === 0) return null;
  const done = [...sets].reverse()[0];
  return { weight: done.weight, reps: done.reps, when: done.when };
}

export function lastWorkingSets(
  sessions: Session[],
  exercise: ExerciseIdentity,
  exceptSessionId?: string,
): Array<{
  weight: number | null;
  reps: number | null;
  durationMin: number | null;
  distance: number | null;
  when: number;
}> | null {
  const key = exerciseKey(exercise);
  const sorted = [...sessions]
    .filter((s) => s.id !== exceptSessionId && s.finishedAt)
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));
  for (const s of sorted) {
    const ex = s.exercises.find((e) => matchesExercise(e, key));
    if (!ex) continue;
    const rows = ex.sets
      .filter((set) => isWorkingCompleted(set))
      .map((set) => ({
        weight: set.weight,
        reps: set.reps,
        durationMin: set.durationMin ?? null,
        distance: set.distance ?? null,
        when: s.finishedAt ?? s.startedAt,
      }));
    if (rows.length) return rows;
  }
  return null;
}

export function isPersonalRecord(
  sessions: Session[],
  exercise: ExerciseIdentity,
  set: SetEntry,
): boolean {
  if (!isWorkingCompleted(set)) return false;
  const load = (set.weight ?? 0) * (set.reps ?? 0);
  const w = set.weight ?? 0;
  let bestLoad = 0;
  let bestWeight = -1;
  let history = false;
  const key = exerciseKey(exercise);
  for (const s of sessions) {
    for (const ex of s.exercises) {
      if (!matchesExercise(ex, key)) continue;
      for (const prev of ex.sets) {
        if (prev.id === set.id) continue;
        if (!isWorkingCompleted(prev)) continue;
        history = true;
        const pl = (prev.weight ?? 0) * (prev.reps ?? 0);
        if (pl > bestLoad) bestLoad = pl;
        if ((prev.weight ?? 0) > bestWeight) bestWeight = prev.weight ?? 0;
      }
    }
  }
  if (!history) return false;
  return w > bestWeight + 1e-6 || load > bestLoad + 1e-6;
}

export function muscleHitsThisWeek(
  sessions: Session[],
  now = Date.now(),
): Record<MuscleId, number> {
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).getTime();
  const hits = {} as Record<MuscleId, number>;
  for (const s of sessions) {
    const t = s.finishedAt ?? s.startedAt;
    if (t < weekStart) continue;
    for (const ex of s.exercises) {
      const sets = ex.sets.filter((set) => set.completed && !isWarmup(set)).length;
      if (sets === 0) continue;
      for (const m of ex.muscles) {
        hits[m] = (hits[m] ?? 0) + sets;
      }
    }
  }
  return hits;
}

export function lastTrained(
  sessions: Session[],
  muscle: MuscleId,
): number | null {
  let latest: number | null = null;
  for (const s of sessions) {
    const t = s.finishedAt ?? s.startedAt;
    if (
      s.exercises.some(
        (ex) =>
          ex.muscles.includes(muscle) &&
          ex.sets.some((set) => set.completed && !isWarmup(set)),
      )
    ) {
      if (latest === null || t > latest) latest = t;
    }
  }
  return latest;
}

export function formatSetLoad(
  weight: number | null,
  reps: number | null,
  unit: WeightUnit,
): string {
  const r = reps ?? 0;
  if (weight === null || weight === 0) return r ? `BW × ${r}` : "—";
  return `${weight} ${unit} × ${r || "—"}`;
}

export function formatPrevLoad(
  weight: number | null,
  reps: number | null,
): string {
  if (weight === null && reps === null) return "—";
  if (weight === null || weight === 0) return `BW×${reps ?? 0}`;
  return `${weight}×${reps ?? 0}`;
}

export function formatPrevCardio(durationMin: number | null | undefined, distance: number | null | undefined): string {
  if ((durationMin == null || durationMin === 0) && (distance == null || distance === 0)) return "—";
  if (distance == null || distance === 0) return `${durationMin} min`;
  if (durationMin == null || durationMin === 0) return `${distance}`;
  return `${durationMin}m · ${distance}`;
}

export function epley1rm(weight: number | null, reps: number | null): number | null {
  if (weight == null || weight <= 0) return null;
  const r = reps ?? 0;
  if (r <= 1) return Math.round(weight);
  return Math.round(weight * (1 + r / 30));
}

export type LiftBest = {
  name: string;
  weight: number | null;
  reps: number | null;
  load: number;
  when: number;
  e1rm: number | null;
};

export function allTimeBests(sessions: Session[]): LiftBest[] {
  const map = new Map<string, LiftBest>();
  for (const s of sessions) {
    if (!s.finishedAt) continue;
    for (const ex of s.exercises) {
      for (const set of ex.sets) {
        if (!isWorkingCompleted(set)) continue;
        const load = (set.weight ?? 0) * (set.reps ?? 0);
        const key = exerciseKey(ex);
        const prev = map.get(key);
        if (!prev || load > prev.load) {
          map.set(key, {
            name: ex.name,
            weight: set.weight,
            reps: set.reps,
            load,
            when: s.finishedAt ?? s.startedAt,
            e1rm: epley1rm(set.weight, set.reps),
          });
        }
      }
    }
  }
  return [...map.values()].sort((a, b) => (b.e1rm ?? 0) - (a.e1rm ?? 0) || b.load - a.load);
}

export function exerciseHistory(
  sessions: Session[],
  exercise: ExerciseIdentity,
  exceptSessionId?: string,
): Array<{
  sessionId: string;
  when: number;
  sessionName: string;
  sets: Array<{ weight: number | null; reps: number | null; warmup: boolean }>;
}> {
  const key = exerciseKey(exercise);
  return sessions
    .filter((s) => s.finishedAt && s.id !== exceptSessionId)
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))
    .flatMap((s) => {
      const ex = s.exercises.find((e) => matchesExercise(e, key));
      if (!ex) return [];
      const sets = ex.sets.filter((set) => set.completed);
      if (!sets.length) return [];
      return [
        {
          sessionId: s.id,
          when: s.finishedAt ?? s.startedAt,
          sessionName: s.name,
          sets: sets.map((set) => ({
            weight: set.weight,
            reps: set.reps,
            warmup: Boolean(set.warmup),
          })),
        },
      ];
    })
    .slice(0, 8);
}

export function sessionPrNames(session: Session, all: Session[]): string[] {
  const names: string[] = [];
  for (const ex of session.exercises) {
    if (ex.sets.some((set) => isPersonalRecord(all, ex, set))) names.push(ex.name);
  }
  return names;
}

/**
 * Estimated 1-rep-max for one lift across finished sessions, oldest first,
 * for charting progress over time. Uses the best working set of each session.
 */
export function e1rmHistory(
  sessions: Session[],
  exercise: ExerciseIdentity,
  exceptSessionId?: string,
): Array<{ when: number; e1rm: number }> {
  const key = exerciseKey(exercise);
  return sessions
    .filter((s) => s.finishedAt && s.id !== exceptSessionId)
    .sort((a, b) => (a.finishedAt ?? 0) - (b.finishedAt ?? 0))
    .flatMap((s) => {
      const ex = s.exercises.find((e) => matchesExercise(e, key));
      if (!ex) return [];
      let best: number | null = null;
      for (const set of ex.sets) {
        if (!isWorkingCompleted(set)) continue;
        const e1 = epley1rm(set.weight, set.reps);
        if (e1 != null && (best == null || e1 > best)) best = e1;
      }
      if (best == null) return [];
      return [{ when: s.finishedAt ?? s.startedAt, e1rm: best }];
    });
}

export function nextIncompleteSet(session: Session): {
  name: string;
  label: string;
} | null {
  for (const ex of session.exercises) {
    for (const set of ex.sets) {
      if (set.completed) continue;
      const cardio = isDurationLog(ex);
      const label = cardio
        ? formatPrevCardio(set.durationMin, set.distance)
        : formatPrevLoad(set.weight, set.reps);
      return { name: ex.name, label };
    }
  }
  return null;
}

export function weekTraining(
  sessions: Session[],
  now = Date.now(),
): { days: Array<{ at: number; trained: boolean }>; volume: number; sessions: number } {
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => {
    const at = addDays(start, i).getTime();
    const trained = sessions.some(
      (s) => s.finishedAt && isSameDay(s.finishedAt, at) && sessionSetCount(s) > 0,
    );
    return { at, trained };
  });
  const weekSessions = sessions.filter(
    (s) => s.finishedAt && s.finishedAt >= start.getTime() && s.finishedAt <= now,
  );
  return {
    days,
    volume: weekSessions.reduce((n, s) => n + sessionVolume(s), 0),
    sessions: weekSessions.length,
  };
}

export function weekPrNames(sessions: Session[], now = Date.now()): string[] {
  const start = startOfWeek(now, { weekStartsOn: 1 }).getTime();
  const names: string[] = [];
  for (const s of sessions) {
    if (!s.finishedAt || s.finishedAt < start) continue;
    for (const name of sessionPrNames(s, sessions)) {
      if (!names.includes(name)) names.push(name);
    }
  }
  return names;
}

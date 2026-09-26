import { addDays, startOfWeek } from "date-fns";
import { exerciseKey, isWorkingCompleted, muscleHitsThisWeek, sessionVolume, weekTraining } from "./stats";
import { LIBRARY, LIBRARY_MAP } from "./exercises";
import type { ExerciseLog, MuscleId, ReadinessLog, Session, Settings } from "./types";
import { MUSCLES } from "./types";
import { athleteCard } from "./player-profile";
import { goalShortLabel } from "./week-plan";

export type NextRx = {
  name: string;
  weight: number | null;
  reps: number | null;
  why: string;
  hold: boolean;
  confidence: number;
  lastWeight: number | null;
  lastReps: number | null;
};

export function readinessScore(sleepHrs: number, energy: number, soreness: number, stress: number): number {
  const sleep = Math.min(10, (sleepHrs / 8) * 10);
  const raw = sleep * 2.5 + energy * 2.5 + (10 - soreness) * 2.5 + (10 - stress) * 2.5;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function nextPrescription(sessions: Session[], exercise: { name: string; libraryId?: string | null }): NextRx | null {
  const key = exerciseKey(exercise);
  const finished = sessions.filter((s) => s.finishedAt).sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));
  const last = finished.find((s) => s.exercises.some((e) => exerciseKey(e) === key));
  if (!last) return null;
  const ex = last.exercises.find((e) => exerciseKey(e) === key);
  if (!ex) return null;
  const sets = ex.sets.filter(isWorkingCompleted);
  if (!sets.length) return null;
  const top = sets.reduce((a, b) => ((b.weight ?? 0) > (a.weight ?? 0) ? b : a));
  const avgRir =
    sets.filter((s) => s.rir != null).reduce((n, s, _, arr) => n + (s.rir ?? 0) / arr.length, 0) || null;
  const repsHit = sets.every((s) => (s.reps ?? 0) >= (top.reps ?? 0) && (top.reps ?? 0) >= 8);
  const failed = sets.some((s) => (s.reps ?? 0) > 0 && (s.reps ?? 0) < (sets[0].reps ?? 0) - 1);
  const step = (top.weight ?? 0) >= 100 ? 5 : 2.5;
  if (failed || (avgRir != null && avgRir <= 0.5)) {
    return {
      name: ex.name,
      weight: top.weight,
      reps: top.reps,
      hold: true,
      confidence: 78,
      lastWeight: top.weight,
      lastReps: top.reps,
      why: "Last session slowed or hit failure. Hold the load and own the reps.",
    };
  }
  if (repsHit || (avgRir != null && avgRir >= 3)) {
    return {
      name: ex.name,
      weight: top.weight != null ? top.weight + step : null,
      reps: top.reps,
      hold: false,
      confidence: avgRir != null ? 88 : 74,
      lastWeight: top.weight,
      lastReps: top.reps,
      why: `You owned ${top.weight} × ${top.reps}. Bump the load ${step}.`,
    };
  }
  return {
    name: ex.name,
    weight: top.weight,
    reps: top.reps != null ? top.reps + 1 : null,
    hold: false,
    confidence: 70,
    lastWeight: top.weight,
    lastReps: top.reps,
    why: "Add a rep before you add weight.",
  };
}

export type ForgeScore = {
  total: number;
  strength: number;
  consistency: number;
  recovery: number;
  progression: number;
  volume: number;
};

export function forgeScore(sessions: Session[], readiness: ReadinessLog[], settings: Settings, now = Date.now()): ForgeScore {
  const finished = sessions.filter((s) => s.finishedAt);
  const week = weekTraining(finished, now);
  const lastStart = addDays(startOfWeek(now, { weekStartsOn: 1 }), -7).getTime();
  const lastVol = finished
    .filter((s) => s.finishedAt && s.finishedAt >= lastStart && s.finishedAt < startOfWeek(now, { weekStartsOn: 1 }).getTime())
    .reduce((n, s) => n + sessionVolume(s), 0);
  const targetDays = settings.trainDays ?? 4;
  const consistency = Math.min(100, Math.round((week.sessions / Math.max(1, targetDays)) * 100));
  const volume = lastVol <= 0 ? 70 : Math.min(100, Math.round((week.volume / lastVol) * 70));
  const latestReady = readiness.filter((r) => now - r.at < 36 * 3600_000).at(-1);
  const recovery = latestReady?.score ?? 70;
  const lifts = finished.slice(0, 8).flatMap((s) => s.exercises.map((e) => e.name));
  const unique = [...new Set(lifts)].slice(0, 8);
  let up = 0;
  let counted = 0;
  for (const name of unique) {
    const rx = nextPrescription(finished, { name });
    if (!rx) continue;
    counted += 1;
    if (!rx.hold) up += 1;
  }
  const progression = counted ? Math.round((up / counted) * 100) : 60;
  const strength = Math.min(100, 50 + unique.length * 4);
  const total = Math.round((strength + consistency + recovery + progression + volume) / 5);
  return { total, strength, consistency, recovery, progression, volume };
}

export function strengthProfile(sessions: Session[]): Array<{ id: MuscleId; label: string; score: number }> {
  const hits = muscleHitsThisWeek(sessions);
  return MUSCLES.filter((m) => m.id !== "cardio").map((m) => {
    const n = hits[m.id] ?? 0;
    return { id: m.id, label: m.label, score: Math.min(100, n * 12 + (n > 0 ? 40 : 20)) };
  });
}

export function weekMuscleAdvice(sessions: Session[]): { id: MuscleId; label: string; sets: number; tone: "good" | "ok" | "low"; note: string }[] {
  const hits = muscleHitsThisWeek(sessions);
  return MUSCLES.filter((m) => m.id !== "cardio").map((m) => {
    const sets = hits[m.id] ?? 0;
    const tone = sets >= 10 ? "good" : sets >= 6 ? "ok" : "low";
    const note =
      tone === "good" ? "Covered." : tone === "ok" ? "Could use a little more." : `Add 3–4 ${m.label.toLowerCase()} sets.`;
    return { id: m.id, label: m.label, sets, tone, note };
  });
}

export function sessionMinutes(exercises: ExerciseLog[]): number {
  const sets = exercises.reduce((n, ex) => n + Math.max(1, ex.sets.filter((s) => !s.warmup).length), 0);
  return Math.max(20, Math.round(sets * 2.4 + exercises.length * 3));
}

export function lengthKeepCount(minutes: number, total: number): number {
  if (minutes >= 90) return total;
  if (minutes <= 15) return Math.min(2, total);
  if (minutes <= 25) return Math.min(3, total);
  if (minutes <= 40) return Math.min(4, total);
  return total;
}

export function shortSession(exercises: ExerciseLog[], minutes: number): ExerciseLog[] {
  if (minutes >= 90) return exercises;
  const keep = lengthKeepCount(minutes, exercises.length);
  const setCap = minutes <= 15 ? 2 : 3;
  return exercises.slice(0, keep).map((ex) => ({
    ...ex,
    sets: [
      ...ex.sets.filter((s) => s.warmup).slice(0, 1),
      ...ex.sets.filter((s) => !s.warmup).slice(0, setCap),
    ],
  }));
}

function sameLift(a: ExerciseLog, b: ExerciseLog): boolean {
  if (a.id && a.id === b.id) return true;
  if (a.libraryId && b.libraryId && a.libraryId === b.libraryId) return true;
  return a.name.trim().toLowerCase() === b.name.trim().toLowerCase();
}

/** Rebuild the visible list from the full plan without wiping logged sets. */
export function applySessionLength(
  blueprint: ExerciseLog[],
  current: ExerciseLog[],
  minutes: number,
): ExerciseLog[] {
  const sized = shortSession(blueprint, minutes);
  return sized.map((planned) => {
    const cur = current.find((c) => sameLift(c, planned));
    if (!cur) return planned;
    const planWork = planned.sets.filter((s) => !s.warmup);
    const curWork = cur.sets.filter((s) => !s.warmup);
    const curWarm = cur.sets.filter((s) => s.warmup);
    const planWarm = planned.sets.filter((s) => s.warmup);
    const cap = planWork.length;
    const working = curWork.length >= cap ? curWork.slice(0, cap) : [...curWork, ...planWork.slice(curWork.length)];
    return { ...cur, sets: [...(curWarm.length ? curWarm : planWarm), ...working] };
  });
}

export function deloadAdvice(
  sessions: Session[],
  readiness: ReadinessLog[],
  now = Date.now(),
): string | null {
  const finished = sessions.filter((s) => s.finishedAt);
  const week = weekTraining(finished, now);
  const start = startOfWeek(now, { weekStartsOn: 1 }).getTime();
  const lastVol = finished
    .filter((s) => s.finishedAt && s.finishedAt >= addDays(start, -7).getTime() && s.finishedAt < start)
    .reduce((n, s) => n + sessionVolume(s), 0);
  const ready = readiness.at(-1);
  const tired = ready && now - ready.at < 36 * 3600_000 && ready.score < 50;
  const stalled = week.sessions >= 3 && lastVol > 0 && week.volume < lastVol * 0.85;
  if (tired && stalled) {
    return "Performance and readiness both dipped. A 5–7 day lighter week is the smart call — same lifts, about 70% load. Not a medical call. Training recommendation only.";
  }
  if (tired) return "Readiness is low. Keep the session, cut a set off accessories.";
  return null;
}

export function missedPlanLabel(
  weekPlan: Settings["weekPlan"] | undefined,
  sessions: Session[],
  now = Date.now(),
): string | null {
  if (!weekPlan?.length) return null;
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  const slot = weekPlan[y.getDay()];
  if (!slot || slot.rest || (!slot.programId && !slot.templateId)) return null;
  const trained = sessions.some((s) => {
    const t = s.finishedAt ?? s.startedAt;
    return new Date(t).toDateString() === y.toDateString();
  });
  if (trained) return null;
  return "Yesterday’s planned session didn’t get logged. Do it today, then slide the rest of the week forward one day.";
}

export function nutritionCue(settings: Settings): string {
  const p = settings.proteinGoal;
  const c = settings.calorieGoal;
  if (p && c) return `Around training: 25–40g protein and 35–60g carbs. Daily aim ${c} kcal / ${p}g protein.`;
  if (p) return `Hit about ${p}g protein. 25–40g around the session.`;
  return "25–40g protein and some carbs around the session. Set targets in Settings if you want numbers.";
}

export function milestones(sessions: Session[]): string[] {
  const finished = sessions.filter((s) => s.finishedAt);
  const out: string[] = [];
  if (finished.length === 1) out.push("First session in the log.");
  if (finished.length === 10) out.push("10 sessions logged.");
  if (finished.length === 50) out.push("50 sessions. That’s a real block.");
  const vol = finished.reduce((n, s) => n + sessionVolume(s), 0);
  if (vol >= 100_000) out.push("Lifetime volume passed 100,000.");
  return out;
}

export function looksLikeShoulderWork(exercise: { name: string; muscles: MuscleId[] }): boolean {
  if (exercise.muscles.includes("shoulders")) return true;
  return /shoulder|ohp|overhead|lateral|upright|face\s*pull|arnold|military/i.test(exercise.name);
}

export function swapAway(exercise: ExerciseLog, avoid: MuscleId): ExerciseLog | null {
  const sameGear = LIBRARY_MAP[exercise.libraryId ?? ""]?.gear;
  const alt =
    LIBRARY.find(
      (l) =>
        l.id !== exercise.libraryId &&
        !l.muscles.includes(avoid) &&
        !looksLikeShoulderWork(l) &&
        (sameGear ? l.gear === sameGear : true) &&
        l.gear !== "cardio",
    ) ??
    LIBRARY.find((l) => !l.muscles.includes(avoid) && !looksLikeShoulderWork(l) && l.gear !== "cardio");
  if (!alt) return null;
  return {
    ...exercise,
    libraryId: alt.id,
    name: alt.name,
    muscles: [...alt.muscles],
    notes: `Swapped off ${avoid}.`,
  };
}

export function coachWorkoutPlan(
  sessions: Session[],
  readiness: ReadinessLog[],
  settings: Settings,
): { name: string; why: string; exerciseIds: string[]; sets: number } {
  const profile = strengthProfile(sessions).sort((a, b) => a.score - b.score);
  const week = weekMuscleAdvice(sessions);
  const score = forgeScore(sessions, readiness, settings);
  const ready = readiness.at(-1);
  const lowReady = Boolean(ready && Date.now() - ready.at < 36 * 3600_000 && ready.score < 55);
  const sets = lowReady || score.recovery < 55 ? 2 : 3;
  const home = settings.place === "home";
  const pick: Record<string, string[]> = home
    ? {
        chest: ["push-up", "band-chest-press"],
        back: ["band-row", "pull-up"],
        shoulders: ["band-ohp", "band-pallof"],
        quads: ["bw-squat", "band-squat"],
        hamstrings: ["rdl", "glute-bridge"],
        glutes: ["glute-bridge", "band-glute-kickback"],
        biceps: ["band-row", "barbell-curl"],
        triceps: ["push-up", "tricep-pushdown"],
        core: ["plank", "band-pallof"],
        calves: ["calf-raise", "bw-squat"],
      }
    : {
        chest: ["bench-press", "incline-db"],
        back: ["barbell-row", "pull-up"],
        shoulders: ["ohp", "lateral-raise"],
        quads: ["back-squat", "leg-press"],
        hamstrings: ["rdl", "leg-press"],
        glutes: ["hip-thrust", "rdl"],
        biceps: ["barbell-curl", "barbell-row"],
        triceps: ["tricep-pushdown", "ohp"],
        core: ["plank", "band-pallof"],
        calves: ["calf-raise", "back-squat"],
      };

  const weak = [
    ...week.filter((w) => w.tone === "low").map((w) => w.id),
    ...profile.slice(0, 4).map((p) => p.id),
  ];
  const ids: string[] = [];
  for (const m of weak) {
    const pair = pick[m] ?? [];
    for (const id of pair) {
      if (LIBRARY_MAP[id] && !ids.includes(id)) ids.push(id);
      if (ids.length >= 6) break;
    }
    if (ids.length >= 6) break;
  }
  if (ids.length < 4) {
    for (const id of home
      ? ["push-up", "bw-squat", "band-row", "plank"]
      : ["back-squat", "bench-press", "barbell-row", "ohp"]) {
      if (LIBRARY_MAP[id] && !ids.includes(id)) ids.push(id);
    }
  }
  const focus = profile[0]?.label ?? "full body";
  const card = athleteCard(settings);
  const who = card.name;
  const goal = goalShortLabel(card.goal);
  const body =
    card.weightLb != null
      ? ` · ~${Math.round(card.weightLb)}lb`
      : card.heightCm != null
        ? ` · ${Math.round(card.heightCm)}cm`
        : "";
  const ageBit = card.age != null ? ` · ${card.age}y` : "";
  const why = `${who ? `${who} · ` : ""}Forge score ${score.total}. Weakest area is ${focus.toLowerCase()}. ${
    lowReady ? "Readiness is soft, so two working sets." : `${sets} working sets.`
  }${goal ? ` Aim: ${goal}.` : ""}${body}${ageBit}`;
  const name = who ? `${who} · ${focus}` : `Forge · ${focus}`;
  return { name, why, exerciseIds: ids.slice(0, 6), sets };
}

import { format, startOfWeek } from "date-fns";
import { matchLibrary, resolveMuscles } from "./exercises";
import { parseCoachProgramText } from "./parse-coach-program";
import { lastWorkingSets, sessionSetCount, sessionVolume } from "./stats";
import type { Program, ProgramExercise, Session, Settings } from "./types";

export const SPOTTER_PACK = "forge-spotter";
export const SPOTTER_PLAN = "forge-spotter-plan";

export type SpotterDayLift = {
  name: string;
  sets: Array<{ weight: number | null; reps: number | null }>;
  call: "up" | "hold" | "down";
  why: string;
};

export type SpotterDay = {
  at: number;
  name: string;
  sets: number;
  volume: number;
  lifts?: SpotterDayLift[];
};

export type SpotterLift = {
  name: string;
  libraryId: string | null;
  weight: number | null;
  reps: number | null;
};

export type SpotterPack = {
  v: 1;
  kind: typeof SPOTTER_PACK;
  code: string;
  exportedAt: number;
  handle: string;
  unit: "lb" | "kg";
  goal: string | null;
  trainDays: number | null;
  sessions: number;
  volume: number;
  days: SpotterDay[];
  lifts: SpotterLift[];
  note: string;
};

export type SpotterPlan = {
  v: 1;
  kind: typeof SPOTTER_PLAN;
  forCode: string;
  exportedAt: number;
  name: string;
  note: string;
  days: Array<{ label: string; exercises: ProgramExercise[] }>;
};

function liftCall(sets: Array<{ weight: number | null; reps: number | null; rir?: number | null }>): {
  call: "up" | "hold" | "down";
  why: string;
} {
  const work = sets.filter((s) => (s.reps ?? 0) > 0 || (s.weight ?? 0) > 0);
  if (!work.length) return { call: "hold", why: "No working sets." };
  const reps = work.map((s) => s.reps ?? 0);
  const first = reps[0] ?? 0;
  const last = reps[reps.length - 1] ?? 0;
  const top = Math.max(...reps);
  if (last > 0 && first > 0 && last <= first - 2) {
    return { call: "down", why: "Reps dropped across sets. Hold or drop the load." };
  }
  if (work.every((s) => (s.reps ?? 0) >= 8) && work.length >= 3) {
    return { call: "up", why: "Owned the reps. Add 2.5–5 next time." };
  }
  if (top >= 12) return { call: "up", why: "High reps. Load can move up." };
  if (last > 0 && last < 5 && first >= 8) return { call: "down", why: "Last set collapsed. Don’t add weight." };
  return { call: "hold", why: "Solid. Same load, chase one more clean rep." };
}

function dayLifts(session: Session): SpotterDayLift[] {
  return session.exercises
    .map((ex) => {
      const sets = ex.sets
        .filter((s) => s.completed && !s.warmup)
        .map((s) => ({ weight: s.weight, reps: s.reps }));
      if (!sets.length) return null;
      const { call, why } = liftCall(sets);
      return { name: ex.name, sets, call, why };
    })
    .filter((x): x is SpotterDayLift => Boolean(x));
}

function weekSessions(sessions: Session[], now = Date.now()): Session[] {
  const start = startOfWeek(now, { weekStartsOn: 1 }).getTime();
  return sessions.filter((s) => {
    const t = s.finishedAt ?? s.startedAt;
    return t >= start && Boolean(s.finishedAt);
  });
}

export function makeSpotterCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 4; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export function buildSpotterPack(input: {
  sessions: Session[];
  settings: Settings;
  handle: string;
  note?: string;
  now?: number;
}): SpotterPack {
  const now = input.now ?? Date.now();
  const week = weekSessions(input.sessions, now);
  const days = week
    .sort((a, b) => (a.finishedAt ?? a.startedAt) - (b.finishedAt ?? b.startedAt))
    .map((s) => ({
      at: s.finishedAt ?? s.startedAt,
      name: s.name,
      sets: sessionSetCount(s),
      volume: sessionVolume(s),
      lifts: dayLifts(s),
    }));
  const names = new Set<string>();
  const lifts: SpotterLift[] = [];
  for (const s of [...input.sessions].filter((x) => x.finishedAt).sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))) {
    for (const ex of s.exercises) {
      const key = (ex.libraryId || ex.name).toLowerCase();
      if (names.has(key)) continue;
      const last = lastWorkingSets(input.sessions, ex);
      const top = last?.[0];
      if (!top) continue;
      names.add(key);
      lifts.push({
        name: ex.name,
        libraryId: ex.libraryId,
        weight: top.weight,
        reps: top.reps,
      });
      if (lifts.length >= 8) break;
    }
    if (lifts.length >= 8) break;
  }
  return {
    v: 1,
    kind: SPOTTER_PACK,
    code: makeSpotterCode(),
    exportedAt: now,
    handle: input.handle.trim() || "Athlete",
    unit: input.settings.unit,
    goal: input.settings.goal ?? null,
    trainDays: input.settings.trainDays ?? null,
    sessions: week.length,
    volume: week.reduce((n, s) => n + sessionVolume(s), 0),
    days,
    lifts,
    note: (input.note ?? "").trim(),
  };
}

export function packShareText(pack: SpotterPack): string {
  const start = startOfWeek(pack.exportedAt, { weekStartsOn: 1 });
  const lines = [
    `Forge Spotter · ${pack.handle} · ${pack.code}`,
    `${format(start, "MMM d")} week · ${pack.sessions} sessions · ${Math.round(pack.volume).toLocaleString()} ${pack.unit}`,
    ...pack.days.map((d) => `• ${format(d.at, "EEE")} ${d.name} · ${d.sets} sets`),
    pack.lifts.length ? `Loads: ${pack.lifts.slice(0, 4).map((l) => `${l.name} ${l.weight ?? "—"}×${l.reps ?? "—"}`).join(" · ")}` : "",
    pack.note ? `Note: ${pack.note}` : "",
    "Coach: import this file in Forge → Spotter.",
  ];
  return lines.filter(Boolean).join("\n");
}

export function extractJson(raw: string): string {
  const t = raw.trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) return t.slice(start, end + 1);
  return t;
}

export function parseSpotterPack(raw: string): SpotterPack {
  let data: unknown;
  try {
    data = JSON.parse(extractJson(raw));
  } catch {
    throw new Error("Not a Spotter file.");
  }
  const p = data as Partial<SpotterPack>;
  if (!p || p.kind !== SPOTTER_PACK || !Array.isArray(p.days)) throw new Error("Not a client Spotter pack.");
  return {
    v: 1,
    kind: SPOTTER_PACK,
    code: String(p.code || makeSpotterCode()).slice(0, 8),
    exportedAt: typeof p.exportedAt === "number" ? p.exportedAt : Date.now(),
    handle: String(p.handle || "Athlete").slice(0, 40),
    unit: p.unit === "kg" ? "kg" : "lb",
    goal: p.goal ? String(p.goal) : null,
    trainDays: typeof p.trainDays === "number" ? p.trainDays : null,
    sessions: typeof p.sessions === "number" ? p.sessions : p.days.length,
    volume: typeof p.volume === "number" ? p.volume : 0,
    days: p.days.map((d) => ({
      at: Number(d.at) || Date.now(),
      name: String(d.name || "Session"),
      sets: Number(d.sets) || 0,
      volume: Number(d.volume) || 0,
    })),
    lifts: Array.isArray(p.lifts)
      ? p.lifts.slice(0, 12).map((l) => ({
          name: String(l.name || "Lift"),
          libraryId: l.libraryId ?? null,
          weight: l.weight ?? null,
          reps: l.reps ?? null,
        }))
      : [],
    note: String(p.note || ""),
  };
}

export function parseSpotterPlan(raw: string): SpotterPlan {
  let data: unknown;
  try {
    data = JSON.parse(extractJson(raw));
  } catch {
    throw new Error("Not a coach plan file.");
  }
  const p = data as Partial<SpotterPlan>;
  if (!p || p.kind !== SPOTTER_PLAN || !Array.isArray(p.days)) throw new Error("Not a Spotter plan.");
  return {
    v: 1,
    kind: SPOTTER_PLAN,
    forCode: String(p.forCode || ""),
    exportedAt: typeof p.exportedAt === "number" ? p.exportedAt : Date.now(),
    name: String(p.name || "Coach plan"),
    note: String(p.note || ""),
    days: p.days.map((d) => ({
      label: String(d.label || "Day"),
      exercises: Array.isArray(d.exercises) ? d.exercises : [],
    })),
  };
}

export function planFromCoachText(name: string, forCode: string, note: string, text: string): SpotterPlan {
  const draft = parseCoachProgramText(text);
  return {
    v: 1,
    kind: SPOTTER_PLAN,
    forCode,
    exportedAt: Date.now(),
    name: name.trim() || draft.name || "Coach plan",
    note: note.trim(),
    days: draft.days.map((day) => ({
      label: day.label,
      exercises: day.exercises.map((ex) => {
        const lib = matchLibrary(ex.name);
        return {
          libraryId: lib?.id ?? null,
          name: lib?.name ?? ex.name,
          muscles: resolveMuscles({ name: lib?.name ?? ex.name, libraryId: lib?.id, muscles: lib?.muscles }),
          notes: ex.notes || undefined,
          restSec: ex.restSec,
          sets: ex.sets.map((s) => ({
            weight: s.weight,
            reps: s.reps,
            warmup: s.warmup,
            durationMin: null,
            distance: null,
          })),
        };
      }),
    })),
  };
}

export function planFromPrograms(name: string, forCode: string, note: string, programs: Program[]): SpotterPlan {
  return {
    v: 1,
    kind: SPOTTER_PLAN,
    forCode,
    exportedAt: Date.now(),
    name: name.trim() || "Coach plan",
    note: note.trim(),
    days: programs.map((p) => ({
      label: p.dayLabel || p.name,
      exercises: p.exercises,
    })),
  };
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

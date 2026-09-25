import { matchLibrary, resolveMuscles } from "./exercises";
import type { ExerciseLog, Session, SetEntry } from "./types";
import { uid } from "./utils";

function splitCsvLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === sep) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function detectSep(header: string): string {
  const commas = (header.match(/,/g) ?? []).length;
  const semis = (header.match(/;/g) ?? []).length;
  return semis > commas ? ";" : ",";
}

function normKey(k: string): string {
  return k.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function num(v: string | undefined): number | null {
  if (!v) return null;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseDate(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const iso = Date.parse(t);
  if (Number.isFinite(iso)) return iso;
  const m = t.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})(?:,\s*(\d{1,2}):(\d{2}))?/);
  if (m) {
    const d = Date.parse(`${m[2]} ${m[1]}, ${m[3]} ${m[4] ?? "12"}:${m[5] ?? "00"}:00`);
    return Number.isFinite(d) ? d : null;
  }
  return null;
}

function isWarm(setType: string, order: string): boolean {
  const s = `${setType} ${order}`.toLowerCase();
  return /\bwarm|\bwu\b/.test(s);
}

type Row = Record<string, string>;

function rowsFromCsv(text: string): Row[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const sep = detectSep(lines[0]);
  const headers = splitCsvLine(lines[0], sep).map(normKey);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line, sep);
    const row: Row = {};
    headers.forEach((h, i) => {
      if (h) row[h] = cells[i] ?? "";
    });
    return row;
  });
}

function pick(row: Row, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[normKey(k)];
    if (v) return v;
  }
  return "";
}

export function detectCsvKind(text: string): "strong" | "hevy" | "unknown" {
  const head = normKey(text.split(/\r?\n/, 1)[0] ?? "");
  if (head.includes("exercisename") && head.includes("setorder")) return "strong";
  if (head.includes("exercisetitle") && (head.includes("starttime") || head.includes("title"))) return "hevy";
  if (head.includes("workoutname") && head.includes("weight")) return "strong";
  return "unknown";
}

function sessionKey(at: number, name: string): string {
  const d = new Date(at);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}|${name.trim().toLowerCase()}`;
}

function toExercise(name: string, sets: SetEntry[], notes: string): ExerciseLog {
  const lib = matchLibrary(name);
  return {
    id: uid(),
    libraryId: lib?.id ?? null,
    name: lib?.name ?? name,
    muscles: resolveMuscles({ name: lib?.name ?? name, libraryId: lib?.id, muscles: lib?.muscles }),
    notes,
    photos: [],
    restSec: null,
    sets,
  };
}

export function parseWorkoutCsv(text: string): Session[] {
  const rows = rowsFromCsv(text);
  if (!rows.length) throw new Error("That file has no rows.");
  const groups = new Map<string, { at: number; name: string; notes: string; lifts: Map<string, { name: string; notes: string; sets: SetEntry[] }> }>();

  for (const row of rows) {
    const name =
      pick(row, "workoutname", "title", "workout") ||
      pick(row, "exercisename", "exercisetitle") ||
      "Imported session";
    const when =
      parseDate(pick(row, "date", "starttime", "start_time", "workout date")) ?? Date.now();
    const lift = pick(row, "exercisename", "exercisetitle", "exercise");
    if (!lift) continue;
    const weight = num(pick(row, "weight", "weightlbs", "weightkg", "weight_lbs", "weight_kg"));
    const reps = num(pick(row, "reps"));
    const seconds = num(pick(row, "seconds", "durationseconds", "duration_seconds"));
    const rpe = pick(row, "rpe");
    const setType = pick(row, "settype", "set_type");
    const order = pick(row, "setorder", "set_index", "setindex");
    const liftNotes = [pick(row, "notes", "exercisenotes"), rpe ? `RPE ${rpe}` : ""].filter(Boolean).join(" · ");
    const workoutNotes = pick(row, "workoutnotes", "description");

    const key = sessionKey(when, name);
    let g = groups.get(key);
    if (!g) {
      g = { at: when, name, notes: workoutNotes, lifts: new Map() };
      groups.set(key, g);
    }
    let liftRow = g.lifts.get(lift.toLowerCase());
    if (!liftRow) {
      liftRow = { name: lift, notes: liftNotes, sets: [] };
      g.lifts.set(lift.toLowerCase(), liftRow);
    }
    liftRow.sets.push({
      id: uid(),
      weight,
      reps,
      completed: true,
      warmup: isWarm(setType, order),
      durationMin: seconds && seconds > 0 ? Math.round((seconds / 60) * 10) / 10 : null,
      distance: num(pick(row, "distance", "distancemiles", "distance_miles")),
    });
  }

  const sessions: Session[] = [];
  for (const g of groups.values()) {
    const exercises = [...g.lifts.values()].map((l) => toExercise(l.name, l.sets, l.notes));
    if (!exercises.length) continue;
    const startedAt = g.at;
    const finishedAt = startedAt + Math.max(20, exercises.reduce((n, e) => n + e.sets.length, 0) * 2) * 60_000;
    sessions.push({
      id: uid(),
      name: g.name,
      startedAt,
      liveAt: startedAt,
      finishedAt,
      notes: g.notes ? `${g.notes}\nImported from Strong/Hevy` : "Imported from Strong/Hevy",
      photo: null,
      exercises,
    });
  }
  return sessions.sort((a, b) => b.startedAt - a.startedAt);
}

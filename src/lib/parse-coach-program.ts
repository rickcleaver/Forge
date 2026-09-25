export type DraftSet = {
  reps: number | null;
  weight: number | null;
  warmup: boolean;
};

export type DraftExercise = {
  name: string;
  sets: DraftSet[];
  notes: string;
  restSec: number | null;
};

export type DraftDay = {
  label: string;
  exercises: DraftExercise[];
};

export type DraftPack = {
  name: string;
  days: DraftDay[];
};

const DAY_HEAD =
  /^(?:(?:week\s*\d+\s*[-–—:]?\s*)?(?:day\s*\d+|workout\s*[a-d1-7]|session\s*\d+)|(?:push|pull|legs|upper|lower|full\s*body|rest)(?:\s*(?:day|body))?)\b/i;

const SETS_X_REPS =
  /(\d{1,2})\s*[-–—]?\s*(\d{1,2})?\s*[x×]\s*(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?/i;

const SETS_OF_REPS =
  /(\d{1,2})\s*(?:sets?)\s*(?:of|x|×)?\s*(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?/i;

const REST_RE = /(?:rest|rir)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(min|mins|minutes|sec|secs|s|m)?/i;
const RPE_RE = /(?:@\s*)?(?:rpe|rir)\s*[:=]?\s*(\d+(?:\.\d+)?)/i;
const WEIGHT_RE = /(\d+(?:\.\d+)?)\s*(lb|lbs|kg|#)\b/i;

function cleanLine(line: string): string {
  return line
    .replace(/^[\s>*•\-–—\d.)]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isDayHead(line: string): boolean {
  const t = cleanLine(line);
  if (!t || t.length > 60) return false;
  if (parseScheme(t)) return false;
  return DAY_HEAD.test(t);
}

function dayLabel(line: string, index: number): string {
  const t = cleanLine(line).replace(/\s+/g, " ");
  return t || `Day ${index + 1}`;
}

function parseRest(text: string): number | null {
  const m = text.match(REST_RE);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  const unit = (m[2] ?? "s").toLowerCase();
  if (unit.startsWith("min") || unit === "m") return Math.round(n * 60);
  return Math.round(n);
}

function parseScheme(text: string): { sets: number; reps: number; notes: string } | null {
  const x = text.match(SETS_X_REPS);
  if (x) {
    const a = Number(x[1]);
    const b = x[2] ? Number(x[2]) : a;
    const r1 = Number(x[3]);
    const r2 = x[4] ? Number(x[4]) : r1;
    const sets = Math.max(a, b);
    const reps = r2;
    const notes = r1 !== r2 ? `${r1}–${r2} reps` : "";
    if (sets >= 1 && sets <= 12 && reps >= 1) return { sets, reps, notes };
  }
  const of = text.match(SETS_OF_REPS);
  if (of) {
    const sets = Number(of[1]);
    const r1 = Number(of[2]);
    const r2 = of[3] ? Number(of[3]) : r1;
    const notes = r1 !== r2 ? `${r1}–${r2} reps` : "";
    if (sets >= 1 && sets <= 12 && r2 >= 1) return { sets, reps: r2, notes };
  }
  return null;
}

function stripScheme(name: string): string {
  return name
    .replace(SETS_X_REPS, " ")
    .replace(SETS_OF_REPS, " ")
    .replace(REST_RE, " ")
    .replace(RPE_RE, " ")
    .replace(WEIGHT_RE, " ")
    .replace(/\s*[-–—:|]+\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeTitle(line: string): boolean {
  const t = cleanLine(line);
  if (!t || t.length > 70) return false;
  if (isDayHead(t)) return false;
  if (parseScheme(t)) return false;
  if (/^\d/.test(t)) return false;
  return /program|ppl|upper.?lower|hypertrophy|strength|nippard|cbum|renaissance|template|split|block|wiki|gzclp|five.by.five|home/i.test(
    t,
  );
}

function parseExerciseLine(line: string): DraftExercise | null {
  const raw = cleanLine(line);
  if (!raw || raw.length < 3) return null;
  if (isDayHead(raw)) return null;
  if (/^rest\b/i.test(raw) && raw.length < 24) return null;
  const scheme = parseScheme(raw);
  const name = stripScheme(raw);
  if (!name || name.length < 2) return null;
  if (/^(sets?|reps?|rest|notes?|tempo|rpe|rir)$/i.test(name)) return null;
  const setsN = scheme?.sets ?? 3;
  const reps = scheme?.reps ?? 10;
  const rpe = raw.match(RPE_RE);
  const weightM = raw.match(WEIGHT_RE);
  const weight = weightM ? Number(weightM[1]) : null;
  const notes = [scheme?.notes, rpe ? `RPE ${rpe[1]}` : ""]
    .filter(Boolean)
    .join(" · ");
  return {
    name,
    notes,
    restSec: parseRest(raw),
    sets: Array.from({ length: setsN }, () => ({
      reps,
      weight: Number.isFinite(weight) ? weight : null,
      warmup: false,
    })),
  };
}

export function parseCoachProgramText(input: string): DraftPack {
  const lines = String(input ?? "")
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^[-_=]{3,}$/.test(l));

  let name = "Imported program";
  let i = 0;
  if (lines[0] && looksLikeTitle(lines[0])) {
    name = cleanLine(lines[0]);
    i = 1;
  } else if (lines[0] && !isDayHead(lines[0]) && !parseScheme(lines[0]) && lines[0].length <= 48) {
    const maybe = cleanLine(lines[0]);
    if (maybe && !parseExerciseLine(lines[0])) {
      name = maybe;
      i = 1;
    }
  }

  const days: DraftDay[] = [];

  const startDay = (label: string) => {
    days.push({ label, exercises: [] });
  };

  for (; i < lines.length; i++) {
    const line = lines[i];
    if (isDayHead(line)) {
      startDay(dayLabel(line, days.length));
      continue;
    }
    const ex = parseExerciseLine(line);
    if (!ex) continue;
    if (!days.length) startDay("Day 1");
    days[days.length - 1]?.exercises.push(ex);
  }

  const kept = days.filter((d) => d.exercises.length > 0);
  if (!kept.length) throw new Error("No lifts found in that program.");
  return { name: name.trim() || "Imported program", days: kept };
}

export const SAMPLE_PPL_TEXT = `Hypertrophy PPL

Day 1 — Push
Barbell Bench Press 3x8-10
Incline Dumbbell Press 3x10-12
Cable Fly 3x12-15
Overhead Press 3x8-10
Lateral Raise 3x12-15
Tricep Pushdown 3x10-12
Overhead Tricep Extension 3x10-12

Day 2 — Pull
Lat Pulldown 3x10-12
Barbell Row 3x8-10
Seated Cable Row 3x10-12
Face Pull 3x15-20
Dumbbell Curl 3x10-12
Hammer Curl 3x10-12

Day 3 — Legs
Back Squat 3x6-8
Romanian Deadlift 3x8-10
Walking Lunge 3x10-12
Leg Extension 3x12-15
Lying Leg Curl 3x10-12
Standing Calf Raise 4x10-15`;

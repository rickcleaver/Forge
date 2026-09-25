import { createServerFn } from "@tanstack/react-start";

export type PaperSet = {
  weight: number | null;
  reps: number | null;
  warmup: boolean;
};

export type PaperExercise = {
  name: string;
  sets: PaperSet[];
};

export type PaperLog = {
  name: string;
  date: string | null;
  unit: "lb" | "kg" | null;
  exercises: PaperExercise[];
};

const SYSTEM = `You read photos of handwritten or printed gym logs.
Return ONLY JSON, no markdown, no commentary, this shape:
{"name":"Push","date":"2026-08-20" or null,"unit":"lb" or "kg" or null,"exercises":[{"name":"Barbell Bench Press","sets":[{"weight":185,"reps":6,"warmup":false}]}]}
Rules:
- One object for the whole page. If several days, use the most complete session.
- name: short session title (Push, Legs, or the date).
- date: YYYY-MM-DD if visible, else null.
- unit: lb or kg if you can tell, else null.
- Use full lift names (Barbell Bench Press not BP).
- warmup true only if marked W, wu, warm-up, or a clearly light first set.
- weight null for bodyweight. reps null if unreadable.
- Skip doodles. Do not invent sets you cannot see.`;

function extractJson(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No JSON");
  return JSON.parse(raw.slice(start, end + 1));
}

function asNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalize(raw: unknown): PaperLog {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const unit = obj.unit === "kg" || obj.unit === "lb" ? obj.unit : null;
  const exercisesIn = Array.isArray(obj.exercises) ? obj.exercises : [];
  const exercises: PaperExercise[] = [];
  for (const item of exercisesIn) {
    const ex = item as Record<string, unknown>;
    const name = String(ex.name ?? "").trim();
    if (!name) continue;
    const setsIn = Array.isArray(ex.sets) ? ex.sets : [];
    const sets: PaperSet[] = setsIn.map((s) => {
      const row = s as Record<string, unknown>;
      return {
        weight: asNum(row.weight),
        reps: asNum(row.reps),
        warmup: Boolean(row.warmup),
      };
    });
    if (!sets.length) continue;
    exercises.push({ name, sets });
  }
  if (!exercises.length) throw new Error("No lifts found");
  return {
    name: String(obj.name ?? "Session").trim() || "Session",
    date: typeof obj.date === "string" && obj.date ? obj.date : null,
    unit,
    exercises,
  };
}

async function callModel(apiKey: string, model: string, image: string) {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 1200,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: "Read this gym log and return JSON only." },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
    }),
  });
  return res;
}

export const parsePaperLog = createServerFn({ method: "POST" })
  .validator((input: { image: string }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "Scan is not available here." };
    if (!data.image.startsWith("data:image/") || data.image.length > 1_800_000) {
      return { ok: false as const, error: "Photo is too large. Try a tighter shot." };
    }

    let res = await callModel(apiKey, "grok-4.6", data.image);
    if (!res.ok && (res.status === 400 || res.status === 404)) {
      res = await callModel(apiKey, "grok-4.5", data.image);
    }
    if (!res.ok) {
      return { ok: false as const, error: "Could not read that page. Try again in better light." };
    }
    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content ?? "";
    try {
      const log = normalize(extractJson(text));
      return { ok: true as const, log };
    } catch {
      return { ok: false as const, error: "Could not make sense of that page. Try a closer photo." };
    }
  });

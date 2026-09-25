import { createServerFn } from "@tanstack/react-start";
import { parseCoachProgramText, type DraftPack } from "./parse-coach-program";

const SYSTEM = `You read photos of printed or handwritten lifting programs (PPL, upper/lower, coach PDFs).
Return ONLY JSON, no markdown:
{"name":"Program name","days":[{"label":"Day 1 Push","exercises":[{"name":"Barbell Bench Press","sets":3,"reps":10,"repRange":"8-10","restSec":180,"rpe":"8"}]}]}
Rules:
- Split by day / workout headers (Day 1, Push, Pull, Legs, Upper, Lower).
- Full lift names. sets and reps are numbers. If a range like 8-10, reps = top of range and repRange = "8-10".
- restSec in seconds if rest is listed, else null.
- Skip warm-up cards, nutrition, and commentary. Do not invent lifts.`;

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

function normalize(raw: unknown): DraftPack {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const daysIn = Array.isArray(obj.days) ? obj.days : [];
  const days: DraftPack["days"] = [];
  for (const item of daysIn) {
    const day = item as Record<string, unknown>;
    const label = String(day.label ?? "").trim() || `Day ${days.length + 1}`;
    const exercisesIn = Array.isArray(day.exercises) ? day.exercises : [];
    const exercises: DraftPack["days"][number]["exercises"] = [];
    for (const row of exercisesIn) {
      const ex = row as Record<string, unknown>;
      const name = String(ex.name ?? "").trim();
      if (!name) continue;
      const setsN = Math.min(12, Math.max(1, asNum(ex.sets) ?? 3));
      const reps = asNum(ex.reps) ?? 10;
      const notes = [ex.repRange ? String(ex.repRange) + " reps" : "", ex.rpe ? `RPE ${ex.rpe}` : ""]
        .filter(Boolean)
        .join(" · ");
      exercises.push({
        name,
        notes,
        restSec: asNum(ex.restSec),
        sets: Array.from({ length: setsN }, () => ({ reps, weight: null, warmup: false })),
      });
    }
    if (exercises.length) days.push({ label, exercises });
  }
  if (!days.length) throw new Error("No days");
  return {
    name: String(obj.name ?? "Imported program").trim() || "Imported program",
    days,
  };
}

async function callModel(apiKey: string, model: string, image: string) {
  return fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 1800,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: "Read this lifting program and return JSON only." },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
    }),
  });
}

export const parseCoachProgramPhoto = createServerFn({ method: "POST" })
  .validator((input: { image: string }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "Photo import is not available here." };
    if (!data.image.startsWith("data:image/") || data.image.length > 1_800_000) {
      return { ok: false as const, error: "Photo is too large. Try a tighter shot." };
    }
    let res = await callModel(apiKey, "grok-4.6", data.image);
    if (!res.ok && (res.status === 400 || res.status === 404)) {
      res = await callModel(apiKey, "grok-4.5", data.image);
    }
    if (!res.ok) return { ok: false as const, error: "Could not read that page." };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content ?? "";
    try {
      const pack = normalize(extractJson(text));
      return { ok: true as const, pack };
    } catch {
      try {
        const pack = parseCoachProgramText(text);
        return { ok: true as const, pack };
      } catch {
        return { ok: false as const, error: "Could not make sense of that program photo." };
      }
    }
  });

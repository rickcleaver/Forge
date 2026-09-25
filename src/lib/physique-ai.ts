import { createServerFn } from "@tanstack/react-start";
import { weekMuscleAdvice, strengthProfile } from "./coach-engine";
import type { Session } from "./types";

export type PhysiqueReview = {
  note: string;
  focus: string[];
  strong: string[];
  score: number | null;
  angles?: Partial<Record<string, string>>;
};

const SYSTEM = `You are Forge, a sharp physique coach looking at weekly photos labeled front, back, left, right.
Study EACH photo. Comment on what you can actually see: shoulders vs chest vs midsection vs quads vs hamstrings vs glutes vs posture.
Be specific and useful. Never shame. Never estimate body fat %, weight, or medical issues.
If lighting or a mirror makes an angle unclear, say that angle is limited.
Return JSON only:
{
  "score": 70,
  "strong": ["back","quads"],
  "focus": ["shoulders","hamstrings"],
  "angles": {
    "front": "one sentence on front",
    "back": "one sentence on back",
    "left": "one sentence on left",
    "right": "one sentence on right"
  },
  "note": "4-7 sentences. What looks ahead, what lags, 2-3 lifts or set targets for the next 7 days."
}
score is a rough 55-90 visual-balance guess, not health.`;

export function reviewPhysiqueLocal(sessions: Session[]): PhysiqueReview {
  const week = weekMuscleAdvice(sessions);
  const profile = strengthProfile(sessions).sort((a, b) => a.score - b.score);
  const low = week.filter((w) => w.tone === "low").slice(0, 2);
  const focus = (low.length ? low.map((w) => w.label) : profile.slice(0, 2).map((p) => p.label)).filter(Boolean);
  const strong = profile
    .slice(-2)
    .reverse()
    .map((p) => p.label);
  const score = Math.round(profile.reduce((n, p) => n + p.score, 0) / Math.max(1, profile.length));
  const note = focus.length
    ? `From the log, ${focus.join(" and ")} are behind this week. Keep the big lifts, add 3–6 extra sets there.`
    : "Coverage looks even from the log. Photos are saved with this check-in.";
  return { note, focus, strong, score };
}

export const reviewPhysique = createServerFn({ method: "POST" })
  .validator((input: { photos: Record<string, string>; snapshot: string }) => input)
  .handler(async ({ data }) => {
    let sessions: Session[] = [];
    try {
      const parsed = JSON.parse(data.snapshot) as unknown;
      sessions = Array.isArray(parsed) ? (parsed as Session[]) : [];
    } catch {
      sessions = [];
    }
    const fallback = reviewPhysiqueLocal(sessions.slice(0, 40));
    const apiKey = process.env.XAI_API_KEY;
    const shots = Object.entries(data.photos).filter(
      ([, src]) => typeof src === "string" && src.startsWith("data:image/") && src.length < 1_800_000,
    );
    if (!apiKey || shots.length < 2) {
      return { ok: true as const, ...fallback, source: "local" as const };
    }

    const labeled = [
      {
        type: "text" as const,
        text: `Examine every angle. Poses attached in order: ${shots.map(([p]) => p).join(", ")}. Recent training: ${data.snapshot.slice(0, 1800)}`,
      },
      ...shots.flatMap(([pose, url]) => [
        { type: "text" as const, text: `This photo is the ${pose} view.` },
        { type: "image_url" as const, image_url: { url } },
      ]),
    ];

    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.6",
          temperature: 0.4,
          max_tokens: 900,
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: labeled },
          ],
        }),
      });
      if (!res.ok) return { ok: true as const, ...fallback, source: "local" as const };
      const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const raw = body.choices?.[0]?.message?.content ?? "";
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start < 0 || end <= start) return { ok: true as const, ...fallback, source: "local" as const };
      const parsed = JSON.parse(raw.slice(start, end + 1)) as Partial<PhysiqueReview>;
      const angles =
        parsed.angles && typeof parsed.angles === "object"
          ? Object.fromEntries(
              Object.entries(parsed.angles)
                .filter(([, v]) => typeof v === "string")
                .map(([k, v]) => [k, String(v)]),
            )
          : undefined;
      return {
        ok: true as const,
        note: typeof parsed.note === "string" ? parsed.note : fallback.note,
        focus: Array.isArray(parsed.focus) ? parsed.focus.map(String).slice(0, 4) : fallback.focus,
        strong: Array.isArray(parsed.strong) ? parsed.strong.map(String).slice(0, 4) : fallback.strong,
        score: typeof parsed.score === "number" ? Math.round(parsed.score) : fallback.score,
        angles,
        source: "ai" as const,
      };
    } catch {
      return { ok: true as const, ...fallback, source: "local" as const };
    }
  });

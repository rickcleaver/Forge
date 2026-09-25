import { createServerFn } from "@tanstack/react-start";
import { localCoachAnswer, type CoachSnapshot } from "./coach";

export type CoachTurn = { role: "user" | "assistant"; content: string };

const SYSTEM = `You are Forge, a helpful chat — like Grok, not a script.
Answer whatever they asked: training, food, sleep, work, life, jokes, how-to, everyday stuff.
Use the training log only when the question is about lifting, recovery, or progress. Otherwise ignore it.
Never invent loads or sessions. No medical diagnosis.
Chest pain, fainting, or a crisis: tell them to get a clinician or call 988, then stop.
Write complete sentences with normal spaces and punctuation. Never glue words together (bad: "Youcantry"; good: "You can try").
2–6 sentences unless they asked for a list. Be direct. Don't force a workout onto a non-gym question.`;

const FAST_MODELS = ["grok-4-fast", "grok-4-1-fast", "grok-3-mini"];

function slim(s: CoachSnapshot) {
  return {
    sessions: s.sessionsTotal,
    weeks: s.weeksLogged,
    thisWeek: s.thisWeekSessions,
    days: s.daysTrainedThisWeek,
    volThis: Math.round(s.thisWeekVolume),
    volLast: Math.round(s.lastWeekVolume),
    volPct: s.volumeChangePct,
    hardWeeks: s.hardWeeks,
    lifts: s.lifts.slice(0, 6).map((l) => ({
      n: l.name,
      e1: l.latest,
      pct: l.changePct,
      flat: l.weeksFlat,
    })),
  };
}

export function cleanReply(raw: string): string {
  let t = raw.replace(/\u00a0/g, " ").replace(/\r/g, "").trim();
  t = t.replace(/[ \t]+\n/g, "\n");
  t = t.replace(/\n{3,}/g, "\n\n");
  t = t.replace(/([.!?])([A-Za-z])/g, "$1 $2");
  t = t.replace(/,([^\s])/g, ", $1");
  t = t.replace(/;([^\s])/g, "; $1");
  t = t.replace(/([a-z])([A-Z][a-z])/g, "$1 $2");
  t = t.replace(/ {2,}/g, " ");
  return t.trim();
}

async function complete(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  extra: Record<string, unknown> = {},
) {
  return fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      max_tokens: 420,
      messages,
      ...extra,
    }),
    signal: AbortSignal.timeout(12000),
  });
}

export const askForgeCoach = createServerFn({ method: "POST" })
  .validator((input: { question: string; snapshot: CoachSnapshot; history?: CoachTurn[] }) => input)
  .handler(async ({ data }) => {
    const fallback = localCoachAnswer(data.question, data.snapshot);
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: true as const, answer: fallback, source: "local" as const };

    const shot = slim(data.snapshot);
    const prior = (data.history ?? []).slice(-16).map((t) => ({
      role: t.role,
      content: t.content,
    }));
    const messages = [
      {
        role: "system",
        content: `${SYSTEM}\n\nTraining log (use only if relevant): ${JSON.stringify(shot)}`,
      },
      ...prior,
      { role: "user", content: data.question },
    ];

    for (const model of FAST_MODELS) {
      try {
        const res = await complete(apiKey, model, messages);
        if (res.status === 404 || res.status === 400) continue;
        if (!res.ok) continue;
        const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const text = cleanReply(body.choices?.[0]?.message?.content ?? "");
        if (text.length < 8) continue;
        return { ok: true as const, answer: text, source: "ai" as const };
      } catch {
        continue;
      }
    }
    return { ok: true as const, answer: fallback, source: "local" as const };
  });

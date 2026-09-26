import { formatDistanceToNowStrict } from "date-fns";
import { realSessions } from "./demo-sessions";
import { trainingStreak, trainedToday } from "./player-progress";
import { planLabel } from "./week-plan";
import type { Program, ReadinessLog, Session, Settings } from "./types";

export type CoachTipSource = "streak" | "last-session" | "sleep" | "program";

export type CoachOpenTip = {
  id: string;
  text: string;
  source: CoachTipSource;
};

export type CoachTipContext = {
  sessions: Session[];
  readiness: ReadinessLog[];
  settings: Settings;
  programs: Program[];
  /** Prefer Health Connect sleep when a recent readiness row exists. */
  now?: number;
};

const DAY_KEY = "forge-coach-tip-day";
const TIP_ID_KEY = "forge-coach-tip-id";

function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function coachTipShownToday(now = Date.now()): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DAY_KEY) === todayKey(new Date(now));
  } catch {
    return false;
  }
}

export function markCoachTipShown(tipId: string, now = Date.now()): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DAY_KEY, todayKey(new Date(now)));
    window.localStorage.setItem(TIP_ID_KEY, tipId);
  } catch {
    /* ignore */
  }
}

function latestReadiness(logs: ReadinessLog[], now: number): ReadinessLog | null {
  const fresh = logs
    .filter((r) => now - r.at < 36 * 3600_000)
    .sort((a, b) => b.at - a.at);
  return fresh[0] ?? null;
}

function lastFinished(sessions: Session[]): Session | null {
  const finished = realSessions(sessions)
    .filter((s) => s.finishedAt)
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));
  return finished[0] ?? null;
}

/**
 * Short Coach tip for app open — only when grounded in real data.
 * Returns null when there is nothing useful (no pep-talk filler).
 */
export function pickCoachOpenTip(ctx: CoachTipContext): CoachOpenTip | null {
  const now = ctx.now ?? Date.now();
  const sessions = realSessions(ctx.sessions);
  const name = ctx.settings.displayName?.trim() || null;
  const hi = name ? `${name}, ` : "";

  const ready = latestReadiness(ctx.readiness, now);
  if (ready && ready.sleepHrs > 0 && ready.sleepHrs < 6.5) {
    return {
      id: `sleep-${todayKey(new Date(now))}`,
      source: "sleep",
      text: `${hi}you logged ~${ready.sleepHrs.toFixed(1)}h sleep. Keep today’s session short and own the form — recovery first.`,
    };
  }
  if (ready && ready.score < 50) {
    return {
      id: `ready-${todayKey(new Date(now))}`,
      source: "sleep",
      text: `${hi}check-in came in soft (${ready.score}/100). Lighter loads still count — leave one in the tank.`,
    };
  }

  const streak = trainingStreak(sessions, now);
  if (streak >= 3) {
    const trained = trainedToday(sessions, now);
    return {
      id: `streak-${streak}-${todayKey(new Date(now))}`,
      source: "streak",
      text: trained
        ? `${hi}that’s a ${streak}-day streak and today’s already in the log. Protect it — sleep and food tonight.`
        : `${hi}you’re on a ${streak}-day streak. One honest session keeps the chain alive.`,
    };
  }

  const last = lastFinished(sessions);
  if (last?.finishedAt) {
    const ago = formatDistanceToNowStrict(last.finishedAt, { addSuffix: true });
    const hours = (now - last.finishedAt) / 3600_000;
    if (hours < 18) {
      return {
        id: `last-${last.id}`,
        source: "last-session",
        text: `${hi}nice work on ${last.name} ${ago}. Soft walk + protein beats scrolling the recovery away.`,
      };
    }
    if (hours >= 36 && hours < 96) {
      return {
        id: `comeback-${last.id}`,
        source: "last-session",
        text: `${hi}last lift was ${last.name} ${ago}. Tap Train when you’re ready — Forge kept the log warm.`,
      };
    }
  }

  const plan = ctx.settings.weekPlan?.[new Date(now).getDay()];
  const label = planLabel(plan, ctx.programs);
  if (plan && !plan.rest && label) {
    return {
      id: `program-${label}-${todayKey(new Date(now))}`,
      source: "program",
      text: `${hi}today’s on the board: ${label}. Open Train when you want to start logging.`,
    };
  }
  if (plan?.rest) {
    // Only tip on rest if we have a streak or recent session — still grounded.
    if (streak >= 1 || last) {
      return {
        id: `rest-${todayKey(new Date(now))}`,
        source: "program",
        text: `${hi}plan says rest day. Optional light work is fine — the streak cares that you showed up this week.`,
      };
    }
  }

  return null;
}

/** Pick tip only if not already shown today. */
export function coachTipForOpen(ctx: CoachTipContext): CoachOpenTip | null {
  if (coachTipShownToday(ctx.now)) return null;
  return pickCoachOpenTip(ctx);
}

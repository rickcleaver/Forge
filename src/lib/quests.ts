import type { Session } from "./types";
import { sessionPrNames, sessionSetCount } from "./stats";

export type QuestId =
  | "setup"
  | "first-start"
  | "first-set"
  | "sets-10"
  | "first-finish"
  | "first-pr"
  | "open-muscles"
  | "open-programs"
  | "circle-buddy";

export type QuestTone = "lime" | "blue" | "orange" | "purple" | "pink" | "cyan";

export type QuestDef = {
  id: QuestId;
  title: string;
  description: string;
  target: number;
  rewardXp: number;
  rewardGems: number;
  tone: QuestTone;
};

/** Demo seed sessions (id starts with seed-) never count toward quest proof. */
export function isDemoSession(session: { id: string }): boolean {
  return session.id.startsWith("seed-");
}

export function realSessions(sessions: Session[]): Session[] {
  return sessions.filter((s) => !isDemoSession(s));
}

/** Canonical starter quests — progress is derived from real app state only. */
export const QUEST_DEFS: QuestDef[] = [
  {
    id: "setup",
    title: "Welcome quest",
    description: "Finish setup so Forge can build your week.",
    target: 1,
    rewardXp: 40,
    rewardGems: 25,
    tone: "lime",
  },
  {
    id: "first-start",
    title: "Hit the floor",
    description: "Start your first workout — short ones still count.",
    target: 1,
    rewardXp: 30,
    rewardGems: 15,
    tone: "blue",
  },
  {
    id: "first-set",
    title: "Log a set",
    description: "Check off one real set. Logging stays one-tap fast.",
    target: 1,
    rewardXp: 25,
    rewardGems: 15,
    tone: "orange",
  },
  {
    id: "sets-10",
    title: "Ten honest sets",
    description: "Log 10 sets across any of your sessions.",
    target: 10,
    rewardXp: 60,
    rewardGems: 30,
    tone: "cyan",
  },
  {
    id: "first-finish",
    title: "Finish strong",
    description: "End a session so it lands in your log.",
    target: 1,
    rewardXp: 50,
    rewardGems: 30,
    tone: "purple",
  },
  {
    id: "first-pr",
    title: "First PR",
    description: "Beat a previous best on any lift.",
    target: 1,
    rewardXp: 80,
    rewardGems: 40,
    tone: "pink",
  },
  {
    id: "open-muscles",
    title: "Check the map",
    description: "Open the muscle map and see what you've hit.",
    target: 1,
    rewardXp: 20,
    rewardGems: 10,
    tone: "blue",
  },
  {
    id: "open-programs",
    title: "Browse programs",
    description: "Peek at the Programs shelf for a starter plan.",
    target: 1,
    rewardXp: 20,
    rewardGems: 10,
    tone: "orange",
  },
  {
    id: "circle-buddy",
    title: "Invite a buddy",
    description: "Add someone in Circles — accountability without a feed.",
    target: 1,
    rewardXp: 35,
    rewardGems: 20,
    tone: "lime",
  },
];

const QUEST_ID_SET = new Set<string>(QUEST_DEFS.map((d) => d.id));

export function isQuestId(id: unknown): id is QuestId {
  return typeof id === "string" && QUEST_ID_SET.has(id);
}

export type PlayerFlags = {
  visitedMuscles: boolean;
  visitedPrograms: boolean;
  addedCircleBuddy: boolean;
};

export type PlayerProgress = {
  xp: number;
  gems: number;
  claimedQuestIds: QuestId[];
  flags: PlayerFlags;
};

export const DEFAULT_PLAYER: PlayerProgress = {
  xp: 0,
  gems: 0,
  claimedQuestIds: [],
  flags: {
    visitedMuscles: false,
    visitedPrograms: false,
    addedCircleBuddy: false,
  },
};

export type QuestView = QuestDef & {
  progress: number;
  claimable: boolean;
  claimed: boolean;
};

/**
 * Progress is proof-only:
 * - Demo seed sessions never count
 * - Sets require completed non-warmup rows
 * - Visit / buddy flags must be set by real UI actions (or hasCircleBuddy)
 * - Claimable only when progress >= target AND not already claimed
 */
export function evaluateQuests(opts: {
  setupDone: boolean;
  sessions: Session[];
  player: PlayerProgress;
  /** Prefer live Circles buddy count over the mutable flag when available. */
  hasCircleBuddy?: boolean;
}): QuestView[] {
  const { setupDone, player } = opts;
  const sessions = realSessions(opts.sessions);
  const started = sessions.length > 0;
  const sets = sessions.reduce((n, s) => n + sessionSetCount(s), 0);
  const finished = sessions.filter((s) => s.finishedAt);
  const anyPr = finished.some((s) => sessionPrNames(s, sessions).length > 0);
  const circleDone =
    opts.hasCircleBuddy === true ||
    (opts.hasCircleBuddy !== false && player.flags.addedCircleBuddy);

  const progressOf: Record<QuestId, number> = {
    setup: setupDone ? 1 : 0,
    "first-start": started ? 1 : 0,
    "first-set": sets >= 1 ? 1 : 0,
    "sets-10": Math.min(10, sets),
    "first-finish": finished.length >= 1 ? 1 : 0,
    "first-pr": anyPr ? 1 : 0,
    "open-muscles": player.flags.visitedMuscles ? 1 : 0,
    "open-programs": player.flags.visitedPrograms ? 1 : 0,
    "circle-buddy": circleDone ? 1 : 0,
  };

  return QUEST_DEFS.map((def) => {
    const progress = progressOf[def.id] ?? 0;
    const claimed = player.claimedQuestIds.includes(def.id);
    const claimable = !claimed && progress >= def.target;
    return { ...def, progress, claimable, claimed };
  });
}

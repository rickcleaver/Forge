import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_PLAYER,
  evaluateQuests,
  isDemoSession,
  isQuestId,
  QUEST_DEFS,
  type PlayerProgress,
  type QuestId,
} from "./quests.ts";
import type { Session, SetEntry, ExerciseLog } from "./types.ts";

function mkSet(partial: Partial<SetEntry> & { completed: boolean }): SetEntry {
  return {
    id: partial.id ?? `set-${Math.random()}`,
    weight: partial.weight ?? 100,
    reps: partial.reps ?? 8,
    completed: partial.completed,
    warmup: partial.warmup ?? false,
    durationMin: null,
    distance: null,
  };
}

function mkEx(name: string, sets: SetEntry[]): ExerciseLog {
  return {
    id: `ex-${name}`,
    libraryId: null,
    name,
    muscles: ["chest"],
    notes: "",
    photos: [],
    restSec: null,
    sets,
  };
}

function mkSession(opts: {
  id: string;
  finished?: boolean;
  sets?: SetEntry[];
  name?: string;
}): Session {
  const sets = opts.sets ?? [];
  return {
    id: opts.id,
    name: opts.name ?? "Session",
    startedAt: Date.now() - 3_600_000,
    finishedAt: opts.finished ? Date.now() : null,
    liveAt: opts.finished ? Date.now() - 3_000_000 : Date.now() - 1000,
    notes: "",
    photo: null,
    exercises: sets.length ? [mkEx("Bench", sets)] : [],
  };
}

function player(partial: Partial<PlayerProgress> = {}): PlayerProgress {
  return {
    ...DEFAULT_PLAYER,
    ...partial,
    flags: { ...DEFAULT_PLAYER.flags, ...(partial.flags ?? {}) },
    claimedQuestIds: [...(partial.claimedQuestIds ?? [])],
  };
}

test("seed demo sessions are not quest proof", () => {
  assert.equal(isDemoSession({ id: "seed-push" }), true);
  assert.equal(isDemoSession({ id: "seed-legs" }), true);
  assert.equal(isDemoSession({ id: "abc123" }), false);

  const seed = mkSession({
    id: "seed-push",
    finished: true,
    sets: Array.from({ length: 12 }, (_, i) => mkSet({ id: `s${i}`, completed: true })),
  });
  const views = evaluateQuests({
    setupDone: false,
    sessions: [seed],
    player: player(),
  });
  for (const id of ["first-start", "first-set", "sets-10", "first-finish"] as QuestId[]) {
    const q = views.find((v) => v.id === id)!;
    assert.equal(q.progress, 0, `${id} must ignore seed`);
    assert.equal(q.claimable, false);
  }
});

test("each incomplete quest is not claimable", () => {
  const views = evaluateQuests({
    setupDone: false,
    sessions: [],
    player: player(),
    hasCircleBuddy: false,
  });
  assert.equal(views.length, QUEST_DEFS.length);
  for (const q of views) {
    assert.equal(q.claimable, false, q.id);
    assert.equal(q.claimed, false, q.id);
    assert.ok(q.progress < q.target, q.id);
  }
});

test("completed quests are claimable once; claimed blocks re-claim", () => {
  const real = mkSession({
    id: "user-1",
    finished: true,
    sets: [mkSet({ completed: true }), mkSet({ completed: true })],
  });
  const base = evaluateQuests({
    setupDone: true,
    sessions: [real],
    player: player({
      flags: { visitedMuscles: true, visitedPrograms: true, addedCircleBuddy: false },
    }),
    hasCircleBuddy: true,
  });
  const claimableIds = base.filter((q) => q.claimable).map((q) => q.id);
  assert.ok(claimableIds.includes("setup"));
  assert.ok(claimableIds.includes("first-start"));
  assert.ok(claimableIds.includes("first-set"));
  assert.ok(claimableIds.includes("first-finish"));
  assert.ok(claimableIds.includes("open-muscles"));
  assert.ok(claimableIds.includes("open-programs"));
  assert.ok(claimableIds.includes("circle-buddy"));

  const after = evaluateQuests({
    setupDone: true,
    sessions: [real],
    player: player({
      claimedQuestIds: claimableIds,
      flags: { visitedMuscles: true, visitedPrograms: true, addedCircleBuddy: true },
    }),
    hasCircleBuddy: true,
  });
  for (const q of after) {
    if (claimableIds.includes(q.id)) {
      assert.equal(q.claimed, true, q.id);
      assert.equal(q.claimable, false, q.id);
    }
  }
});

test("first-set requires a completed non-warmup set", () => {
  const empty = mkSession({ id: "u1", sets: [] });
  const warmupOnly = mkSession({
    id: "u2",
    sets: [mkSet({ completed: true, warmup: true })],
  });
  const incomplete = mkSession({
    id: "u3",
    sets: [mkSet({ completed: false })],
  });
  const real = mkSession({
    id: "u4",
    sets: [mkSet({ completed: true })],
  });
  for (const s of [empty, warmupOnly, incomplete]) {
    const q = evaluateQuests({ setupDone: false, sessions: [s], player: player() }).find(
      (v) => v.id === "first-set",
    )!;
    assert.equal(q.claimable, false, s.id);
  }
  const ok = evaluateQuests({ setupDone: false, sessions: [real], player: player() }).find(
    (v) => v.id === "first-set",
  )!;
  assert.equal(ok.claimable, true);
  assert.equal(ok.progress, 1);
});

test("sets-10 progress is honest capped count", () => {
  const sets = Array.from({ length: 7 }, (_, i) => mkSet({ id: `s${i}`, completed: true }));
  const s = mkSession({ id: "u", sets });
  const q = evaluateQuests({ setupDone: false, sessions: [s], player: player() }).find(
    (v) => v.id === "sets-10",
  )!;
  assert.equal(q.progress, 7);
  assert.equal(q.claimable, false);
});

test("circle-buddy prefers hasCircleBuddy over stale flag", () => {
  const flagged = evaluateQuests({
    setupDone: false,
    sessions: [],
    player: player({ flags: { ...DEFAULT_PLAYER.flags, addedCircleBuddy: true } }),
    hasCircleBuddy: false,
  }).find((v) => v.id === "circle-buddy")!;
  assert.equal(flagged.claimable, false);

  const live = evaluateQuests({
    setupDone: false,
    sessions: [],
    player: player(),
    hasCircleBuddy: true,
  }).find((v) => v.id === "circle-buddy")!;
  assert.equal(live.claimable, true);
});

test("isQuestId validates known ids only", () => {
  assert.equal(isQuestId("first-set"), true);
  assert.equal(isQuestId("nope"), false);
  assert.equal(isQuestId(1), false);
});

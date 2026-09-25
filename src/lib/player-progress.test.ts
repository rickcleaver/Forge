import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { startOfDay } from "date-fns";
import {
  bestTrainingStreak,
  recentDayChips,
  trainedToday,
  trainingStreak,
} from "./player-progress.ts";
import type { Session } from "./types.ts";

function sessionOn(dayOffset: number, id = `s-${dayOffset}`): Session {
  const day = startOfDay(Date.now()).getTime() - dayOffset * 86_400_000;
  return {
    id,
    name: "Lift",
    startedAt: day + 3_600_000,
    finishedAt: day + 5_000_000,
    liveAt: day + 3_600_000,
    notes: "",
    photo: null,
    exercises: [],
  };
}

describe("training streaks", () => {
  it("counts consecutive finished days ending today", () => {
    const sessions = [sessionOn(0), sessionOn(1), sessionOn(2)];
    assert.equal(trainingStreak(sessions), 3);
  });

  it("allows yesterday start when today is empty", () => {
    const sessions = [sessionOn(1), sessionOn(2)];
    assert.equal(trainingStreak(sessions), 2);
    assert.equal(trainedToday(sessions), false);
  });

  it("best streak finds the longest run even if current is 0", () => {
    // gap: trained 5 and 4 days ago (2-run), then nothing recent
    const sessions = [sessionOn(5), sessionOn(4), sessionOn(10)];
    assert.equal(trainingStreak(sessions), 0);
    assert.equal(bestTrainingStreak(sessions), 2);
  });

  it("recentDayChips marks trained days", () => {
    const sessions = [sessionOn(0), sessionOn(2)];
    const chips = recentDayChips(sessions, 7);
    assert.equal(chips.length, 7);
    assert.equal(chips[chips.length - 1]!.isToday, true);
    assert.equal(chips[chips.length - 1]!.trained, true);
    assert.equal(chips[chips.length - 3]!.trained, true);
  });
});

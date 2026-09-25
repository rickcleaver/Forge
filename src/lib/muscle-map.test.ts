import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hitsFromExerciseIds,
  hitsFromMuscles,
  hitsFromProgramExercises,
  hitsFromWorkoutText,
} from "../components/muscle-map";

describe("muscle-map hits helpers", () => {
  it("hitsFromMuscles skips cardio and marks regions", () => {
    const hits = hitsFromMuscles(["chest", "quads", "cardio"]);
    assert.equal(hits.chest, 8);
    assert.equal(hits.quads, 8);
    assert.equal(hits.cardio, undefined);
  });

  it("hitsFromProgramExercises accumulates by muscle", () => {
    const hits = hitsFromProgramExercises([
      {
        libraryId: null,
        name: "Bench",
        muscles: ["chest", "shoulders"],
        sets: [],
      },
      {
        libraryId: null,
        name: "Fly",
        muscles: ["chest"],
        sets: [],
      },
    ]);
    assert.equal(hits.chest, 12);
    assert.equal(hits.shoulders, 6);
  });

  it("hitsFromExerciseIds is stable for unknown ids", () => {
    const hits = hitsFromExerciseIds(["not-a-real-exercise"]);
    assert.deepEqual(hits, {});
  });

  it("hitsFromWorkoutText ignores short / day headers", () => {
    const hits = hitsFromWorkoutText("Day 1\nab\nBarbell Bench Press 3x8\n");
    assert.ok(hits);
    assert.equal(hits.cardio, undefined);
  });
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCoachProgramText, SAMPLE_PPL_TEXT } from "./parse-coach-program.ts";

test("splits Nippard-style days and 3x8-10 schemes", () => {
  const pack = parseCoachProgramText(`Jeff Nippard PPL

Day 1 - Push
Barbell Bench Press 3x8-10
Incline Dumbbell Press 3 x 10-12
Lateral Raise 4x12-15 @ RPE 8

Day 2 - Pull
Lat Pulldown 3x10-12
Barbell Row 3x8`);
  assert.equal(pack.name, "Jeff Nippard PPL");
  assert.equal(pack.days.length, 2);
  assert.match(pack.days[0].label, /push/i);
  assert.equal(pack.days[0].exercises.length, 3);
  assert.equal(pack.days[0].exercises[0].sets.length, 3);
  assert.equal(pack.days[0].exercises[0].sets[0].reps, 10);
  assert.match(pack.days[0].exercises[0].notes, /8/);
  assert.equal(pack.days[1].exercises.length, 2);
});

test("single day with no header still imports", () => {
  const pack = parseCoachProgramText(`Bench Press 3x8
Squat 5x5`);
  assert.equal(pack.days.length, 1);
  assert.equal(pack.days[0].exercises.length, 2);
  assert.equal(pack.days[0].exercises[1].sets.length, 5);
});

test("sample PPL has three training days", () => {
  const pack = parseCoachProgramText(SAMPLE_PPL_TEXT);
  assert.equal(pack.days.length, 3);
  assert.ok(pack.days.every((d) => d.exercises.length >= 5));
});

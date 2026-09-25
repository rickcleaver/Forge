import assert from "node:assert/strict";
import { test } from "node:test";
import { parseQuickLog } from "./parse-quick-log.ts";

test("parses gym shorthand", () => {
  assert.deepEqual(parseQuickLog("185 for 8"), { weight: 185, reps: 8 });
  assert.deepEqual(parseQuickLog("185x8"), { weight: 185, reps: 8 });
  assert.deepEqual(parseQuickLog("185 x 8"), { weight: 185, reps: 8 });
  assert.deepEqual(parseQuickLog("8 at 225"), { weight: 225, reps: 8 });
  assert.deepEqual(parseQuickLog("315 lbs 3 reps"), { weight: 315, reps: 3 });
  assert.deepEqual(parseQuickLog("bw 12"), { weight: 0, reps: 12 });
});

test("parses spoken number words", () => {
  assert.deepEqual(parseQuickLog("one eighty five for eight"), { weight: 185, reps: 8 });
});

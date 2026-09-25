import assert from "node:assert/strict";
import { test } from "node:test";
import {
  healthFromBridge,
  normalizeSnapshot,
  parseHealthImport,
  stepsFromQuery,
} from "./health-connect.ts";

test("bridge payload requires forge-health type or health-connect source", () => {
  assert.equal(healthFromBridge({ steps: 100 }), null);
  const snap = healthFromBridge({ type: "forge-health", steps: 8421, weightLb: 170 });
  assert.ok(snap);
  assert.equal(snap.steps, 8421);
  assert.equal(snap.weightLb, 170);
});

test("query param steps", () => {
  assert.equal(stepsFromQuery("?healthSteps=9000"), 9000);
  assert.equal(stepsFromQuery("?foo=1"), null);
});

test("JSON import", () => {
  const ok = parseHealthImport(JSON.stringify({ steps: 5000, sleepHrs: 7.5 }));
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.snap.steps, 5000);
    assert.equal(ok.snap.sleepHrs, 7.5);
  }
});

test("CSV import", () => {
  const ok = parseHealthImport("steps,weightLb\n12345,168.2\n");
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.snap.steps, 12345);
    assert.equal(ok.snap.weightLb, 168.2);
  }
});

test("empty import fails honestly", () => {
  const bad = parseHealthImport("");
  assert.equal(bad.ok, false);
});

test("normalize rejects junk weight", () => {
  const snap = normalizeSnapshot({ steps: 10, weightLb: 5 }, "import");
  assert.ok(snap);
  assert.equal(snap.weightLb, undefined);
  assert.equal(snap.steps, 10);
});

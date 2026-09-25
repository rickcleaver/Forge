import assert from "node:assert/strict";
import { test } from "node:test";
import {
  describeHealthCapability,
  healthFromBridge,
  normalizeSnapshot,
  parseHealthImport,
  snapshotFromPluginResult,
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

test("snapshotFromPluginResult maps HC read fields", () => {
  const snap = snapshotFromPluginResult({
    type: "forge-health",
    source: "health-connect",
    steps: 4321,
    weightLb: 172.4,
    sleepHrs: 7.2,
    restingHr: 54,
  });
  assert.ok(snap);
  assert.equal(snap.steps, 4321);
  assert.equal(snap.weightLb, 172.4);
  assert.equal(snap.sleepHrs, 7.2);
  assert.equal(snap.restingHr, 54);
  assert.equal(snap.source, "bridge");
});

test("snapshotFromPluginResult rejects empty payload", () => {
  assert.equal(snapshotFromPluginResult({ type: "forge-health", source: "health-connect" }), null);
});

test("describeHealthCapability stays honest for web", () => {
  const text = describeHealthCapability(null);
  assert.match(text, /cannot read Health Connect|Import|native/i);
});

test("describeHealthCapability reflects permitted native shell", () => {
  const text = describeHealthCapability({
    native: true,
    healthConnectReady: true,
    available: true,
    permissionsGranted: true,
    sdkStatus: "available",
  });
  assert.match(text, /permissions granted|Sync from HC/i);
});

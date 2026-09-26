import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pickCoachOpenTip } from "./coach-tip.ts";
import type { Program, ReadinessLog, Session, Settings } from "./types.ts";
import { startOfDay } from "date-fns";

function sessionOn(dayOffset: number, name = "Push"): Session {
  const day = startOfDay(Date.now()).getTime() - dayOffset * 86_400_000;
  return {
    id: `real-${dayOffset}`,
    name,
    startedAt: day + 3_600_000,
    finishedAt: day + 5_000_000,
    liveAt: day + 3_600_000,
    notes: "",
    photo: null,
    exercises: [],
  };
}

const settings = {
  displayName: "Kai",
  ageYears: 16,
  heightCm: 175,
  bodyWeightLb: 150,
  goal: "muscle",
  weekPlan: Array.from({ length: 7 }, () => ({ rest: false, templateId: "push", programId: null })),
} as Settings;

describe("pickCoachOpenTip", () => {
  it("returns null with no grounded data", () => {
    const tip = pickCoachOpenTip({
      sessions: [],
      readiness: [],
      settings: { displayName: null, weekPlan: [] } as unknown as Settings,
      programs: [],
    });
    assert.equal(tip, null);
  });

  it("grounds in low sleep", () => {
    const readiness: ReadinessLog[] = [
      { id: "r1", at: Date.now() - 1000, sleepHrs: 5.5, energy: 4, soreness: 5, stress: 5, score: 48 },
    ];
    const tip = pickCoachOpenTip({ sessions: [], readiness, settings, programs: [] });
    assert.ok(tip);
    assert.equal(tip!.source, "sleep");
    assert.match(tip!.text, /5\.5h sleep/);
    assert.match(tip!.text, /Kai/);
  });

  it("grounds in streak", () => {
    const sessions = [sessionOn(0), sessionOn(1), sessionOn(2)];
    const tip = pickCoachOpenTip({ sessions, readiness: [], settings, programs: [] });
    assert.ok(tip);
    assert.equal(tip!.source, "streak");
    assert.match(tip!.text, /3-day streak/);
  });

  it("grounds in next program day", () => {
    const tip = pickCoachOpenTip({
      sessions: [],
      readiness: [],
      settings,
      programs: [] as Program[],
    });
    assert.ok(tip);
    assert.equal(tip!.source, "program");
    assert.match(tip!.text, /Push/);
    assert.match(tip!.text, /build muscle/);
  });

  it("ignores demo seed sessions for last-session tips", () => {
    const seed: Session = {
      ...sessionOn(0, "Seed Push"),
      id: "seed-push",
    };
    const tip = pickCoachOpenTip({
      sessions: [seed],
      readiness: [],
      settings: { displayName: "Kai", weekPlan: [] } as unknown as Settings,
      programs: [],
    });
    assert.equal(tip, null);
  });
});

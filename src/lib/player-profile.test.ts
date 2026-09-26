import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  athleteCard,
  athleteCardCue,
  isPlayerProfileComplete,
  normalizeAgeYears,
  normalizeDisplayName,
} from "./player-profile.ts";
import type { Settings } from "./types.ts";

const base = {
  displayName: null,
  ageYears: null,
  heightCm: null,
  bodyWeightLb: null,
} as Pick<Settings, "displayName" | "ageYears" | "heightCm" | "bodyWeightLb">;

describe("player profile", () => {
  it("incomplete until all four fields land", () => {
    assert.equal(isPlayerProfileComplete(base), false);
    assert.equal(
      isPlayerProfileComplete({ ...base, displayName: "Kai", ageYears: 16, heightCm: 170, bodyWeightLb: 140 }),
      true,
    );
    assert.equal(
      isPlayerProfileComplete({ ...base, displayName: "Kai", ageYears: 16, heightCm: 170, bodyWeightLb: null }),
      false,
    );
  });

  it("normalizes name and age", () => {
    assert.equal(normalizeDisplayName("  Neo  "), "Neo");
    assert.equal(normalizeDisplayName("   "), null);
    assert.equal(normalizeAgeYears(15.6), 16);
    assert.equal(normalizeAgeYears(9), null);
    assert.equal(normalizeAgeYears(100), null);
  });

  it("athleteCard includes goal and cue", () => {
    const card = athleteCard({
      displayName: "  Zara ",
      ageYears: 17,
      heightCm: 165,
      bodyWeightLb: 130,
      goal: "muscle",
    } as Settings);
    assert.equal(card.name, "Zara");
    assert.equal(card.age, 17);
    assert.equal(card.goal, "muscle");
    const cue = athleteCardCue(card);
    assert.ok(cue);
    assert.match(cue!, /Zara/);
    assert.match(cue!, /build muscle/);
    assert.match(cue!, /165cm/);
  });
});

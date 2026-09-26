import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildWeekFromOnboarding,
  crewTipForDay,
  dayIndex,
  isPlanSet,
  planChip,
  planKind,
  planLabel,
  todayPlan,
  weekPlanCounts,
  weekPlanSummaryLine,
} from "./week-plan.ts";
import type { DayPlan, Program } from "./types.ts";

const REST: DayPlan = { rest: true, templateId: null, programId: null };
const push: DayPlan = { rest: false, templateId: "push", programId: null };
const blank: DayPlan = { rest: false, templateId: null, programId: null };

describe("week-plan", () => {
  it("buildWeekFromOnboarding fills train days and leaves rest", () => {
    const week = buildWeekFromOnboarding("muscle", 4, "gym");
    assert.equal(week.length, 7);
    const counts = weekPlanCounts(week);
    assert.equal(counts.train, 4);
    assert.ok(counts.rest >= 2);
  });

  it("todayPlan reads the correct slot", () => {
    const week = Array.from({ length: 7 }, () => ({ ...REST }));
    const wed = 3; // Wednesday
    week[wed] = { ...push };
    const now = new Date("2026-09-23T15:00:00"); // Wednesday
    assert.equal(dayIndex(now), wed);
    assert.equal(planKind(todayPlan(week, now)), "template");
    assert.equal(planLabel(todayPlan(week, now), []), "Push");
  });

  it("planKind / isPlanSet / planChip cover rest template blank program", () => {
    assert.equal(planKind(REST), "rest");
    assert.equal(planKind(blank), "blank");
    assert.equal(planKind(push), "template");
    assert.equal(isPlanSet(REST), true);
    assert.equal(isPlanSet(blank), false);
    assert.equal(isPlanSet(push), true);
    assert.equal(planChip(REST, []), "Rest");
    assert.equal(planChip(blank, []), "—");
    assert.equal(planChip(push, []), "Push");
    const programs: Program[] = [
      {
        id: "p1",
        name: "Wiki PPL",
        exercises: [],
        dayLabel: "Pull A",
        packName: "Wiki",
      },
    ];
    const prog: DayPlan = { rest: false, templateId: null, programId: "p1" };
    assert.equal(planKind(prog), "program");
    assert.equal(planLabel(prog, programs), "Pull A");
  });

  it("weekPlanSummaryLine mentions today", () => {
    const week = Array.from({ length: 7 }, () => ({ ...REST }));
    week[3] = { ...push };
    const line = weekPlanSummaryLine(week, [], new Date("2026-09-23T12:00:00"));
    assert.match(line, /Today: Push/);
    assert.match(line, /1 train/);
  });

  it("crewTipForDay is stable for a given day", () => {
    const a = crewTipForDay(new Date("2026-09-26"));
    const b = crewTipForDay(new Date("2026-09-26"));
    assert.equal(a.id, b.id);
    assert.ok(a.title.length > 3);
  });
});

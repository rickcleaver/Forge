import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { COSMETIC_DEFS, COSMETIC_MAP, isCosmeticId } from "./cosmetics.ts";

describe("cosmetics shop catalog", () => {
  it("has spendable unlocks with positive costs", () => {
    assert.ok(COSMETIC_DEFS.length >= 5);
    for (const c of COSMETIC_DEFS) {
      assert.ok(c.cost > 0);
      assert.equal(COSMETIC_MAP[c.id].id, c.id);
      assert.equal(isCosmeticId(c.id), true);
    }
    assert.equal(isCosmeticId("nope"), false);
  });
});

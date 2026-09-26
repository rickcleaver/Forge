import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  COSMETIC_DEFS,
  COSMETIC_MAP,
  equipCosmetic,
  isCosmeticId,
  purchaseCosmetic,
  type CosmeticId,
  type CosmeticOwner,
} from "./cosmetics.ts";

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

describe("purchaseCosmetic auto-equip", () => {
  const empty: CosmeticOwner = {
    gems: 100,
    unlockedCosmetics: [],
    equippedFlair: null,
  };

  it("unlocks and always equips the bought flair", () => {
    const first = purchaseCosmetic(empty, "flair-spark");
    assert.equal(first.ok, true);
    if (!first.ok) return;
    assert.equal(first.player.gems, 100 - COSMETIC_MAP["flair-spark"].cost);
    assert.deepEqual(first.player.unlockedCosmetics, ["flair-spark"]);
    assert.equal(first.player.equippedFlair, "flair-spark");

    // Buying another replaces equipped — avatar updates immediately.
    const richer: CosmeticOwner = { ...first.player, gems: first.player.gems + 200 };
    const second = purchaseCosmetic(richer, "glow-gold");
    assert.equal(second.ok, true);
    if (!second.ok) return;
    assert.equal(second.player.equippedFlair, "glow-gold");
    const owned = second.player.unlockedCosmetics as CosmeticId[];
    assert.ok(owned.includes("flair-spark"));
    assert.ok(owned.includes("glow-gold"));
  });

  it("rejects duplicate unlock and insufficient gems", () => {
    const owned = purchaseCosmetic(
      { gems: 100, unlockedCosmetics: ["flair-spark"], equippedFlair: "flair-spark" },
      "flair-spark",
    );
    assert.equal(owned.ok, false);

    const broke = purchaseCosmetic(
      { gems: 1, unlockedCosmetics: [], equippedFlair: null },
      "badge-bolt",
    );
    assert.equal(broke.ok, false);
  });
});

describe("equipCosmetic", () => {
  it("equips owned flair and clears with null", () => {
    const player: CosmeticOwner = {
      gems: 0,
      unlockedCosmetics: ["flair-halo", "glow-gold"],
      equippedFlair: "flair-halo",
    };
    const swap = equipCosmetic(player, "glow-gold");
    assert.equal(swap.ok, true);
    if (swap.ok) assert.equal(swap.player.equippedFlair, "glow-gold");

    const clear = equipCosmetic(swap.ok ? swap.player : player, null);
    assert.equal(clear.ok, true);
    if (clear.ok) assert.equal(clear.player.equippedFlair, null);
  });

  it("blocks equipping locked flair", () => {
    const res = equipCosmetic(
      { gems: 0, unlockedCosmetics: [], equippedFlair: null },
      "flair-spark",
    );
    assert.equal(res.ok, false);
  });
});

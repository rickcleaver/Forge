import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AVATAR_DEFS,
  hasCustomAvatar,
  isAvatarPresetId,
  normalizeAvatarPhotoUrl,
  normalizeAvatarPresetId,
  resolveAvatarSrc,
} from "./avatars.ts";

describe("avatars catalog", () => {
  it("ships 15 distinct preset ids with mix of presentations", () => {
    assert.equal(AVATAR_DEFS.length, 15);
    const ids = new Set(AVATAR_DEFS.map((a) => a.id));
    assert.equal(ids.size, 15);
    const presentations = new Set(AVATAR_DEFS.map((a) => a.presentation));
    assert.ok(presentations.has("m"));
    assert.ok(presentations.has("f"));
    for (const a of AVATAR_DEFS) {
      assert.match(a.src, /^\/art\/avatars\/.+\.svg$/);
      assert.ok(isAvatarPresetId(a.id));
    }
  });

  it("resolves photo over preset, preset over empty", () => {
    assert.equal(resolveAvatarSrc({}), null);
    assert.equal(
      resolveAvatarSrc({ avatarPresetId: "spark-kai" }),
      "/art/avatars/spark-kai.svg",
    );
    assert.equal(
      resolveAvatarSrc({
        avatarPresetId: "spark-kai",
        avatarPhotoUrl: "data:image/jpeg;base64,abc",
      }),
      "data:image/jpeg;base64,abc",
    );
    assert.equal(resolveAvatarSrc({ avatarPresetId: "nope" }), null);
    assert.equal(hasCustomAvatar({ avatarPresetId: "neon-zara" }), true);
    assert.equal(hasCustomAvatar({}), false);
  });

  it("normalizes ids and photo data urls", () => {
    assert.equal(normalizeAvatarPresetId("glow-mira"), "glow-mira");
    assert.equal(normalizeAvatarPresetId("x"), null);
    assert.equal(normalizeAvatarPhotoUrl("data:image/png;base64,xx"), "data:image/png;base64,xx");
    assert.equal(normalizeAvatarPhotoUrl("https://evil.example/x.png"), null);
    assert.equal(normalizeAvatarPhotoUrl(null), null);
  });
});

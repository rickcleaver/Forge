/** Spendable cosmetic unlocks — persist on player, equippable as avatar flair. */

export type CosmeticId = "flair-spark" | "flair-halo" | "glow-gold";

export type CosmeticDef = {
  id: CosmeticId;
  name: string;
  blurb: string;
  cost: number;
  /** CSS color used for the HUD avatar ring when equipped */
  ring: string;
  emoji: string;
};

export const COSMETIC_DEFS: CosmeticDef[] = [
  {
    id: "flair-spark",
    name: "Spark trail",
    blurb: "Cyan sparkles around your avatar — basic flex.",
    cost: 25,
    ring: "#22d3ee",
    emoji: "✨",
  },
  {
    id: "flair-halo",
    name: "Violet halo",
    blurb: "Soft violet ring. Looks like a boss fight energy.",
    cost: 40,
    ring: "#c084fc",
    emoji: "🟣",
  },
  {
    id: "glow-gold",
    name: "Gold glow",
    blurb: "Warm gold ring. Save it for when the streak is spicy.",
    cost: 60,
    ring: "#fbbf24",
    emoji: "🥇",
  },
];

export const COSMETIC_MAP: Record<CosmeticId, CosmeticDef> = Object.fromEntries(
  COSMETIC_DEFS.map((c) => [c.id, c]),
) as Record<CosmeticId, CosmeticDef>;

const COSMETIC_ID_SET = new Set<string>(COSMETIC_DEFS.map((c) => c.id));

export function isCosmeticId(id: unknown): id is CosmeticId {
  return typeof id === "string" && COSMETIC_ID_SET.has(id);
}

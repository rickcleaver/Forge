/** Spendable cosmetic unlocks — persist on player, equippable as avatar flair. */

export type CosmeticId =
  | "flair-spark"
  | "flair-halo"
  | "glow-gold"
  | "flair-lime"
  | "flair-magenta"
  | "ring-pulse"
  | "badge-bolt";

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
  {
    id: "flair-lime",
    name: "Lime voltage",
    blurb: "Electric lime ring — teen neon starter pack energy.",
    cost: 35,
    ring: "#a3e635",
    emoji: "⚡",
  },
  {
    id: "flair-magenta",
    name: "Magenta rush",
    blurb: "Hot magenta outline. Looks like a night-game highlight.",
    cost: 45,
    ring: "#f472b6",
    emoji: "🎆",
  },
  {
    id: "ring-pulse",
    name: "Pulse ring",
    blurb: "Aqua dual-tone ring that reads like a HUD lock-on.",
    cost: 55,
    ring: "#2dd4bf",
    emoji: "💠",
  },
  {
    id: "badge-bolt",
    name: "Bolt badge",
    blurb: "Charged bolt badge on the avatar — flex for streak grinders.",
    cost: 70,
    ring: "#818cf8",
    emoji: "🚀",
  },
];

export const COSMETIC_MAP: Record<CosmeticId, CosmeticDef> = Object.fromEntries(
  COSMETIC_DEFS.map((c) => [c.id, c]),
) as Record<CosmeticId, CosmeticDef>;

const COSMETIC_ID_SET = new Set<string>(COSMETIC_DEFS.map((c) => c.id));

export function isCosmeticId(id: unknown): id is CosmeticId {
  return typeof id === "string" && COSMETIC_ID_SET.has(id);
}

/** Preset cartoon avatars + helpers for custom camera/gallery photos. */

export type AvatarPresentation = "m" | "f" | "n";

export type AvatarDef = {
  id: string;
  label: string;
  /** Rough presentation hint for a balanced grid (teen-friendly). */
  presentation: AvatarPresentation;
  src: string;
};

export const AVATAR_DEFS: AvatarDef[] = [
  { id: "spark-kai", label: "Spark Kai", presentation: "m", src: "/art/avatars/spark-kai.svg" },
  { id: "neon-zara", label: "Neon Zara", presentation: "f", src: "/art/avatars/neon-zara.svg" },
  { id: "volt-rex", label: "Volt Rex", presentation: "m", src: "/art/avatars/volt-rex.svg" },
  { id: "glow-mira", label: "Glow Mira", presentation: "f", src: "/art/avatars/glow-mira.svg" },
  { id: "aqua-jay", label: "Aqua Jay", presentation: "m", src: "/art/avatars/aqua-jay.svg" },
  { id: "candy-nova", label: "Candy Nova", presentation: "f", src: "/art/avatars/candy-nova.svg" },
  { id: "bolt-ken", label: "Bolt Ken", presentation: "m", src: "/art/avatars/bolt-ken.svg" },
  { id: "pulse-ria", label: "Pulse Ria", presentation: "f", src: "/art/avatars/pulse-ria.svg" },
  { id: "chroma-leo", label: "Chroma Leo", presentation: "m", src: "/art/avatars/chroma-leo.svg" },
  { id: "star-ivy", label: "Star Ivy", presentation: "f", src: "/art/avatars/star-ivy.svg" },
  { id: "forge-max", label: "Forge Max", presentation: "m", src: "/art/avatars/forge-max.svg" },
  { id: "vibe-luna", label: "Vibe Luna", presentation: "f", src: "/art/avatars/vibe-luna.svg" },
  { id: "pixel-sam", label: "Pixel Sam", presentation: "n", src: "/art/avatars/pixel-sam.svg" },
  { id: "rush-blake", label: "Rush Blake", presentation: "m", src: "/art/avatars/rush-blake.svg" },
  { id: "bloom-aiko", label: "Bloom Aiko", presentation: "f", src: "/art/avatars/bloom-aiko.svg" },
];

export const AVATAR_MAP: Record<string, AvatarDef> = Object.fromEntries(
  AVATAR_DEFS.map((a) => [a.id, a]),
);

const AVATAR_ID_SET = new Set(AVATAR_DEFS.map((a) => a.id));

export function isAvatarPresetId(id: unknown): id is string {
  return typeof id === "string" && AVATAR_ID_SET.has(id);
}

export type AvatarSettingsSlice = {
  avatarPresetId?: string | null;
  avatarPhotoUrl?: string | null;
};

/** Photo wins over preset; otherwise preset SVG src; else null (use ForgeCharacter). */
export function resolveAvatarSrc(settings: AvatarSettingsSlice): string | null {
  const photo = settings.avatarPhotoUrl?.trim();
  if (photo) return photo;
  const id = settings.avatarPresetId;
  if (isAvatarPresetId(id)) return AVATAR_MAP[id]!.src;
  return null;
}

export function normalizeAvatarPresetId(raw: unknown): string | null {
  return isAvatarPresetId(raw) ? raw : null;
}

/** Keep only data-URL images; drop huge payloads above ~1.5MB chars. */
export function normalizeAvatarPhotoUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t.startsWith("data:image/")) return null;
  if (t.length > 1_600_000) return null;
  return t;
}

export function hasCustomAvatar(settings: AvatarSettingsSlice): boolean {
  return resolveAvatarSrc(settings) != null;
}

import type { Settings } from "./types";

export type PlayerProfileFields = {
  displayName: string | null;
  ageYears: number | null;
  heightCm: number | null;
  bodyWeightLb: number | null;
};

/** True when name, age, height, and weight are all present for Coach/AI. */
export function isPlayerProfileComplete(
  settings: Pick<Settings, "displayName" | "ageYears" | "heightCm" | "bodyWeightLb">,
): boolean {
  const name = settings.displayName?.trim() ?? "";
  return (
    name.length > 0 &&
    settings.ageYears != null &&
    Number.isFinite(settings.ageYears) &&
    settings.ageYears >= 10 &&
    settings.ageYears <= 99 &&
    settings.heightCm != null &&
    settings.heightCm > 0 &&
    settings.bodyWeightLb != null &&
    settings.bodyWeightLb > 0
  );
}

export function normalizeDisplayName(raw: string): string | null {
  const t = raw.trim().replace(/\s+/g, " ").slice(0, 24);
  return t.length ? t : null;
}

export function normalizeAgeYears(raw: number | null | undefined): number | null {
  if (raw == null || !Number.isFinite(raw)) return null;
  const n = Math.round(raw);
  if (n < 10 || n > 99) return null;
  return n;
}

/** Slim athlete card for Coach / Spotter prompts. */
export function athleteCard(settings: Settings): {
  name: string | null;
  age: number | null;
  heightCm: number | null;
  weightLb: number | null;
} {
  return {
    name: settings.displayName?.trim() || null,
    age: settings.ageYears ?? null,
    heightCm: settings.heightCm ?? null,
    weightLb: settings.bodyWeightLb ?? null,
  };
}

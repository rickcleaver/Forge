import type { ColorMode, ThemeId } from "./types";

/** Map legacy gym themes → teen themes (neon = Liftoff-inspired default). */
export function migrateThemeId(raw: unknown): ThemeId | null {
  if (raw === "pop" || raw === "neon" || raw === "sunny") return raw;
  if (raw === "steel") return "neon";
  if (raw === "ember") return "sunny";
  if (raw === "ion") return "neon";
  return null;
}

export const THEMES: Array<{
  id: ThemeId;
  name: string;
  blurb: string;
  swatch: string;
  bar: string;
}> = [
  { id: "neon", name: "Neon", blurb: "Dark navy · electric blue", swatch: "#3B82FF", bar: "#070B16" },
  { id: "pop", name: "Pop", blurb: "Candy pink bright mode", swatch: "#FF4D8D", bar: "#0B1220" },
  { id: "sunny", name: "Sunny", blurb: "Citrus glow alternate", swatch: "#FFB020", bar: "#1A0F08" },
];

export function themeBarColor(id: ThemeId | undefined, mode: ColorMode = "dark"): string {
  if (mode === "light") {
    if (id === "sunny") return "#FFF6E8";
    if (id === "pop") return "#EEF7FF";
    return "#EEF2FF";
  }
  return THEMES.find((t) => t.id === id)?.bar ?? "#070B16";
}

import type { ColorMode, ThemeId } from "./types";

export const THEMES: Array<{
  id: ThemeId;
  name: string;
  blurb: string;
  swatch: string;
  bar: string;
}> = [
  { id: "steel", name: "Mint", blurb: "Night gym, electric teal", swatch: "#2ee6c5", bar: "#07090c" },
  { id: "ember", name: "Heat", blurb: "Sunset orange, warm floor", swatch: "#ff8a3c", bar: "#120906" },
  { id: "ion", name: "Night", blurb: "Purple neon, late session", swatch: "#b794ff", bar: "#08060f" },
];

export function themeBarColor(id: ThemeId | undefined, mode: ColorMode = "dark"): string {
  if (mode === "light") {
    if (id === "ember") return "#faf3ec";
    if (id === "ion") return "#f5f3fb";
    return "#f3f5f8";
  }
  return THEMES.find((t) => t.id === id)?.bar ?? "#07090c";
}

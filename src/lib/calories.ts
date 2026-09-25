const LB_TO_KG = 0.453592;
const IN_TO_CM = 2.54;

export function lbToKg(lb: number): number {
  return lb * LB_TO_KG;
}

export function cmToDisplay(cm: number, unit: "lb" | "kg"): number {
  return unit === "kg" ? Math.round(cm) : Math.round(cm / IN_TO_CM);
}

export function displayToCm(value: number, unit: "lb" | "kg"): number {
  return unit === "kg" ? value : value * IN_TO_CM;
}

export function stepsKcal(
  steps: number,
  weightLb: number | null,
  heightCm: number | null,
): number | null {
  if (!Number.isFinite(steps) || steps <= 0) return null;
  if (!weightLb || weightLb <= 0) return null;
  const kg = lbToKg(weightLb);
  const strideM = ((heightCm && heightCm > 0 ? heightCm : 175) / 100) * 0.415;
  const km = (steps * strideM) / 1000;
  return Math.round(km * kg * 0.57);
}

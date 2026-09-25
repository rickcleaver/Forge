export const SPLASH_QUOTES = [
  "Phone down. One honest set. Let’s go.",
  "Main-character energy starts in the log.",
  "Future-you is already hyped about this session.",
  "Candy vibes. Real work. No lecture.",
  "Missed yesterday? Still here. Still lifting.",
  "Your crew flexes online. You flex in the log.",
  "Ten minutes beats a perfect plan you skip.",
  "Heavy is relative. Showing up isn’t.",
  "No highlight reel needed — just the sets.",
  "Train the lift you’ve been dodging.",
  "Walk in chill. Walk out a little louder.",
  "Soreness is data. Ghosting the gym is not.",
  "Put something on the bar you respect.",
  "Finish the last set like your streak is watching.",
  "Forge doesn’t chase clout. It counts work.",
  "Slow the eccentric. Speed up showing up.",
  "Eat. Sleep. Log. Repeat.",
  "You’re not behind — you’re mid-plot twist.",
  "One PR whisper > a whole feed of noise.",
  "Keep the big lifts. Cut the scroll.",
  "Today’s session is enough for today.",
  "Tap in. Neon on. Let’s forge.",
];

export function quoteForDay(d = new Date()): string {
  const start = new Date(d.getFullYear(), 0, 0);
  const day = Math.floor((d.getTime() - start.getTime()) / 86_400_000);
  return SPLASH_QUOTES[day % SPLASH_QUOTES.length] ?? SPLASH_QUOTES[0];
}

/** Rotates mascot vs crew sticker energy on the splash. */
export function splashCast(d = new Date()): "mascot" | "crew" {
  const start = new Date(d.getFullYear(), 0, 0);
  const day = Math.floor((d.getTime() - start.getTime()) / 86_400_000);
  return day % 2 === 0 ? "mascot" : "crew";
}

/** @deprecated Photo splashes retired — kept for older callers / SW cleanup. */
export function splashVariant(d = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const day = Math.floor((d.getTime() - start.getTime()) / 86_400_000);
  return (day % 7) + 1;
}

/** @deprecated Prefer neon splash + ForgeCharacter; photos are no longer shown. */
export function splashImage(d = new Date()): string {
  return `/splash/${splashVariant(d)}.jpg`;
}

const VISIT_KEY = "forge-splash-visit";

export function splashDoneThisVisit(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(VISIT_KEY) === "1";
  } catch {
    return false;
  }
}

export function markSplashDone(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(VISIT_KEY, "1");
  } catch {
    /* ignore */
  }
}

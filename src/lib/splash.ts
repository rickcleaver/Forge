export const SPLASH_QUOTES = [
  "Show up. The bar does not care how you slept.",
  "One honest set beats a perfect plan you skip.",
  "Leave the phone. Own the next ten minutes.",
  "Strength is quiet. Log it and go home.",
  "You do not need more program. You need this session.",
  "Warm steel. Cool head.",
  "Missed yesterday. Still here. Lift.",
  "The last rep you almost skipped is the one that stays.",
  "Forge does not chase streaks. It counts work.",
  "Heavy is relative. Consistent is not.",
  "Train the thing you have been avoiding.",
  "Eat. Sleep. Put the plates back.",
  "No highlight reel. Just the log.",
  "Slow down the eccentric. Speed up showing up.",
  "The gym is a tool. You are the work.",
  "Keep the big lifts. Cut the noise.",
  "Soreness is data. Pain is a stop sign.",
  "Today’s session is enough for today.",
  "Put something on the bar you respect.",
  "Finish the last set like someone is watching the log.",
  "Walk in a civilian. Walk out a little harder.",
];

export function quoteForDay(d = new Date()): string {
  const start = new Date(d.getFullYear(), 0, 0);
  const day = Math.floor((d.getTime() - start.getTime()) / 86_400_000);
  return SPLASH_QUOTES[day % SPLASH_QUOTES.length] ?? SPLASH_QUOTES[0];
}

export function splashVariant(d = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const day = Math.floor((d.getTime() - start.getTime()) / 86_400_000);
  return (day % 7) + 1;
}

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

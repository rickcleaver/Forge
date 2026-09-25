export const SPLASH_QUOTES = [
  "Show up. Future-you is counting on it.",
  "One honest set beats a perfect plan you skip.",
  "Phone down. Ten minutes. Own them.",
  "Strength is quiet. Log it and go home.",
  "You don’t need more program. You need this session.",
  "Candy energy. Real work.",
  "Missed yesterday. Still here. Lift.",
  "The last rep you almost skipped is the one that sticks.",
  "Forge doesn’t chase streaks. It counts work.",
  "Heavy is relative. Consistent is not.",
  "Train the thing you’ve been avoiding.",
  "Eat. Sleep. Put the plates back.",
  "No highlight reel. Just the log.",
  "Slow the eccentric. Speed up showing up.",
  "The gym is a tool. You’re the work.",
  "Keep the big lifts. Cut the noise.",
  "Soreness is data. Pain is a stop sign.",
  "Today’s session is enough for today.",
  "Put something on the bar you respect.",
  "Finish the last set like your log is watching.",
  "Walk in chill. Walk out a little harder.",
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

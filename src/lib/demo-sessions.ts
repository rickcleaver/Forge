import type { Session } from "./types";

/** Demo seed sessions (id starts with seed-) — not the user's real log. */
export function isDemoSession(session: { id: string }): boolean {
  return session.id.startsWith("seed-");
}

/** Sessions safe for Progress / Log / streak / this-week UI. */
export function realSessions(sessions: Session[]): Session[] {
  return sessions.filter((s) => !isDemoSession(s));
}

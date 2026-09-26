import { forgeScore, strengthProfile, weekMuscleAdvice } from "@/lib/coach-engine";
import { useGym } from "@/lib/store";
import { realSessions } from "@/lib/demo-sessions";

export function ForgeScoreCard() {
  const sessions = realSessions(useGym((s) => s.sessions));
  const readiness = useGym((s) => s.readinessLogs);
  const settings = useGym((s) => s.settings);
  const score = forgeScore(sessions, readiness, settings);
  const profile = strengthProfile(sessions).sort((a, b) => b.score - a.score);
  const week = weekMuscleAdvice(sessions);
  const low = week.filter((w) => w.tone === "low").slice(0, 2);

  return (
    <section className="mt-8">
      <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Forge score</p>
      <p className="mt-1 font-display text-4xl font-semibold tabular-nums">{score.total}</p>
      <ul className="mt-3 grid grid-cols-2 gap-2 text-xs">
        {(
          [
            ["Strength", score.strength],
            ["Consistency", score.consistency],
            ["Recovery", score.recovery],
            ["Progression", score.progression],
            ["Volume", score.volume],
          ] as const
        ).map(([k, v]) => (
          <li key={k} className="flex justify-between rounded-md bg-surface px-3 py-2 shadow-[var(--shadow-border)]">
            <span className="text-muted">{k}</span>
            <span className="font-mono tabular-nums">{v}</span>
          </li>
        ))}
      </ul>
      <h3 className="mt-6 font-display text-lg font-semibold">Strength profile</h3>
      <ul className="mt-2 flex flex-col gap-1">
        {profile.slice(0, 6).map((p) => (
          <li key={p.id} className="flex items-center justify-between text-sm">
            <span>{p.label}</span>
            <span className="font-mono text-xs tabular-nums text-muted">{p.score}</span>
          </li>
        ))}
      </ul>
      {low.length ? (
        <p className="mt-3 text-sm text-muted">{low.map((l) => l.note).join(" ")}</p>
      ) : (
        <p className="mt-3 text-sm text-muted">Muscle coverage this week looks even.</p>
      )}
    </section>
  );
}

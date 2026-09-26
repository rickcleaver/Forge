import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Flame, Zap } from "lucide-react";
import {
  bestTrainingStreak,
  recentDayChips,
  trainedToday,
  trainingStreak,
} from "@/lib/player-progress";
import { useGym } from "@/lib/store";
import { cn } from "@/lib/utils";
import { realSessions } from "@/lib/demo-sessions";

export const Route = createFileRoute("/streak")({ component: StreakPage });

function StreakPage() {
  const sessions = useGym((s) => s.sessions);
  const streak = trainingStreak(sessions);
  const best = Math.max(bestTrainingStreak(sessions), streak);
  const chips = recentDayChips(sessions, 14);
  const didToday = trainedToday(sessions);
  const finished = realSessions(sessions).filter((s) => s.finishedAt).length;

  return (
    <main className="forge-page-enter px-4 pt-4 pb-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-bold text-muted shadow-[var(--shadow-border)]"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </Link>

      <div className="mt-5 flex items-start gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 shadow-[var(--shadow-glow)]">
          <Flame className="size-7 text-white" />
        </div>
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">Heat check</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Streak</h1>
          <p className="mt-1 text-sm text-muted">
            Finish a workout today or yesterday to keep the fire alive.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="forge-neon-frame rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Current</p>
          <p className="mt-1 font-display text-4xl font-extrabold tabular-nums text-orange-400">
            {streak}
            <span className="ml-1 text-base font-semibold text-muted">day{streak === 1 ? "" : "s"}</span>
          </p>
        </div>
        <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Best ever</p>
          <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">
            {best}
            <span className="ml-1 text-base font-semibold text-muted">day{best === 1 ? "" : "s"}</span>
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Last 14 days</h2>
          <span className="font-mono text-[10px] text-muted uppercase">{finished} finished</span>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {chips.map((c) => (
            <div key={c.day} className="flex flex-col items-center gap-1">
              <span className="font-mono text-[9px] text-subtle">{c.label}</span>
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-[11px] font-bold",
                  c.trained
                    ? "bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-[0_0_12px_rgb(251_146_60/0.45)]"
                    : "bg-well text-subtle",
                  c.isToday && !c.trained && "ring-2 ring-accent ring-offset-1 ring-offset-surface",
                )}
                title={new Date(c.day).toLocaleDateString()}
              >
                {c.trained ? "🔥" : c.isToday ? "·" : ""}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-2xl bg-surface-2/80 p-4">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Zap className="size-4 text-accent" />
          How streaks work
        </h2>
        <ul className="mt-2 space-y-2 text-sm text-muted">
          <li>Finish a session (tap End) — unfinished drafts do not count.</li>
          <li>Miss a full calendar day and the fire resets. Yesterday still counts as “alive.”</li>
          <li>Short sessions count. Showing up &gt; perfect.</li>
        </ul>
      </section>

      <div
        className={cn(
          "mt-4 rounded-2xl p-4 shadow-[var(--shadow-border)]",
          didToday
            ? "bg-gradient-to-r from-[color-mix(in_srgb,var(--color-success)_22%,transparent)] to-surface"
            : "bg-gradient-to-r from-[color-mix(in_srgb,var(--color-accent)_28%,transparent)] to-surface",
        )}
      >
        {didToday ? (
          <>
            <p className="font-display text-lg font-bold text-success">Today’s lit 🔥</p>
            <p className="mt-1 text-sm text-muted">
              You already finished a workout. Come back tomorrow to push {streak + 1}.
            </p>
          </>
        ) : (
          <>
            <p className="font-display text-lg font-bold">Don’t drop it</p>
            <p className="mt-1 text-sm text-muted">
              {streak > 0
                ? `You’re on ${streak}. One finished session today keeps the chain.`
                : "No active streak yet — finish any workout to light day 1."}
            </p>
            <Link
              to="/session"
              className="mt-3 inline-flex rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-fg shadow-[var(--shadow-glow)]"
            >
              Start a session
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

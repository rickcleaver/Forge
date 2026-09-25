import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ForgeScoreCard } from "@/components/forge-score";
import { ProgressPhotos } from "@/components/progress-photos";
import { WeightLogCard } from "@/components/weight-log";
import { WeekRecapButton } from "@/components/week-recap";
import { MuscleMap } from "@/components/muscle-map";
import { Badge } from "@/components/ui/badge";
import { weekMuscleAdvice } from "@/lib/coach-engine";
import { allTimeBests, formatPrevLoad, muscleHitsThisWeek } from "@/lib/stats";
import { MUSCLES } from "@/lib/types";
import { useGym } from "@/lib/store";
import { ProgressCharts } from "@/components/progress-charts";
import { CirclesCard } from "@/components/circles-card";
import { ForgeCharacter } from "@/components/forge-character";
import { QuestsPanel } from "@/components/quest-carousel";
import { PlayerStatusBar } from "@/components/player-status-bar";

export const Route = createFileRoute("/progress")({ component: ProgressPage });

function ProgressPage() {
  const sessions = useGym((s) => s.sessions);
  const unit = useGym((s) => s.settings.unit);
  const addAccessoryForMuscle = useGym((s) => s.addAccessoryForMuscle);
  const weighIns = useGym((s) => s.weighIns);
  const records = allTimeBests(sessions);
  const hits = muscleHitsThisWeek(sessions);
  const week = weekMuscleAdvice(sessions);
  const trained = MUSCLES.filter((m) => (hits[m.id] ?? 0) > 0).length;
  const sortedW = [...weighIns].sort((a, b) => a.at - b.at);
  const latest = sortedW.at(-1);
  const weekAgo = sortedW.find((w) => latest && latest.at - w.at >= 6 * 86400_000) ?? sortedW[0];
  const trend =
    latest && weekAgo && weekAgo.lb
      ? Math.round((latest.lb - weekAgo.lb) * 10) / 10
      : null;

  return (
    <main className="px-4 pt-4">
      <PlayerStatusBar />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Progress</h1>
          <p className="mt-1 text-sm text-muted">PRs, charts, photos — proof you showed up. Flex responsibly.</p>
        </div>
        <ForgeCharacter kind="mascot" size="sm" motion="float" className="shrink-0" />
      </div>
      <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <a href="#forge-score" className="shrink-0 rounded-full bg-surface px-3 py-2 font-mono text-[10px] tracking-wider uppercase shadow-[var(--shadow-border)]">Score</a>
        <a href="#forge-charts" className="shrink-0 rounded-full bg-surface px-3 py-2 font-mono text-[10px] tracking-wider uppercase shadow-[var(--shadow-border)]">Charts</a>
        <Link to="/muscles" className="shrink-0 rounded-full bg-accent px-3 py-2 font-mono text-[10px] tracking-wider text-accent-fg uppercase shadow-[var(--shadow-glow)]">Muscles</Link>
        <a href="#forge-outcome" className="shrink-0 rounded-full bg-surface px-3 py-2 font-mono text-[10px] tracking-wider uppercase shadow-[var(--shadow-border)]">Glow-up</a>
        <a href="#forge-circles" className="shrink-0 rounded-full bg-surface px-3 py-2 font-mono text-[10px] tracking-wider uppercase shadow-[var(--shadow-border)]">Circles</a>
      </nav>

      <div id="forge-score">
        <ForgeScoreCard />
      </div>

      <div className="mt-6">
        <WeekRecapButton />
      </div>

      <div id="forge-charts">
        <ProgressCharts />
      </div>

<section className="mt-8">
        <h2 className="font-display text-xl font-semibold">Your records</h2>
        <p className="mt-1 text-sm text-muted">Best set on each lift — no spreadsheet energy.</p>
        <ul className="mt-3 flex flex-col gap-2">
          {records.slice(0, 8).map((r) => (
            <li
              key={r.name}
              className="rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate font-medium">{r.name}</p>
                <p className="font-mono text-xs tabular-nums">{formatPrevLoad(r.weight, r.reps)}</p>
              </div>
              <p className="mt-1 font-mono text-[11px] text-muted">
                {format(r.when, "d MMM")}
                {r.e1rm ? ` · est. max ${r.e1rm} ${unit}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-lg font-semibold">This week</h2>
          <Link to="/muscles" className="font-mono text-[10px] tracking-wider text-muted uppercase">
            Map
          </Link>
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]">
          <div className="min-w-0 flex-1">
            <MuscleMap hits={hits} compact className="w-full" />
          </div>
          <div className="w-[4.75rem] shrink-0">
            <p className="font-display text-3xl font-semibold tabular-nums">
              {trained}
              <span className="text-lg text-muted">/{MUSCLES.length}</span>
            </p>
            <p className="text-sm text-muted">areas hit</p>
          </div>
        </div>
        <ul className="mt-3 flex flex-col gap-1">
          {week.map((w) => (
            <li key={w.id} className="grid grid-cols-[1fr_4.25rem_2.75rem] items-center text-sm">
              <span className="min-w-0 truncate">
                {w.tone === "good" ? "●" : w.tone === "ok" ? "◐" : "○"} {w.label}
              </span>
              <span className="text-right font-mono text-xs tabular-nums text-muted">{w.sets} sets</span>
              {w.tone === "low" ? (
                <button
                  type="button"
                  className="text-right font-mono text-[10px] tracking-wider text-accent uppercase"
                  onClick={() => addAccessoryForMuscle(w.id)}
                >
                  Add
                </button>
              ) : (
                <span />
              )}
            </li>
          ))}
        </ul>
      </section>

      <div id="forge-outcome" className="forge-neon-frame mt-8 rounded-[1.75rem] bg-surface p-4 shadow-[var(--shadow-border)]">
        <p className="font-mono text-[10px] tracking-wider text-accent uppercase">The glow-up loop</p>
        <h2 className="mt-1 font-display text-xl font-semibold">Scale · photos · Forge Score</h2>
        <p className="mt-1 text-sm text-muted">
          One story: weight trend, physique shots, and your score move together. Weekly vibe over one-day panic.
        </p>
      </div>
      <WeightLogCard />
      {trend != null && latest ? (
        <p className="mt-2 text-sm text-muted">
          Scale {trend > 0 ? "+" : ""}
          {trend} {unit} vs earlier weigh-in. Watch the weekly average, not one morning.
        </p>
      ) : null}
      <ProgressPhotos />
      <div id="forge-circles">
        <QuestsPanel />
      <CirclesCard />
      </div>
    </main>
  );
}

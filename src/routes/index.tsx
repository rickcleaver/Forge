import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format, isSameDay } from "date-fns";
import { useEffect, useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { SettingsDrawer } from "@/components/settings-drawer";
import { MuscleMap } from "@/components/muscle-map";
import { WeekStrip } from "@/components/week-strip";
import { NextMove } from "@/components/next-move";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { MorningGate } from "@/components/morning-gate";
import { ReadinessCard } from "@/components/readiness-card";
import { checkinDoneToday, markCheckinDone } from "@/lib/checkin";
import { deloadAdvice, missedPlanLabel, nutritionCue } from "@/lib/coach-engine";
import { StepsCard } from "@/components/steps-card";
import { ProgressPhotos } from "@/components/progress-photos";
import { ScanLogButton } from "@/components/scan-log";
import { Badge } from "@/components/ui/badge";
import { backupStatus } from "@/lib/backup";
import { MUSCLES } from "@/lib/types";
import { TEMPLATES } from "@/lib/exercises";
import {
  isSetupSession,
  muscleHitsThisWeek,
  sessionDurationMs,
  sessionSetCount,
  sessionVolume,
} from "@/lib/stats";
import { useGym } from "@/lib/store";
import { formatDuration, formatVolume } from "@/lib/utils";
import { applyWaitingCoachPlan } from "@/lib/spotter-sync";
import { ForgeCharacter, ForgeEmptyState } from "@/components/forge-character";
import { PlayerStatusBar } from "@/components/player-status-bar";
import { QuestCarousel, QuestsPanel } from "@/components/quest-carousel";
import { CirclesCard } from "@/components/circles-card";
import { forgeScore } from "@/lib/coach-engine";
import { cn } from "@/lib/utils";
import { realSessions } from "@/lib/demo-sessions";

export const Route = createFileRoute("/")({ component: Today });

function HomeNotes() {
  const sessions = useGym((s) => s.sessions);
  const weekPlan = useGym((s) => s.settings.weekPlan);
  const readiness = useGym((s) => s.readinessLogs);
  const deload = deloadAdvice(sessions, readiness);
  const missed = missedPlanLabel(weekPlan, sessions);
  if (!deload && !missed) return null;
  return (
    <div className="mt-3 flex flex-col gap-2">
      {deload ? <p className="rounded-xl bg-surface px-4 py-3 text-sm shadow-[var(--shadow-border)]">{deload}</p> : null}
      {missed ? (
        <div className="rounded-xl bg-surface px-4 py-3 text-sm shadow-[var(--shadow-border)]">
          <p>{missed}</p>
          <button
            type="button"
            className="mt-2 font-mono text-[10px] tracking-wider text-accent uppercase"
            onClick={() => useGym.getState().slideWeekPlan()}
          >
            Slide the week
          </button>
        </div>
      ) : null}
    </div>
  );
}


type HomeTab = "for-you" | "feed" | "discover";

function LevelUpCard() {
  const sessions = useGym((s) => s.sessions);
  const readiness = useGym((s) => s.readinessLogs);
  const settings = useGym((s) => s.settings);
  const setPlayerFlag = useGym((s) => s.setPlayerFlag);
  const hits = muscleHitsThisWeek(sessions);
  const score = forgeScore(sessions, readiness, settings);
  const trained = MUSCLES.filter((m) => (hits[m.id] ?? 0) > 0).length;
  const goal = Math.min(8, MUSCLES.length);
  const progress = Math.min(1, trained / goal);

  return (
    <section className="forge-neon-frame relative mt-5 overflow-hidden rounded-[1.75rem] bg-surface p-4 shadow-[var(--shadow-lift)]">
      <span className="forge-blob forge-blob-a opacity-35" />
      <div className="relative z-[1] flex gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-wide text-accent uppercase">Leveling up</p>
          <h2 className="mt-1 font-display text-xl font-semibold leading-snug">
            Unlock Muscle Map progress
          </h2>
          <p className="mt-1 text-sm text-muted">
            Hit {goal} areas this week · score {score.total}
          </p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-well">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-ring)] via-fuchsia-400 to-[var(--color-accent)]"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <Link
            to="/muscles"
            onClick={() => setPlayerFlag("visitedMuscles")}
            className="mt-3 inline-flex min-h-10 items-center rounded-full bg-accent px-4 text-sm font-bold text-accent-fg"
          >
            Open map
          </Link>
        </div>
        <div className="w-[10rem] shrink-0 rounded-2xl bg-bg/50 p-1.5">
          <MuscleMap hits={hits} compact className="!w-full" />
        </div>
      </div>
    </section>
  );
}

function Today() {
  const navigate = useNavigate();
  const sessions = useGym((s) => s.sessions);
  const activeId = useGym((s) => s.activeSessionId);
  const unit = useGym((s) => s.settings.unit);
  const startSession = useGym((s) => s.startSession);
  const repeatSession = useGym((s) => s.repeatSession);
  const discardSession = useGym((s) => s.discardSession);
  const settings = useGym((s) => s.settings);
  const readinessLogs = useGym((s) => s.readinessLogs);
  const active = sessions.find((s) => s.id === activeId && !s.finishedAt);
  const finished = realSessions(sessions)
    .filter((s) => s.finishedAt)
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));
  const recent = finished.slice(0, 4);
  const last = finished[0];
  const hits = muscleHitsThisWeek(sessions);
  const trained = MUSCLES.filter((m) => (hits[m.id] ?? 0) > 0).length;
  const calorieGoal = useGym((s) => s.settings.calorieGoal);
  const proteinGoal = useGym((s) => s.settings.proteinGoal);
  const lastBackupAt = useGym((s) => s.lastBackupAt);
  const sessionsAtLastBackup = useGym((s) => s.sessionsAtLastBackup);
  const { stale: backupStale } = backupStatus(sessions.length, lastBackupAt, sessionsAtLastBackup);
  const quick = TEMPLATES.filter((t) => ["home", "bands", "cardio", "push", "pull", "legs"].includes(t.id));
  const [now, setNow] = useState<Date | null>(null);
  const [skippedGate, setSkippedGate] = useState(() => checkinDoneToday(readinessLogs));
  const [gateLock, setGateLock] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [coachPlan, setCoachPlan] = useState<string | null>(null);
  const [tab, setTab] = useState<HomeTab>("for-you");
  const setPlayerFlag = useGym((s) => s.setPlayerFlag);
  useEffect(() => {
    setNow(new Date());
    if (checkinDoneToday(readinessLogs)) setSkippedGate(true);
    void applyWaitingCoachPlan()
      .then((name) => {
        if (name) setCoachPlan(name);
      })
      .catch(() => null);
  }, [readinessLogs]);

  const needCheckIn = settings.morningGate !== false && !skippedGate;

  if (needCheckIn) {
    return (
      <MorningGate
        onContinue={() => {
          markCheckinDone();
          window.setTimeout(() => {
            setSkippedGate(true);
            setGateLock(true);
            window.setTimeout(() => setGateLock(false), 450);
            void navigate({ to: "/", replace: true });
          }, 80);
        }}
        onSkip={() => {
          markCheckinDone();
          window.setTimeout(() => {
            setSkippedGate(true);
            setGateLock(true);
            window.setTimeout(() => setGateLock(false), 450);
            void navigate({ to: "/", replace: true });
          }, 80);
        }}
      />
    );
  }

  return (
    <main className="px-4 pt-3" style={gateLock ? { pointerEvents: "none" } : undefined}>
      <PlayerStatusBar />

      <nav className="mt-4 flex gap-1 rounded-full bg-surface p-1 shadow-[var(--shadow-border)]">
        {(
          [
            ["for-you", "For You"],
            ["feed", "Feed"],
            ["discover", "Discover"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex-1 rounded-full py-2.5 text-sm font-bold transition-colors",
              tab === id ? "bg-accent text-accent-fg shadow-[var(--shadow-glow)]" : "text-muted",
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "feed" ? (
        <div className="mt-4">
          <CirclesCard />
          <QuestsPanel className="mt-2" />
          <p className="mt-4 text-center text-sm text-muted">
            Circles stay opt-in — no public feed noise.
          </p>
        </div>
      ) : null}

      {tab === "discover" ? (
        <div className="mt-4 flex flex-col gap-3">
          <Link
            to="/programs"
            onClick={() => setPlayerFlag("visitedPrograms")}
            className="forge-neon-frame flex items-center justify-between rounded-[1.5rem] bg-surface p-4 shadow-[var(--shadow-border)]"
          >
            <span>
              <span className="block font-mono text-[10px] tracking-wider text-accent uppercase">Programs</span>
              <span className="font-display text-lg font-semibold">Yours, public & Spotter</span>
            </span>
            <ForgeCharacter kind="mascot" size="xs" motion="none" />
          </Link>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {quick.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  startSession({ templateId: t.id, name: t.name });
                  void navigate({ to: "/session" });
                }}
                className="h-11 shrink-0 rounded-full bg-surface-2 px-4 font-mono text-xs font-bold tracking-wider uppercase"
              >
                {t.name}
              </button>
            ))}
          </div>
          <Link
            to="/muscles"
            onClick={() => setPlayerFlag("visitedMuscles")}
            className="flex min-h-12 items-center justify-between rounded-2xl bg-surface px-4 text-sm font-medium shadow-[var(--shadow-border)]"
          >
            Muscle map
            <span className="text-accent">Open</span>
          </Link>
        </div>
      ) : null}

      {tab === "for-you" ? (
        <>
      <p className="mt-3 text-sm font-semibold text-muted">{format(now ?? new Date(), "EEEE, MMM d")}</p>

      {coachPlan ? (
        <p className="mt-2 text-sm text-accent">{coachPlan} is on your week. Start it from Train.</p>
      ) : null}

      <LevelUpCard />
      <QuestCarousel />

      {active ? (
        <div className="mt-5 rounded-2xl bg-accent px-5 py-5 text-accent-fg shadow-[var(--shadow-glow)]">
          <Link to="/session" className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold opacity-80">
                {isSetupSession(active) ? "Ready when you are" : "Still going"}
              </p>
              <p className="mt-1 font-display text-2xl font-extrabold">{active.name}</p>
              <p className="mt-1 text-sm opacity-80">
                {isSetupSession(active)
                  ? "Tap to add lifts"
                  : `${sessionSetCount(active)} sets · ${formatDuration(sessionDurationMs(active))}`}
              </p>
            </div>
            <ArrowRight className="size-5 shrink-0" />
          </Link>
          <button
            type="button"
            className="mt-4 min-h-12 w-full rounded-full bg-bg/20 text-sm font-semibold"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDiscardOpen(true);
            }}
          >
            Discard
          </button>
        </div>
      ) : (
        <NextMove />
      )}
      <ConfirmDialog
        open={discardOpen}
        title="Discard session?"
        body={active ? `${active.name} leaves the log. This cannot be undone.` : ""}
        confirmLabel="Discard"
        onClose={() => setDiscardOpen(false)}
        onConfirm={() => {
          if (active) discardSession(active.id);
          setDiscardOpen(false);
        }}
      />
      <HomeNotes />

      <WeekStrip />
      <Link
        to="/programs"
        className="mt-3 flex min-h-12 items-center justify-between rounded-xl bg-surface px-4 text-sm font-medium shadow-[var(--shadow-border)]"
      >
        <span>
          <span className="block font-mono text-[10px] tracking-wider text-muted uppercase">Programs</span>
          <span className="font-display text-base font-semibold">Browse yours, public & Spotter</span>
        </span>
        <span className="text-accent">→</span>
      </Link>

      {!active ? (
        <details className="mt-3">
          <summary className="cursor-pointer py-3 text-sm font-medium text-muted">More: scan, repeat, templates</summary>
          <div className="mt-1">
            <ScanLogButton />
          </div>
          {last ? (
            <button
              type="button"
              onClick={() => {
                repeatSession(last.id);
                void navigate({ to: "/session" });
              }}
              className="mt-3 flex w-full items-center justify-between rounded-xl bg-surface px-4 py-4 text-left shadow-[var(--shadow-border)]"
            >
              <span>
                <span className="block font-mono text-[10px] tracking-wider text-muted uppercase">Repeat last</span>
                <span className="mt-1 block font-display text-lg font-semibold">{last.name}</span>
              </span>
              <RotateCcw className="size-4 text-muted" />
            </button>
          ) : null}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {quick.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  startSession({ templateId: t.id, name: t.name });
                  void navigate({ to: "/session" });
                }}
                className="h-10 shrink-0 rounded-full bg-surface-2 px-4 font-mono text-xs tracking-wider uppercase"
              >
                {t.name}
              </button>
            ))}
          </div>
        </details>
      ) : null}

      <ReadinessCard />
      <p className="mt-4 text-sm text-muted">{nutritionCue(settings)}</p>
      <StepsCard />
      <ProgressPhotos />

      <section className="mt-8">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold">This week</h2>
          <Link to="/muscles" className="font-mono text-[10px] tracking-wider text-muted uppercase">
            Map
          </Link>
        </div>
        <div className="mt-3 flex items-center gap-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <MuscleMap hits={hits} compact />
          <div className="flex flex-col gap-2">
            <p className="font-display text-3xl font-semibold tabular-nums">
              {trained}
              <span className="text-lg text-muted">/{MUSCLES.length}</span>
            </p>
            <p className="text-sm text-muted">muscle areas hit</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {MUSCLES.filter((m) => (hits[m.id] ?? 0) > 0)
                .slice(0, 6)
                .map((m) => (
                  <Badge key={m.id} tone="accent">
                    {m.short}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
      </section>

      {calorieGoal || proteinGoal ? (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold">MyFitnessPal</h2>
          <div className="mt-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Today from Forge</p>
            <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
              {sessions
                .filter((s) => !s.id.startsWith("seed-") && s.finishedAt && isSameDay(s.finishedAt, now ?? new Date()))
                .reduce((n, s) => n + (s.estimatedKcal ?? 0), 0)}
              <span className="text-lg text-muted"> kcal trained</span>
            </p>
            <p className="mt-2 text-sm text-muted">
              {calorieGoal ? `${calorieGoal} kcal goal` : null}
              {calorieGoal && proteinGoal ? " · " : null}
              {proteinGoal ? `${proteinGoal} g protein` : null}
              . Paste session calories into MFP after you finish.
            </p>
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold">Recent</h2>
          <Link to="/history" className="font-mono text-[10px] tracking-wider text-muted uppercase">
            All
          </Link>
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {recent.length === 0 ? (
            <li className="rounded-xl bg-surface px-4 py-8 text-center text-sm text-muted shadow-[var(--shadow-border)]">
              No sessions yet. Hit Start — your first finish shows up here.
            </li>
          ) : (
            recent.map((s) => (
              <li key={s.id}>
                <Link
                  to="/history"
                  className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]"
                >
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted">
                      {format(s.finishedAt ?? s.startedAt, "EEE d MMM")} · {sessionSetCount(s)} sets
                    </p>
                  </div>
                  <p className="font-mono text-xs text-muted tabular-nums">
                    {formatVolume(sessionVolume(s), unit)}
                  </p>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>
      {backupStale ? <p className="mt-4 pb-2 text-xs text-muted">Backup is in Settings when you want it.</p> : null}
        </>
      ) : null}
    </main>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Footprints, RotateCcw } from "lucide-react";
import { ExerciseCard } from "@/components/exercise-card";
import { ExercisePicker } from "@/components/exercise-picker";
import { MfpHandoff } from "@/components/mfp-handoff";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { stepsKcal } from "@/lib/calories";
import {
  allTimeBests,
  formatPrevLoad,
  sessionDurationMs,
  sessionMuscles,
  sessionSetCount,
  sessionVolume,
} from "@/lib/stats";
import { useGym } from "@/lib/store";
import { MUSCLE_MAP, type Session, type StepLog } from "@/lib/types";
import { formatDuration, formatVolume, cn } from "@/lib/utils";
import { WeekRecapButton } from "@/components/week-recap";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { realSessions } from "@/lib/demo-sessions";

export const Route = createFileRoute("/history")({ component: HistoryPage });

function dayKey(at: number): string {
  const d = new Date(at);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function HistoryPage() {
  const sessions = useGym((s) => s.sessions);
  const stepLogs = useGym((s) => s.stepLogs);
  const discardSession = useGym((s) => s.discardSession);
  const discardStepLog = useGym((s) => s.discardStepLog);
  const repeatSession = useGym((s) => s.repeatSession);
  const unit = useGym((s) => s.settings.unit);
  const weightLb = useGym((s) => s.settings.bodyWeightLb);
  const heightCm = useGym((s) => s.settings.heightCm);
  const navigate = useNavigate();
  const visible = realSessions(sessions);
  const finished = visible.filter((s) => s.finishedAt);
  const records = allTimeBests(visible);
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<"sessions" | "records">("sessions");
  const [kill, setKill] = useState<{ kind: "session" | "steps"; id: string; name: string } | null>(null);

  const days = useMemo(() => {
    const map = new Map<string, { at: number; sessions: Session[]; steps: StepLog | null }>();
    for (const s of finished) {
      const at = s.finishedAt ?? s.startedAt;
      const key = dayKey(at);
      const row = map.get(key) ?? { at, sessions: [], steps: null };
      row.sessions.push(s);
      if (at > row.at) row.at = at;
      map.set(key, row);
    }
    for (const step of stepLogs) {
      const key = dayKey(step.at);
      const row = map.get(key) ?? { at: step.at, sessions: [], steps: null };
      row.steps = step;
      map.set(key, row);
    }
    for (const row of map.values()) {
      row.sessions.sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));
    }
    return [...map.values()].sort((a, b) => b.at - a.at);
  }, [finished, stepLogs]);

  return (
    <main className="px-4 pt-4">
      <h1 className="font-display text-3xl font-extrabold tracking-tight forge-page-title">Log</h1>
      <p className="mt-1 text-sm text-muted">
        {finished.length} sessions · {stepLogs.length} step days
      </p>
      <div className="mt-4 flex rounded-full bg-surface p-1 shadow-[var(--shadow-border)]">
        {(
          [
            { id: "sessions" as const, label: "Sessions" },
            { id: "records" as const, label: "Records" },
          ]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "h-10 flex-1 rounded-sm font-mono text-[11px] tracking-wider uppercase",
              tab === t.id ? "bg-accent text-accent-fg" : "text-muted",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "records" ? (
        <section className="mt-6">
          <p className="text-sm text-muted">Best set you actually logged on each lift.</p>
          {records.length === 0 ? (
            <div className="mt-3 rounded-xl bg-surface px-4 py-10 text-center text-sm text-muted shadow-[var(--shadow-border)]">
              Finish lifts and PRs land here.
            </div>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {records.map((r) => (
                <li
                  key={r.name}
                  className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted">
                      {format(r.when, "d MMM yyyy")}
                      {r.e1rm ? ` · est. max ${r.e1rm} ${unit}` : ""}
                    </p>
                  </div>
                  <p className="font-mono text-xs tabular-nums">{formatPrevLoad(r.weight, r.reps)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <>
          <div className="mt-4">
            <WeekRecapButton />
          </div>

          <div className="mt-6 flex flex-col gap-8">
        {days.length === 0 ? (
          <div className="rounded-xl bg-surface px-4 py-10 text-center text-sm text-muted shadow-[var(--shadow-border)]">
            Finish a session or log steps — your receipts land here.
          </div>
        ) : (
          days.map((day) => (
            <section key={dayKey(day.at)}>
              <h2 className="font-display text-lg font-semibold">{format(day.at, "EEEE d MMM")}</h2>
              <ul className="mt-3 flex flex-col gap-3">
                {day.steps ? (
                  <StepHistoryItem
                    log={day.steps}
                    kcal={stepsKcal(day.steps.steps, weightLb, heightCm)}
                    onDelete={() => setKill({ kind: "steps", id: day.steps!.id, name: "this step log" })}
                  />
                ) : null}
                {day.sessions.map((s) => (
                  <HistoryItem
                    key={s.id}
                    session={s}
                    unit={unit}
                    open={openId === s.id}
                    onToggle={() => setOpenId(openId === s.id ? null : s.id)}
                    onDelete={() => setKill({ kind: "session", id: s.id, name: s.name })}
                    onRepeat={() => {
                      repeatSession(s.id);
                      void navigate({ to: "/session" });
                    }}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
        </>
      )}
      <ConfirmDialog
        open={Boolean(kill)}
        title={kill?.kind === "steps" ? "Delete step log?" : "Delete session?"}
        body={kill ? `${kill.name} leaves the log.` : ""}
        confirmLabel="Delete"
        onClose={() => setKill(null)}
        onConfirm={() => {
          if (kill?.kind === "steps") discardStepLog(kill.id);
          if (kill?.kind === "session") discardSession(kill.id);
          setKill(null);
        }}
      />
    </main>
  );
}

function StepHistoryItem({
  log,
  kcal,
  onDelete,
}: {
  log: StepLog;
  kcal: number | null;
  onDelete: () => void;
}) {
  return (
    <li className="rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-display text-lg font-semibold">
            <Footprints className="size-4 text-accent" />
            Steps
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-muted">
            {format(log.at, "EEE d MMM")} · {log.steps.toLocaleString()} steps
            {kcal != null ? ` · ~${kcal} kcal` : ""}
          </p>
          {kcal == null ? (
            <p className="mt-1 text-xs text-muted">Add weight and height in Settings for calories.</p>
          ) : null}
        </div>
        <Button variant="ghost" size="sm" className="text-danger" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </li>
  );
}

function HistoryItem({
  session,
  unit,
  open,
  onToggle,
  onDelete,
  onRepeat,
}: {
  session: Session;
  unit: "lb" | "kg";
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onRepeat: () => void;
}) {
  const muscles = sessionMuscles(session);
  const addExercise = useGym((s) => s.addExercise);
  const saveProgram = useGym((s) => s.saveProgram);
  const [picker, setPicker] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [programName, setProgramName] = useState(session.name);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  return (
    <li className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
      <button type="button" onClick={onToggle} className="flex w-full items-start gap-3 px-4 py-4 text-left">
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold">{session.name}</p>
          <p className="mt-0.5 font-mono text-[11px] text-muted">
            {format(session.finishedAt ?? session.startedAt, "EEE d MMM")} ·{" "}
            {formatDuration(sessionDurationMs(session))} · {sessionSetCount(session)} sets ·{" "}
            {formatVolume(sessionVolume(session), unit)}
            {session.estimatedKcal ? ` · ~${session.estimatedKcal} kcal` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {muscles.map((m) => (
              <Badge key={m}>{MUSCLE_MAP[m]?.short ?? m}</Badge>
            ))}
          </div>
        </div>
        {open ? <ChevronUp className="size-4 text-muted" /> : <ChevronDown className="size-4 text-muted" />}
      </button>
      {open ? (
        <div className="flex flex-col gap-3 border-t border-border px-3 py-3">
          {session.photo ? (
            <img src={session.photo} alt="" className="h-40 w-full rounded-lg object-cover" />
          ) : null}
          {session.notes ? <p className="px-1 text-sm text-muted">{session.notes}</p> : null}
          <p className="px-1 text-xs text-muted">Change loads here. Tap the circle to mark a set done.</p>
          {session.exercises.map((ex, i) => (
            <ExerciseCard
              key={ex.id}
              sessionId={session.id}
              exercise={ex}
              nested
              index={i}
              total={session.exercises.length}
            />
          ))}
          <Button variant="secondary" size="sm" onClick={() => setPicker(true)}>
            Add exercise
          </Button>
          <MfpHandoff session={session} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={onRepeat}>
                <RotateCcw className="size-3.5" /> Repeat
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setProgramName(session.name);
                  setSavedMsg(null);
                  setSaveOpen(true);
                }}
              >
                Save program
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="text-danger" onClick={onDelete}>
              Delete
            </Button>
          </div>
          <ExercisePicker open={picker} onOpenChange={setPicker} onPick={(p) => addExercise(session.id, p)} />
          <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
            <DialogContent>
              <DialogTitle>Save as program</DialogTitle>
              <DialogDescription>Shows up on the Session start list.</DialogDescription>
              <Input
                className="mt-4"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
              />
              {savedMsg ? <p className="mt-2 text-sm text-muted">{savedMsg}</p> : null}
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setSaveOpen(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const ok = saveProgram(session.id, programName);
                    setSavedMsg(ok ? "Saved." : "Needs a name and at least one lift.");
                  }}
                >
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ) : null}
    </li>
  );
}

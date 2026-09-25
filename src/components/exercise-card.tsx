import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, Minus, Plus, Trash2 } from "lucide-react";
import { isDurationLog, resolveMuscles } from "@/lib/exercises";
import { nextPrescription } from "@/lib/coach-engine";
import {
  formatPrevCardio,
  formatPrevLoad,
  isPersonalRecord,
  lastWorkingSets,
} from "@/lib/stats";
import { useGym } from "@/lib/store";
import { MUSCLE_MAP, type ExerciseLog } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MuscleMap, hitsFromMuscles } from "@/components/muscle-map";
import { LiftHistory } from "./lift-history";
import { PhotoStrip } from "./photo-capture";
import { QuickLogBar } from "./quick-log";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const REST_CHIPS = [45, 60, 90, 120, 180];

export function ExerciseCard({
  sessionId,
  exercise,
  readOnly,
  index,
  total,
  nested,
}: {
  sessionId: string;
  exercise: ExerciseLog;
  readOnly?: boolean;
  index?: number;
  total?: number;
  nested?: boolean;
}) {
  const unit = useGym((s) => s.settings.unit);
  const defaultRest = useGym((s) => s.settings.defaultRestSec);
  const sessions = useGym((s) => s.sessions);
  const toggleSet = useGym((s) => s.toggleSet);
  const patchSet = useGym((s) => s.patchSet);
  const addSet = useGym((s) => s.addSet);
  const addWarmup = useGym((s) => s.addWarmup);
  const toggleWarmup = useGym((s) => s.toggleWarmup);
  const removeSet = useGym((s) => s.removeSet);
  const removeExercise = useGym((s) => s.removeExercise);
  const addPhoto = useGym((s) => s.addPhoto);
  const removePhoto = useGym((s) => s.removePhoto);
  const patchExercise = useGym((s) => s.patchExercise);
  const setExerciseRest = useGym((s) => s.setExerciseRest);
  const applyLiftRx = useGym((s) => s.applyLiftRx);
  const moveExercise = useGym((s) => s.moveExercise);
  const prev = lastWorkingSets(sessions, exercise, sessionId);
  const rest = exercise.restSec ?? defaultRest;
  const cardio = isDurationLog(exercise);
  const rx = nextPrescription(sessions, exercise);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [popId, setPopId] = useState<string | null>(null);
  const [prFlash, setPrFlash] = useState<string | null>(null);
  const [rxApplied, setRxApplied] = useState<"accept" | "keep" | "down" | null>(null);
  const muscles = resolveMuscles(exercise);

  useEffect(() => {
    if (readOnly) return;
    if (exercise.muscles.length || !muscles.length) return;
    patchExercise(sessionId, exercise.id, { muscles });
  }, [exercise.id, exercise.muscles.length, muscles, patchExercise, readOnly, sessionId]);

  function takeRx(mode: "accept" | "keep" | "down") {
    applyLiftRx(sessionId, exercise.id, mode);
    setRxApplied(mode);
  }

  let workingNo = 0;
  const liftHits = hitsFromMuscles(muscles);
  const showMap = muscles.some((m) => m !== "cardio");

  return (
    <article className={cn("rounded-2xl p-4 shadow-[var(--shadow-border)]", nested ? "bg-bg" : "bg-surface")}>
      <header className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 font-display text-base font-semibold tracking-tight">
          <button type="button" className="text-left" onClick={() => setHistoryOpen(true)}>
            {exercise.name}
          </button>
        </h3>
        {readOnly ? null : (
          <div className="flex shrink-0 items-center gap-0.5">
            {index != null && total != null && total > 1 ? (
              <>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted"
                  disabled={index === 0}
                  aria-label="Move up"
                  onClick={() => moveExercise(sessionId, exercise.id, -1)}
                >
                  <ChevronUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted"
                  disabled={index === total - 1}
                  aria-label="Move down"
                  onClick={() => moveExercise(sessionId, exercise.id, 1)}
                >
                  <ChevronDown />
                </Button>
              </>
            ) : null}
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted"
              aria-label={`Remove ${exercise.name}`}
              onClick={() => removeExercise(sessionId, exercise.id)}
            >
              <Trash2 />
            </Button>
          </div>
        )}
      </header>

      <div className="mt-1.5 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1">
            {muscles.map((m) => (
              <Badge key={m}>{MUSCLE_MAP[m]?.label ?? m}</Badge>
            ))}
          </div>
          {rx && !cardio ? (
            <div className="mt-2">
              <p className="text-xs text-muted">
                Next {rx.weight ?? "—"} × {rx.reps ?? "—"} · {rx.confidence}% · {rx.why}
              </p>
              {readOnly ? null : rxApplied ? (
                <p className="mt-2 font-mono text-[11px] text-accent">
                  {rxApplied === "accept"
                    ? "Bump loaded on open sets"
                    : rxApplied === "keep"
                      ? "Last load kept on open sets"
                      : "Lighter load on open sets"}
                </p>
              ) : (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    className="min-h-11 rounded-xl bg-accent px-2 font-mono text-[11px] tracking-wide text-accent-fg uppercase"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      takeRx("accept");
                    }}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="min-h-11 rounded-xl bg-well px-2 font-mono text-[11px] tracking-wide uppercase"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      takeRx("keep");
                    }}
                  >
                    Keep
                  </button>
                  <button
                    type="button"
                    className="min-h-11 rounded-xl bg-well px-2 font-mono text-[11px] tracking-wide uppercase"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      takeRx("down");
                    }}
                  >
                    Decrease
                  </button>
                </div>
              )}
            </div>
          ) : null}
          {readOnly || !prev || prev.length === 0 ? null : (
            <p className="mt-2 font-mono text-[11px] leading-snug text-muted">
              Last{" "}
              {prev
                .map((p) =>
                  cardio
                    ? formatPrevCardio(p.durationMin, p.distance)
                    : formatPrevLoad(p.weight, p.reps),
                )
                .join(" · ")}
            </p>
          )}
        </div>
        {showMap ? (
          <MuscleMap hits={liftHits} compact className="mt-0.5 w-[6.5rem] pointer-events-none" />
        ) : null}
      </div>
      {readOnly ? null : (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] tracking-wider text-subtle uppercase">Rest</span>
          {REST_CHIPS.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => {
                patchExercise(sessionId, exercise.id, { restSec: sec });
                setExerciseRest(exercise.name, sec);
              }}
              className={cn(
                "h-7 rounded-full px-2.5 font-mono text-[10px] tracking-wider",
                rest === sec ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
              )}
            >
              {sec}s
            </button>
          ))}
        </div>
      )}

      {readOnly && !exercise.notes ? null : (
        <Input
          className="mt-3 h-10 text-sm"
          placeholder="Notes for this lift"
          value={exercise.notes}
          disabled={readOnly}
          onChange={(e) => patchExercise(sessionId, exercise.id, { notes: e.target.value })}
        />
      )}

      <div className="mt-3">
        {readOnly && exercise.photos.length === 0 ? null : (
          <PhotoStrip
            photos={exercise.photos}
            readOnly={readOnly}
            onAdd={(src) => addPhoto(sessionId, exercise.id, src)}
            onRemove={(i) => removePhoto(sessionId, exercise.id, i)}
          />
        )}
      </div>

      <div className="mt-4">
        {readOnly ? (
          <ReadOnlySets exercise={exercise} cardio={cardio} unit={unit} />
        ) : (
          <>
            <div className="grid grid-cols-[1.6rem_minmax(4.5rem,1fr)_minmax(3.25rem,0.7fr)_2.6rem_2.75rem] items-center gap-2 px-0.5 pb-1 font-mono text-[10px] tracking-wider text-subtle uppercase">
              <span>{cardio ? "#" : "Set"}</span>
              <span>{cardio ? "Min" : unit}</span>
              <span>{cardio ? "Dist" : "Reps"}</span>
              <span>Prev</span>
              <span className="text-center">Done</span>
            </div>
            <ol className="flex flex-col gap-1.5">
              {exercise.sets.map((set) => {
                if (!set.warmup) workingNo += 1;
                const prevRow = set.warmup ? null : prev?.[workingNo - 1];
                const pr = isPersonalRecord(sessions, exercise, set);
                return (
                  <li
                    key={set.id}
                    className={cn(
                      "grid grid-cols-[1.6rem_minmax(4.5rem,1fr)_minmax(3.25rem,0.7fr)_2.6rem_2.75rem] items-center gap-2 rounded-lg px-0.5 py-0.5",
                      set.completed && !set.warmup && "bg-success/10",
                      set.warmup && "opacity-70",
                    )}
                  >
                    <button
                      type="button"
                      title="Toggle warmup"
                      onClick={() => toggleWarmup(sessionId, exercise.id, set.id)}
                      className={cn(
                        "h-11 font-mono text-sm tabular-nums",
                        set.warmup ? "text-subtle" : "text-muted",
                      )}
                    >
                      {set.warmup ? "W" : workingNo}
                    </button>
                    <NumField
                      compact
                      value={cardio ? (set.durationMin ?? null) : set.weight}
                      step={cardio ? 1 : unit === "kg" ? 2.5 : 5}
                      onChange={(v) =>
                        patchSet(
                          sessionId,
                          exercise.id,
                          set.id,
                          cardio ? { durationMin: v } : { weight: v },
                        )
                      }
                    />
                    <NumField
                      compact
                      value={cardio ? (set.distance ?? null) : set.reps}
                      step={cardio ? 0.1 : 1}
                      onChange={(v) =>
                        patchSet(
                          sessionId,
                          exercise.id,
                          set.id,
                          cardio ? { distance: v } : { reps: v },
                        )
                      }
                    />
                    <span className="relative text-center font-mono text-[10px] leading-tight text-subtle tabular-nums">
                      {prevRow
                        ? cardio
                          ? formatPrevCardio(prevRow.durationMin, prevRow.distance)
                          : formatPrevLoad(prevRow.weight, prevRow.reps)
                        : "—"}
                      {!cardio && pr ? (
                        <span className="mt-0.5 block font-medium tracking-wider text-accent uppercase">PR</span>
                      ) : null}
                      {prFlash === set.id ? (
                        <span className="forge-pr-flash absolute -top-5 right-0 rounded-full bg-accent px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-accent-fg uppercase">
                          New PR
                        </span>
                      ) : null}
                    </span>
                    <button
                      type="button"
                      aria-label={set.completed ? "Mark incomplete" : "Complete set"}
                      onClick={() => {
                        const wasDone = set.completed;
                        toggleSet(sessionId, exercise.id, set.id);
                        if (!wasDone) {
                          setPopId(set.id);
                          window.setTimeout(() => setPopId((id) => (id === set.id ? null : id)), 450);
                          if (!cardio && !set.warmup && pr) {
                            setPrFlash(set.id);
                            window.setTimeout(() => setPrFlash((id) => (id === set.id ? null : id)), 1400);
                          }
                        }
                      }}
                      className={cn(
                        "flex size-11 items-center justify-center rounded-lg",
                        set.completed ? "bg-success text-accent-fg" : "bg-well text-accent ring-1 ring-accent/40",
                        popId === set.id && "forge-set-pop",
                      )}
                    >
                      {set.completed ? <Check className="size-4" /> : null}
                    </button>
                    {!cardio && set.completed && !set.warmup ? (
                      <div className="col-span-5 flex items-center gap-1 pb-1">
                        <span className="font-mono text-[9px] tracking-wider text-subtle uppercase">RIR</span>
                        {[0, 1, 2, 3, 4].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => patchSet(sessionId, exercise.id, set.id, { rir: n })}
                            className={cn(
                              "size-7 rounded-sm font-mono text-[10px]",
                              set.rir === n ? "bg-accent text-accent-fg" : "bg-well text-muted",
                            )}
                          >
                            {n === 4 ? "4+" : n}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
            <QuickLogBar sessionId={sessionId} exerciseId={exercise.id} cardio={cardio} />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted"
                  onClick={() => addSet(sessionId, exercise.id)}
                >
                  <Plus /> {cardio ? "Bout" : "Set"}
                </Button>
                {cardio ? null : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted"
                    onClick={() => addWarmup(sessionId, exercise.id)}
                  >
                    <Plus /> Warm-up
                  </Button>
                )}
              </div>
              {exercise.sets.length > 1 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted"
                  onClick={() =>
                    removeSet(sessionId, exercise.id, exercise.sets[exercise.sets.length - 1].id)
                  }
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>
      <LiftHistory
        exercise={exercise}
        exceptSessionId={sessionId}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </article>
  );
}

function ReadOnlySets({
  exercise,
  cardio,
  unit,
}: {
  exercise: ExerciseLog;
  cardio: boolean;
  unit: "lb" | "kg";
}) {
  const rows = exercise.sets.filter((s) => s.completed);
  if (rows.length === 0) {
    return <p className="text-sm text-muted">No completed sets. Check Done while you lift.</p>;
  }
  let n = 0;
  return (
    <ol className="flex flex-col gap-1.5">
      {rows.map((set) => {
        if (!set.warmup) n += 1;
        return (
          <li
            key={set.id}
            className="flex items-center justify-between rounded-md bg-well/60 px-3 py-2 font-mono text-sm tabular-nums"
          >
            <span className="text-muted">{set.warmup ? "W" : n}</span>
            <span className="text-fg">
              {cardio
                ? formatPrevCardio(set.durationMin, set.distance)
                : formatPrevLoad(set.weight, set.reps)}
              {!cardio && set.weight ? (
                <span className="text-muted"> {unit}</span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function NumField({
  value,
  onChange,
  step,
  disabled,
  compact,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  step: number;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center rounded-lg bg-well ring-1 ring-accent/40",
        compact ? "h-11" : "h-14 rounded-xl",
      )}
    >
      {compact ? null : (
        <button
          type="button"
          disabled={disabled}
          aria-label="Decrease"
          className="flex size-11 shrink-0 items-center justify-center text-accent disabled:opacity-30"
          onClick={() => onChange(Math.max(0, roundStep((value ?? 0) - step, step)))}
        >
          <Minus className="size-3.5" />
        </button>
      )}
      <input
        inputMode="decimal"
        disabled={disabled}
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            onChange(null);
            return;
          }
          const n = Number(raw);
          if (Number.isFinite(n)) onChange(n);
        }}
        className={cn(
          "min-w-0 flex-1 bg-transparent text-center font-mono font-semibold tabular-nums text-fg outline-none disabled:opacity-60",
          compact ? "h-11 px-1 text-base" : "h-14 min-w-[3.5rem] px-1 text-lg",
        )}
      />
      {compact ? null : (
        <button
          type="button"
          disabled={disabled}
          aria-label="Increase"
          className="flex size-11 shrink-0 items-center justify-center text-accent disabled:opacity-30"
          onClick={() => onChange(roundStep((value ?? 0) + step, step))}
        >
          <Plus className="size-3.5" />
        </button>
      )}
    </div>
  );
}

function roundStep(n: number, step: number): number {
  const p = step < 1 ? 10 : 1;
  return Math.round(n * p) / p;
}

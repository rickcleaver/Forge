import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Timer, X } from "lucide-react";
import { playRestDone } from "@/lib/audio";
import { isSetupSession, nextIncompleteSet } from "@/lib/stats";
import { useGym } from "@/lib/store";
import { cn, formatClock } from "@/lib/utils";
import { Button } from "./ui/button";

const PRESETS = [45, 60, 90, 120, 180];
const R = 88;
const CIRC = 2 * Math.PI * R;

export function RestTimerHost() {
  const timer = useGym((s) => s.timer);
  const sessions = useGym((s) => s.sessions);
  const activeId = useGym((s) => s.activeSessionId);
  const markTimerDone = useGym((s) => s.markTimerDone);
  const hapticRest = useGym((s) => s.settings.hapticRest);
  const [now, setNow] = useState(() => Date.now());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!timer.running && !timer.completedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [timer.running, timer.completedAt]);

  const remaining = useMemo(() => {
    if (!timer.running || !timer.endsAt) return 0;
    return Math.max(0, Math.ceil((timer.endsAt - now) / 1000));
  }, [timer.running, timer.endsAt, now]);

  useEffect(() => {
    if (timer.running && remaining <= 0) {
      playRestDone(hapticRest);
      markTimerDone();
      setOpen(true);
    }
  }, [timer.running, remaining, markTimerDone, hapticRest]);

  const justDone = Boolean(timer.completedAt && now - timer.completedAt < 8000);
  const active = sessions.find((s) => s.id === activeId && !s.finishedAt);
  const next = active ? nextIncompleteSet(active) : null;
  if (!active || (isSetupSession(active) && !timer.running)) return null;

  if (!timer.running && !justDone && !open) return null;

  const progress = timer.running
    ? 1 - remaining / Math.max(1, timer.duration)
    : 1;

  return (
    <>
      {open ? (
        <RestOverlay
          remaining={timer.running ? remaining : 0}
          duration={timer.duration}
          progress={progress}
          running={timer.running}
          done={justDone && !timer.running}
          onClose={() => setOpen(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "fixed right-3 z-40 flex max-w-[min(16rem,70vw)] items-center gap-2 rounded-full px-3 py-2 shadow-[var(--shadow-lift)]",
            justDone && !timer.running ? "bg-success text-accent-fg" : "bg-accent text-accent-fg",
          )}
          style={{ top: "calc(0.65rem + env(safe-area-inset-top))" }}
          aria-label={timer.running ? `Rest ${formatClock(remaining)}` : "Rest done"}
        >
          <Timer className="size-4 shrink-0" />
          <span className="font-mono text-sm font-semibold tabular-nums">
            {timer.running ? formatClock(remaining) : "Done"}
          </span>
          {next ? (
            <span className="truncate font-display text-sm font-semibold">
              {next.name} {next.label !== "—" ? next.label : ""}
            </span>
          ) : null}
        </button>
      )}
    </>
  );
}

function RestOverlay({
  remaining,
  duration,
  progress,
  running,
  done,
  onClose,
}: {
  remaining: number;
  duration: number;
  progress: number;
  running: boolean;
  done: boolean;
  onClose: () => void;
}) {
  const startTimer = useGym((s) => s.startTimer);
  const stopTimer = useGym((s) => s.stopTimer);
  const skipTimer = useGym((s) => s.skipTimer);
  const adjustTimer = useGym((s) => s.adjustTimer);
  const defaultRestSec = useGym((s) => s.settings.defaultRestSec);
  const sessions = useGym((s) => s.sessions);
  const activeId = useGym((s) => s.activeSessionId);
  const active = sessions.find((s) => s.id === activeId && !s.finishedAt);
  const next = active ? nextIncompleteSet(active) : null;

  const offset = CIRC * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-bg"
      role="dialog"
      aria-modal="true"
      aria-label="Rest timer"
    >
      <div className="flex items-center justify-between px-4 pt-4">
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">Rest</p>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close timer">
          <X />
        </Button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
        <div className="relative size-56">
          <svg viewBox="0 0 200 200" className="size-full -rotate-90">
            <circle
              cx="100"
              cy="100"
              r={R}
              fill="none"
              stroke="var(--color-surface-2)"
              strokeWidth="8"
            />
            <circle
              cx="100"
              cy="100"
              r={R}
              fill="none"
              stroke={done ? "var(--color-success)" : "var(--color-accent)"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={offset}
              className="transition-[stroke-dashoffset] duration-200 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-5xl font-semibold tracking-tight tabular-nums">
              {running ? formatClock(remaining) : done ? "00:00" : formatClock(defaultRestSec)}
            </span>
            <span className="mt-1 font-mono text-[10px] tracking-widest text-muted uppercase">
              {done ? "Ready" : running ? `${duration}s rest` : "Stand by"}
            </span>
          </div>
        </div>

        {next ? (
          <div className="text-center">
            <p className="font-mono text-[10px] tracking-widest text-muted uppercase">Up next</p>
            <p className="mt-1 font-display text-3xl font-semibold tracking-tight">{next.name}</p>
            <p className="mt-1 font-mono text-lg text-accent tabular-nums">{next.label}</p>
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => (running ? adjustTimer(-15) : startTimer(Math.max(15, defaultRestSec - 15)))}
            aria-label="Minus 15 seconds"
          >
            <Minus />
          </Button>
          {running ? (
            <Button variant="outline" onClick={skipTimer} className="min-w-28">
              Skip
            </Button>
          ) : (
            <Button onClick={() => startTimer(defaultRestSec)} className="min-w-28">
              {done ? "Rest again" : "Start"}
            </Button>
          )}
          <Button
            variant="secondary"
            size="icon"
            onClick={() => (running ? adjustTimer(15) : startTimer(defaultRestSec + 15))}
            aria-label="Plus 15 seconds"
          >
            <Plus />
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => startTimer(p)}
              className={cn(
                "h-9 rounded-full px-3 font-mono text-xs tabular-nums shadow-[var(--shadow-border)] transition-[background-color,color] duration-150",
                running && duration === p ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted hover:text-fg",
              )}
            >
              {p}s
            </button>
          ))}
        </div>

        {running ? (
          <Button variant="ghost" className="text-muted" onClick={stopTimer}>
            Stop
          </Button>
        ) : null}
      </div>
    </div>
  );
}

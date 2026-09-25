import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { coachWorkoutPlan, forgeScore } from "@/lib/coach-engine";
import { LIBRARY_MAP } from "@/lib/exercises";
import { planLabel } from "@/lib/week-plan";
import { useGym } from "@/lib/store";
import { Button } from "./ui/button";

export function NextMove() {
  const navigate = useNavigate();
  const sessions = useGym((s) => s.sessions);
  const programs = useGym((s) => s.programs);
  const settings = useGym((s) => s.settings);
  const readiness = useGym((s) => s.readinessLogs);
  const activeId = useGym((s) => s.activeSessionId);
  const startSession = useGym((s) => s.startSession);
  const startCoachSession = useGym((s) => s.startCoachSession);
  const [more, setMore] = useState(false);
  const active = sessions.find((s) => s.id === activeId && !s.finishedAt);
  const today = new Date();
  const plan = settings.weekPlan?.[today.getDay()];
  const name = planLabel(plan, programs);
  const lastReady = readiness.at(-1);
  const ready = lastReady && Date.now() - lastReady.at < 36 * 3600_000 ? lastReady.score : null;
  const score = forgeScore(sessions, readiness, settings);
  const forged = coachWorkoutPlan(sessions, readiness, settings);
  const targets = forged.exerciseIds
    .map((id) => LIBRARY_MAP[id]?.name ?? id)
    .slice(0, 4);

  if (active) return null;

  function startMain() {
    if (plan && !plan.rest && (plan.programId || plan.templateId)) {
      if (plan.programId) startSession({ programId: plan.programId, name: name ?? undefined });
      else if (plan.templateId) startSession({ templateId: plan.templateId, name: name ?? undefined });
    } else {
      startCoachSession();
    }
    void navigate({ to: "/session" });
  }

  const backOff = ready != null && ready < 50;
  const title = plan?.rest ? "Rest day" : name || "Today’s lift";
  const cta = plan?.rest ? "Lift anyway" : "Start lifting";

  return (
    <section className="mt-5 rounded-2xl bg-accent px-5 py-5 text-accent-fg shadow-[var(--shadow-glow)]">
      <p className="text-sm font-semibold opacity-80">Today</p>
      <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm opacity-80">
        {backOff
          ? `Feeling ${ready}. Go a bit lighter.`
          : ready != null
            ? `Feeling ${ready}/100`
            : "Tap start. Log every set."}
      </p>
      {targets.length ? (
        <p className="mt-1 text-xs opacity-70">{targets.join(" · ")}</p>
      ) : null}
      <Button
        className="mt-4 min-h-14 w-full bg-bg text-fg shadow-none hover:bg-bg/90"
        data-tour="start"
        onClick={startMain}
      >
        {cta}
      </Button>
      {more ? (
        <div className="mt-3 flex flex-col gap-2">
          <Button
            className="w-full bg-bg/20 text-accent-fg shadow-none hover:bg-bg/30"
            onClick={() => {
              startCoachSession();
              void navigate({ to: "/session" });
            }}
          >
            Build one from my log
          </Button>
          <Button
            className="w-full bg-bg/20 text-accent-fg shadow-none hover:bg-bg/30"
            onClick={() => void navigate({ to: "/session" })}
          >
            Pick a workout
          </Button>
          <button type="button" className="py-2 text-xs opacity-80" onClick={() => setMore(false)}>
            Hide
          </button>
        </div>
      ) : (
        <button type="button" className="mt-3 min-h-11 w-full text-sm opacity-80" onClick={() => setMore(true)}>
          Other ways to start
        </button>
      )}
      <p className="sr-only">Score {score.total}</p>
    </section>
  );
}

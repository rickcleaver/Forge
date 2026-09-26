import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { coachWorkoutPlan, forgeScore, weekMuscleAdvice } from "@/lib/coach-engine";
import { LIBRARY_MAP } from "@/lib/exercises";
import { planKind, planLabel, todayPlan } from "@/lib/week-plan";
import { useGym } from "@/lib/store";
import { Button } from "./ui/button";
import { ForgeCharacter } from "./forge-character";
import { realSessions } from "@/lib/demo-sessions";

export function NextMove() {
  const navigate = useNavigate();
  const sessions = realSessions(useGym((s) => s.sessions));
  const programs = useGym((s) => s.programs);
  const settings = useGym((s) => s.settings);
  const readiness = useGym((s) => s.readinessLogs);
  const activeId = useGym((s) => s.activeSessionId);
  const startSession = useGym((s) => s.startSession);
  const startCoachSession = useGym((s) => s.startCoachSession);
  const [more, setMore] = useState(false);
  const active = sessions.find((s) => s.id === activeId && !s.finishedAt);
  const plan = todayPlan(settings.weekPlan);
  const kind = planKind(plan);
  const name = planLabel(plan, programs);
  const lastReady = readiness.at(-1);
  const ready = lastReady && Date.now() - lastReady.at < 36 * 3600_000 ? lastReady.score : null;
  const score = forgeScore(sessions, readiness, settings);
  const forged = coachWorkoutPlan(sessions, readiness, settings);
  const targets = forged.exerciseIds
    .map((id) => LIBRARY_MAP[id]?.name ?? id)
    .slice(0, 4);
  const lowAreas = weekMuscleAdvice(sessions)
    .filter((w) => w.tone === "low")
    .map((w) => w.label)
    .slice(0, 2);

  if (active) return null;

  function startMain() {
    if (kind === "program" && plan?.programId) {
      startSession({ programId: plan.programId, name: name ?? undefined });
    } else if (kind === "template" && plan?.templateId) {
      startSession({ templateId: plan.templateId, name: name ?? undefined });
    } else {
      startCoachSession();
    }
    void navigate({ to: "/session" });
  }

  const backOff = ready != null && ready < 50;
  const title =
    kind === "rest"
      ? "Rest day — still proud of you"
      : name
        ? name
        : "Today’s session";
  const cta = kind === "rest" ? "Lift anyway" : kind === "blank" ? "Build my session" : "Let’s go";
  const subtitle = backOff
    ? `Feeling ${ready}. Go a bit lighter — still counts.`
    : ready != null
      ? `Feeling ${ready}/100 · you’ve got this`
      : kind === "template" || kind === "program"
        ? "From your week board · log every set, keep it fast"
        : kind === "rest"
          ? "Optional work is fine — the board said recover"
          : "One tap. Log every set. Flex later.";

  return (
    <section className="forge-card-play hero-glow relative mt-5 overflow-hidden rounded-[1.75rem] bg-accent px-5 py-5 text-accent-fg shadow-[var(--shadow-glow)]">
      <span className="forge-blob forge-blob--a opacity-40" />
      <div className="relative z-[1] flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold opacity-80">Up next</p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm opacity-80">{subtitle}</p>
          {lowAreas.length ? (
            <p className="mt-1 text-xs opacity-70">Could use love: {lowAreas.join(" · ")}</p>
          ) : targets.length ? (
            <p className="mt-1 text-xs opacity-70">{targets.join(" · ")}</p>
          ) : null}
        </div>
        <ForgeCharacter kind="mascot" size="sm" motion="wiggle" className="shrink-0" />
      </div>
      <Button
        className="forge-cta-pulse relative z-[1] mt-4 min-h-14 w-full rounded-full bg-bg text-fg shadow-none hover:bg-bg/90"
        data-tour="start"
        onClick={startMain}
      >
        {cta}
      </Button>
      {more ? (
        <div className="relative z-[1] mt-3 flex flex-col gap-2">
          <Button
            className="w-full rounded-full bg-bg/20 text-accent-fg shadow-none hover:bg-bg/30"
            onClick={() => {
              startCoachSession();
              void navigate({ to: "/session" });
            }}
          >
            Build one from my log
          </Button>
          <Button
            className="w-full rounded-full bg-bg/20 text-accent-fg shadow-none hover:bg-bg/30"
            onClick={() => void navigate({ to: "/session" })}
          >
            Pick a workout
          </Button>
          <button type="button" className="py-2 text-xs opacity-80" onClick={() => setMore(false)}>
            Hide
          </button>
        </div>
      ) : (
        <button type="button" className="relative z-[1] mt-3 min-h-11 w-full text-sm opacity-80" onClick={() => setMore(true)}>
          Other ways to start
        </button>
      )}
      <p className="sr-only">Score {score.total}</p>
    </section>
  );
}

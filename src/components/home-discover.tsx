import { Link, useNavigate } from "@tanstack/react-router";
import { ForgeCharacter } from "@/components/forge-character";
import { PUBLIC_PROGRAMS } from "@/lib/public-programs";
import { TEMPLATES } from "@/lib/exercises";
import { MUSCLES } from "@/lib/types";
import { muscleHitsThisWeek } from "@/lib/stats";
import { useGym } from "@/lib/store";
import { weekPlanSummaryLine, planLabel, todayPlan } from "@/lib/week-plan";
import { cn } from "@/lib/utils";

const QUICK = TEMPLATES.filter((t) =>
  ["home", "bands", "cardio", "push", "pull", "legs", "upper", "full"].includes(t.id),
);

export function HomeDiscover() {
  const navigate = useNavigate();
  const sessions = useGym((s) => s.sessions);
  const startSession = useGym((s) => s.startSession);
  const setPlayerFlag = useGym((s) => s.setPlayerFlag);
  const weekPlan = useGym((s) => s.settings.weekPlan);
  const programs = useGym((s) => s.programs);
  const hits = muscleHitsThisWeek(sessions);
  const trained = MUSCLES.filter((m) => (hits[m.id] ?? 0) > 0);
  const cold = MUSCLES.filter((m) => m.id !== "cardio" && !(hits[m.id] ?? 0)).slice(0, 4);
  const spotlight = cold[0] ?? trained[0] ?? MUSCLES[0]!;
  const summary = weekPlanSummaryLine(weekPlan, programs);
  const todayName = planLabel(todayPlan(weekPlan), programs);
  const teasers = PUBLIC_PROGRAMS.slice(0, 3);

  return (
    <div className="mt-4 flex flex-col gap-3" data-testid="home-discover">
      <section className="forge-neon-frame relative overflow-hidden rounded-[1.75rem] bg-surface p-4 shadow-[var(--shadow-lift)]">
        <span className="forge-blob forge-blob-a opacity-25" />
        <div className="relative z-[1] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-wider text-accent uppercase">Discover</p>
            <h2 className="mt-1 font-display text-xl font-semibold">Find your next move</h2>
            <p className="mt-1 text-sm text-muted">{summary}</p>
          </div>
          <ForgeCharacter kind="mascot" size="xs" motion="none" />
        </div>
      </section>

      <section className="rounded-[1.75rem] bg-gradient-to-br from-cyan-400/15 via-surface to-fuchsia-500/15 p-4 ring-1 ring-cyan-400/30 shadow-[var(--shadow-border)]">
        <p className="font-mono text-[10px] tracking-wider text-accent uppercase">Muscle spotlight</p>
        <h2 className="mt-1 font-display text-lg font-semibold">{spotlight.label}</h2>
        <p className="mt-1 text-sm text-muted">
          {(hits[spotlight.id] ?? 0) > 0
            ? `Hit ${hits[spotlight.id]}× this week — keep the map glowing.`
            : "Quiet this week. A set here lights the map."}
        </p>
        <Link
          to="/muscles"
          onClick={() => setPlayerFlag("visitedMuscles")}
          className="mt-3 inline-flex min-h-10 items-center rounded-full bg-accent px-4 text-sm font-bold text-accent-fg"
        >
          Open muscle map
        </Link>
        {cold.length ? (
          <p className="mt-2 text-xs text-muted">Also quiet: {cold.map((m) => m.short).join(" · ")}</p>
        ) : null}
      </section>

      <section>
        <div className="mb-2 flex items-end justify-between px-1">
          <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Public programs</p>
          <Link
            to="/programs"
            onClick={() => setPlayerFlag("visitedPrograms")}
            className="text-xs font-bold text-accent"
          >
            All →
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {teasers.map((p, i) => (
            <Link
              key={p.id}
              to="/programs"
              onClick={() => setPlayerFlag("visitedPrograms")}
              className={cn(
                "forge-neon-frame flex items-start justify-between gap-3 rounded-[1.5rem] bg-surface p-4 shadow-[var(--shadow-border)]",
                i === 0 && "ring-1 ring-accent/40",
              )}
            >
              <span className="min-w-0">
                <span className="block font-mono text-[10px] tracking-wider text-accent uppercase">
                  {p.days} · {p.source}
                </span>
                <span className="mt-1 block font-display text-lg font-semibold">{p.name}</span>
                <span className="mt-1 block text-sm text-muted">{p.blurb}</span>
              </span>
              <ForgeCharacter kind="mascot" size="xs" motion="none" className="shrink-0 opacity-80" />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 px-1 font-mono text-[10px] tracking-wider text-muted uppercase">
          Quick templates{todayName ? ` · today wants ${todayName}` : ""}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                startSession({ templateId: t.id, name: t.name });
                void navigate({ to: "/session" });
              }}
              className="min-h-[4.5rem] rounded-2xl bg-surface-2 px-3 py-3 text-left ring-1 ring-border transition-transform active:scale-[0.98]"
            >
              <span className="block font-display text-base font-semibold">{t.name}</span>
              <span className="mt-0.5 block text-xs text-muted">{t.blurb}</span>
            </button>
          ))}
        </div>
      </section>

      <Link
        to="/programs"
        onClick={() => setPlayerFlag("visitedPrograms")}
        className="flex min-h-12 items-center justify-between rounded-2xl bg-accent px-4 text-sm font-bold text-accent-fg shadow-[var(--shadow-glow)]"
      >
        Browse Programs hub
        <span aria-hidden>→</span>
      </Link>

      <p className="pb-2 text-center text-sm text-muted">
        Quality picks — programs, muscles, templates. No scroll trap.
      </p>
    </div>
  );
}

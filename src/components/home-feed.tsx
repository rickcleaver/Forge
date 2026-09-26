import { Link } from "@tanstack/react-router";
import { CirclesCard } from "@/components/circles-card";
import { ForgeCharacter } from "@/components/forge-character";
import { QuestsPanel } from "@/components/quest-carousel";
import { CREW_TIPS, crewTipForDay, planLabel, todayPlan, weekPlanSummaryLine } from "@/lib/week-plan";
import { useGym } from "@/lib/store";
import { trainingStreak } from "@/lib/player-progress";
import { realSessions } from "@/lib/demo-sessions";
import { cn } from "@/lib/utils";

export function HomeFeed() {
  const weekPlan = useGym((s) => s.settings.weekPlan);
  const programs = useGym((s) => s.programs);
  const sessions = realSessions(useGym((s) => s.sessions));
  const name = useGym((s) => s.settings.displayName)?.trim() || null;
  const tip = crewTipForDay();
  const summary = weekPlanSummaryLine(weekPlan, programs);
  const today = todayPlan(weekPlan);
  const todayName = planLabel(today, programs);
  const streak = trainingStreak(sessions);
  const extras = CREW_TIPS.filter((t) => t.id !== tip.id).slice(0, 3);

  return (
    <div className="mt-4 flex flex-col gap-3" data-testid="home-feed">
      <section className="forge-neon-frame relative overflow-hidden rounded-[1.75rem] bg-surface p-4 shadow-[var(--shadow-lift)]">
        <span className="forge-blob forge-blob-a opacity-30" />
        <div className="relative z-[1] flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] tracking-wider text-accent uppercase">Week plan</p>
            <h2 className="mt-1 font-display text-lg font-semibold">
              {name ? `${name}'s board` : "Your board"}
            </h2>
            <p className="mt-1 text-sm text-muted">{summary}</p>
            {todayName ? (
              <p className="mt-2 text-sm font-semibold text-fg">Up next vibe: {todayName}</p>
            ) : today?.rest ? (
              <p className="mt-2 text-sm font-semibold text-fg">Rest locked in — recover like a pro.</p>
            ) : (
              <p className="mt-2 text-sm text-muted">Tap For You → Week board to assign today.</p>
            )}
            {streak >= 2 ? (
              <p className="mt-1 text-xs text-muted">{streak}-day streak · protect it with honest sets</p>
            ) : null}
          </div>
          <ForgeCharacter kind="mascot" size="xs" motion="none" />
        </div>
      </section>

      <section className="rounded-[1.75rem] bg-gradient-to-br from-violet-500/20 via-surface to-cyan-500/10 p-4 ring-1 ring-accent/30 shadow-[var(--shadow-border)]">
        <p className="font-mono text-[10px] tracking-wider text-accent uppercase">{tip.vibe}</p>
        <h2 className="mt-1 font-display text-lg font-semibold">{tip.title}</h2>
        <p className="mt-1 text-sm text-muted">{tip.body}</p>
      </section>

      <div className="flex flex-col gap-2">
        <p className="px-1 font-mono text-[10px] tracking-wider text-muted uppercase">Crew tips</p>
        {extras.map((t, i) => (
          <article
            key={t.id}
            className={cn(
              "rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
              i === 0 && "ring-1 ring-fuchsia-400/30",
            )}
          >
            <p className="font-mono text-[10px] tracking-wider text-muted uppercase">{t.vibe}</p>
            <h3 className="mt-1 font-display text-base font-semibold">{t.title}</h3>
            <p className="mt-1 text-sm text-muted">{t.body}</p>
          </article>
        ))}
      </div>

      <QuestsPanel className="mt-1" />

      <CirclesCard />

      <p className="pb-2 text-center text-sm text-muted">
        Real tips + your quests + opt-in Circles — no fake social network.
      </p>

      <Link
        to="/coach"
        className="mb-2 flex min-h-12 items-center justify-between rounded-2xl bg-accent px-4 text-sm font-bold text-accent-fg shadow-[var(--shadow-glow)]"
      >
        Ask Coach about today
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}

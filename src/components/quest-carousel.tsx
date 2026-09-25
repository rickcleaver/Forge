import { Link } from "@tanstack/react-router";
import { useGym } from "@/lib/store";
import type { QuestTone, QuestView } from "@/lib/quests";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const TONE: Record<QuestTone, string> = {
  lime: "from-lime-400/25 to-emerald-500/10 border-lime-400/40",
  blue: "from-sky-400/25 to-blue-600/10 border-sky-400/40",
  orange: "from-orange-400/25 to-amber-600/10 border-orange-400/40",
  purple: "from-violet-400/25 to-fuchsia-600/10 border-violet-400/40",
  pink: "from-pink-400/25 to-rose-600/10 border-pink-400/40",
  cyan: "from-cyan-400/25 to-teal-600/10 border-cyan-400/40",
};

const CTA: Record<QuestTone, string> = {
  lime: "bg-lime-400 text-black hover:bg-lime-300",
  blue: "bg-sky-400 text-black hover:bg-sky-300",
  orange: "bg-orange-400 text-black hover:bg-orange-300",
  purple: "bg-violet-400 text-black hover:bg-violet-300",
  pink: "bg-pink-400 text-black hover:bg-pink-300",
  cyan: "bg-cyan-400 text-black hover:bg-cyan-300",
};

function pct(q: QuestView): number {
  return Math.round(Math.min(1, q.progress / Math.max(1, q.target)) * 100);
}

export function QuestCarousel({ className }: { className?: string }) {
  const listQuests = useGym((s) => s.listQuests);
  const claimQuest = useGym((s) => s.claimQuest);
  const all = listQuests();
  const open = all.filter((q) => !q.claimed);
  const visible = (open.length ? open : all).slice(0, 6);

  return (
    <section className={cn("mt-6", className)}>
      <div className="flex items-end justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">Getting started</h2>
        <Link to="/progress" hash="forge-quests" className="text-xs font-bold text-accent">
          All quests
        </Link>
      </div>
      <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1">
        {visible.map((q) => (
          <article
            key={q.id}
            className={cn(
              "relative w-[78%] max-w-xs shrink-0 overflow-hidden rounded-3xl border bg-gradient-to-br p-4 shadow-[var(--shadow-border)]",
              TONE[q.tone],
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-full bg-bg/50 font-display text-sm font-bold tabular-nums">
                {pct(q)}%
              </div>
              <div className="min-w-0">
                <p className="font-display text-base font-semibold">{q.title}</p>
                <p className="mt-1 text-xs text-muted">{q.description}</p>
                <p className="mt-2 font-mono text-[10px] tracking-wider text-muted uppercase">
                  +{q.rewardXp} XP · +{q.rewardGems} gems
                </p>
              </div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg/40">
              <div className="h-full rounded-full bg-accent" style={{ width: `${pct(q)}%` }} />
            </div>
            {q.claimable ? (
              <Button
                type="button"
                className={cn("mt-3 min-h-11 w-full rounded-full font-bold", CTA[q.tone])}
                onClick={() => claimQuest(q.id)}
              >
                Claim reward
              </Button>
            ) : q.claimed ? (
              <p className="mt-3 text-center text-xs font-bold text-success">Claimed</p>
            ) : (
              <p className="mt-3 text-center text-xs text-muted">
                {q.progress}/{q.target} — keep going
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export function QuestsPanel({ className }: { className?: string }) {
  const listQuests = useGym((s) => s.listQuests);
  const claimQuest = useGym((s) => s.claimQuest);
  const quests = listQuests();

  return (
    <section className={cn("mt-8", className)} id="forge-quests">
      <h2 className="font-display text-lg font-semibold">Quests</h2>
      <p className="mt-1 text-sm text-muted">Real goals. Claim XP and gems when you crush them.</p>
      <ul className="mt-3 flex flex-col gap-2">
        {quests.map((q) => (
          <li
            key={q.id}
            className={cn(
              "rounded-2xl border border-border bg-surface p-3 shadow-[var(--shadow-border)]",
              q.claimable && "border-accent/50",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{q.title}</p>
                <p className="mt-0.5 text-xs text-muted">{q.description}</p>
                <p className="mt-1 font-mono text-[10px] text-muted uppercase">
                  {q.progress}/{q.target} · +{q.rewardXp} XP · +{q.rewardGems} gems
                </p>
              </div>
              {q.claimable ? (
                <Button type="button" size="sm" className="shrink-0 rounded-full" onClick={() => claimQuest(q.id)}>
                  Claim
                </Button>
              ) : q.claimed ? (
                <span className="shrink-0 text-xs font-bold text-success">Done</span>
              ) : (
                <span className="shrink-0 text-xs text-muted">{pct(q)}%</span>
              )}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-well">
              <div className="h-full rounded-full bg-accent" style={{ width: `${pct(q)}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

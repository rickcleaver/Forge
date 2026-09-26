import { useMemo, useState } from "react";
import { TEMPLATES } from "@/lib/exercises";
import {
  WEEK_DAYS_MON_FIRST,
  isPlanSet,
  planChip,
  planKind,
  planLabel,
  todayPlan,
  weekPlanCounts,
} from "@/lib/week-plan";
import type { DayPlan } from "@/lib/types";
import { useGym } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { ForgeCharacter } from "./forge-character";

const QUICK_TEMPLATES = TEMPLATES.filter((t) =>
  ["push", "pull", "legs", "upper", "full", "home", "bands", "cardio"].includes(t.id),
);

function blankPlan(): DayPlan {
  return { rest: false, templateId: null, programId: null };
}

function restPlan(): DayPlan {
  return { rest: true, templateId: null, programId: null };
}

export function WeekPlanner({ className }: { className?: string }) {
  const weekPlan = useGym((s) => s.settings.weekPlan);
  const programs = useGym((s) => s.programs);
  const setDayPlan = useGym((s) => s.setDayPlan);
  const todayIdx = new Date().getDay();
  const [editDay, setEditDay] = useState<number | null>(null);
  const counts = useMemo(() => weekPlanCounts(weekPlan), [weekPlan]);
  const today = todayPlan(weekPlan);
  const todayLabel = planLabel(today, programs);
  const editing = editDay == null ? null : WEEK_DAYS_MON_FIRST.find((d) => d.i === editDay) ?? null;
  const editingPlan =
    editDay == null ? null : (weekPlan?.[editDay] ?? blankPlan());

  function apply(day: number, plan: DayPlan) {
    setDayPlan(day, plan);
    setEditDay(null);
  }

  return (
    <section
      className={cn(
        "forge-neon-frame relative mt-4 overflow-hidden rounded-[1.75rem] bg-surface p-4 shadow-[var(--shadow-lift)]",
        className,
      )}
      data-testid="week-planner"
    >
      <span className="forge-blob forge-blob-a opacity-30" />
      <div className="relative z-[1] flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-wider text-accent uppercase">Week board</p>
          <h2 className="mt-0.5 font-display text-xl font-semibold leading-snug">Plan Mon–Sun</h2>
          <p className="mt-1 text-sm text-muted">
            Tap a day · {counts.train} train · {counts.rest} rest
            {todayLabel || planKind(today) === "rest"
              ? ` · today ${planKind(today) === "rest" ? "rest" : todayLabel}`
              : " · today open"}
          </p>
        </div>
        <ForgeCharacter kind="mascot" size="xs" motion="none" className="shrink-0" />
      </div>

      <div className="relative z-[1] mt-3 flex gap-1.5">
        {WEEK_DAYS_MON_FIRST.map((d) => {
          const plan = weekPlan?.[d.i] ?? blankPlan();
          const kind = planKind(plan);
          const isToday = d.i === todayIdx;
          const chip = planChip(plan, programs);
          return (
            <button
              key={d.i}
              type="button"
              onClick={() => setEditDay(d.i)}
              aria-label={`Plan ${d.label}${isToday ? " (today)" : ""}: ${chip}`}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-0.5 py-2.5 transition-transform active:scale-[0.97]",
                kind === "rest"
                  ? "bg-well/80 text-muted ring-1 ring-border"
                  : kind === "blank"
                    ? "bg-bg/60 text-muted ring-1 ring-dashed ring-border"
                    : "bg-gradient-to-b from-[var(--color-ring)]/25 to-accent/15 text-fg ring-1 ring-accent/40",
                isToday && "ring-2 ring-accent shadow-[var(--shadow-glow)]",
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-extrabold uppercase tracking-wide",
                  isToday ? "text-accent" : "text-muted",
                )}
              >
                {d.short.slice(0, 3)}
              </span>
              <span className="text-sm font-extrabold leading-none">
                {kind === "rest" ? "R" : kind === "blank" ? "+" : "●"}
              </span>
              <span className="w-full truncate text-center text-[9px] font-bold opacity-90">
                {chip}
              </span>
            </button>
          );
        })}
      </div>

      <p className="relative z-[1] mt-3 text-xs text-muted">
        Editable anytime here or in Settings. Today, Next Move, and Coach follow this board.
      </p>

      <Dialog open={editDay != null} onOpenChange={(open) => !open && setEditDay(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto forge-neon-frame">
          <DialogTitle>{editing ? `Plan ${editing.label}` : "Plan day"}</DialogTitle>
          <DialogDescription>
            Pick a template, one of your programs, rest, or leave it open. Saves on your player settings.
          </DialogDescription>

          <div className="mt-4 flex flex-col gap-2">
            <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Quick</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="min-h-12 rounded-2xl bg-well px-3 text-sm font-bold ring-1 ring-border"
                onClick={() => editDay != null && apply(editDay, restPlan())}
              >
                Rest day
              </button>
              <button
                type="button"
                className="min-h-12 rounded-2xl bg-well px-3 text-sm font-bold ring-1 ring-border"
                onClick={() => editDay != null && apply(editDay, blankPlan())}
              >
                Clear / open
              </button>
            </div>

            <p className="mt-3 font-mono text-[10px] tracking-wider text-muted uppercase">Templates</p>
            <div className="flex flex-col gap-1.5">
              {QUICK_TEMPLATES.map((t) => {
                const active = editingPlan?.templateId === t.id && !editingPlan.rest;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      editDay != null &&
                      apply(editDay, { rest: false, templateId: t.id, programId: null })
                    }
                    className={cn(
                      "flex min-h-12 items-center justify-between rounded-2xl px-4 text-left text-sm font-semibold",
                      active
                        ? "bg-accent text-accent-fg shadow-[var(--shadow-glow)]"
                        : "bg-surface-2 ring-1 ring-border",
                    )}
                  >
                    <span>
                      <span className="block">{t.name}</span>
                      <span className={cn("block text-xs", active ? "opacity-80" : "text-muted")}>
                        {t.blurb}
                      </span>
                    </span>
                    {active ? <span className="text-xs font-bold">On</span> : null}
                  </button>
                );
              })}
            </div>

            {programs.length ? (
              <>
                <p className="mt-3 font-mono text-[10px] tracking-wider text-muted uppercase">
                  Your programs
                </p>
                <div className="flex flex-col gap-1.5">
                  {programs.slice(0, 12).map((p) => {
                    const active = editingPlan?.programId === p.id && !editingPlan.rest;
                    const label = p.dayLabel
                      ? `${p.packName ? `${p.packName} · ` : ""}${p.dayLabel}`
                      : p.name;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          editDay != null &&
                          apply(editDay, { rest: false, templateId: null, programId: p.id })
                        }
                        className={cn(
                          "flex min-h-12 items-center justify-between rounded-2xl px-4 text-left text-sm font-semibold",
                          active
                            ? "bg-accent text-accent-fg shadow-[var(--shadow-glow)]"
                            : "bg-surface-2 ring-1 ring-border",
                        )}
                      >
                        <span className="truncate">{label}</span>
                        {active ? <span className="text-xs font-bold">On</span> : null}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted">
                No saved programs yet — grab one from Discover or Programs, then pin it here.
              </p>
            )}

            {editDay != null && isPlanSet(editingPlan) ? (
              <p className="mt-2 text-xs text-muted">
                Current: {planLabel(editingPlan, programs) ?? (editingPlan?.rest ? "Rest" : "—")}
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

import { format, isAfter, isSameDay, startOfDay } from "date-fns";
import { weekTraining } from "@/lib/stats";
import { planLabel } from "@/lib/week-plan";
import { useGym } from "@/lib/store";
import { cn, formatVolume } from "@/lib/utils";

export function WeekStrip() {
  const sessions = useGym((s) => s.sessions);
  const unit = useGym((s) => s.settings.unit);
  const weekPlan = useGym((s) => s.settings.weekPlan);
  const programs = useGym((s) => s.programs);
  const week = weekTraining(sessions);
  const today = startOfDay(new Date());

  return (
    <section className="mt-6">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-lg font-bold">This week</h2>
        <p className="text-xs text-muted">
          {week.sessions} day{week.sessions === 1 ? "" : "s"} · {formatVolume(week.volume, unit)}
        </p>
      </div>
      <div className="mt-3 flex gap-1.5">
        {week.days.map((d) => {
          const plan = weekPlan?.[new Date(d.at).getDay()];
          const label = planLabel(plan, programs);
          const plannedWork = Boolean(plan && !plan.rest && (plan.templateId || plan.programId));
          const plannedRest = Boolean(plan?.rest);
          const future = isAfter(startOfDay(d.at), today);
          const isToday = isSameDay(d.at, today);
          return (
            <div
              key={d.at}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl py-2.5",
                d.trained
                  ? "bg-accent text-accent-fg"
                  : isToday
                    ? "bg-surface-2 ring-2 ring-accent"
                    : "bg-surface",
              )}
            >
              <span className={cn("text-[10px] font-bold uppercase", d.trained ? "opacity-80" : "text-muted")}>
                {format(d.at, "EEEEE")}
              </span>
              <span className="text-sm font-extrabold">
                {d.trained ? "✓" : plannedRest ? "R" : plannedWork && !future ? "!" : isToday ? "·" : ""}
              </span>
              <span className={cn("w-full truncate text-center text-[9px]", d.trained ? "opacity-80" : "text-muted")}>
                {d.trained ? "done" : plannedRest ? "rest" : label ? label.slice(0, 6) : ""}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { formatDistanceToNowStrict } from "date-fns";
import { MuscleMap } from "@/components/muscle-map";
import { lastTrained, muscleHitsThisWeek } from "@/lib/stats";
import { useGym } from "@/lib/store";
import { useEffect } from "react";
import { MUSCLES, type MuscleId, type Session } from "@/lib/types";

export const Route = createFileRoute("/muscles")({ component: MusclesPage });

function MusclesPage() {
  const setPlayerFlag = useGym((s) => s.setPlayerFlag);
  useEffect(() => {
    setPlayerFlag("visitedMuscles");
  }, [setPlayerFlag]);
  const sessions = useGym((s) => s.sessions);
  const hits = muscleHitsThisWeek(sessions);
  const [selected, setSelected] = useState<MuscleId | null>(null);
  const trained = MUSCLES.filter((m) => (hits[m.id] ?? 0) > 0);

  return (
    <main className="px-4 pt-4">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Muscle map</h1>
      <p className="mt-1 text-sm text-muted">Neon = you hit it this week. Tap a part to flex the details.</p>

      <div className="forge-neon-frame mt-6 rounded-[1.75rem] bg-surface px-3 py-4 shadow-[var(--shadow-lift)]">
        <MuscleMap
          hits={hits}
          selected={selected}
          onSelect={(id) => setSelected((cur) => (cur === id ? null : id))}
        />
      </div>

      {selected ? <MuscleDetail id={selected} hits={hits[selected] ?? 0} sessions={sessions} /> : null}

      <ul className="mt-6 divide-y divide-border rounded-xl bg-surface shadow-[var(--shadow-border)]">
        {MUSCLES.map((m) => {
          const last = lastTrained(sessions, m.id);
          const n = hits[m.id] ?? 0;
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setSelected(m.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span>
                  <span className="block text-sm font-medium">{m.label}</span>
                  <span className="font-mono text-[11px] text-muted">
                    {last
                      ? `Last ${formatDistanceToNowStrict(last, { addSuffix: true })}`
                      : "Not logged"}
                  </span>
                </span>
                <span className="font-mono text-sm tabular-nums text-muted">{n} sets</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 pb-2 text-center font-mono text-[10px] tracking-wider text-subtle uppercase">
        {trained.length} of {MUSCLES.length} areas this week
      </p>
    </main>
  );
}

function MuscleDetail({
  id,
  hits,
  sessions,
}: {
  id: MuscleId;
  hits: number;
  sessions: Session[];
}) {
  const meta = MUSCLES.find((m) => m.id === id)!;
  const last = lastTrained(sessions, id);
  const names = [
    ...new Set(
      sessions
        .filter((s) => s.finishedAt)
        .flatMap((s) =>
          s.exercises
            .filter((ex) => ex.muscles.includes(id) && ex.sets.some((set) => set.completed))
            .map((ex) => ex.name),
        ),
    ),
  ].slice(0, 8);

  return (
    <div className="mt-4 rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)]">
      <p className="font-display text-lg font-semibold">{meta.label}</p>
      <p className="mt-1 text-sm text-muted">
        {hits} sets this week
        {last ? ` · last ${formatDistanceToNowStrict(last, { addSuffix: true })}` : ""}
      </p>
      {names.length ? <p className="mt-2 text-sm text-muted">{names.join(" · ")}</p> : null}
    </div>
  );
}

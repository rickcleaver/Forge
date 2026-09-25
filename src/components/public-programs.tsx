import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { matchLibrary, resolveMuscles } from "@/lib/exercises";
import { parseCoachProgramText, type DraftDay } from "@/lib/parse-coach-program";
import { PUBLIC_PROGRAMS } from "@/lib/public-programs";
import { useGym } from "@/lib/store";
import type { ProgramExercise } from "@/lib/types";
import { MuscleMap, hitsFromWorkoutText } from "@/components/muscle-map";
import { Button } from "./ui/button";

function toExercises(day: DraftDay): ProgramExercise[] {
  return day.exercises.map((ex) => {
    const lib = matchLibrary(ex.name);
    return {
      libraryId: lib?.id ?? null,
      name: lib?.name ?? ex.name,
      muscles: resolveMuscles({ name: lib?.name ?? ex.name, libraryId: lib?.id, muscles: lib?.muscles }),
      notes: ex.notes || undefined,
      restSec: ex.restSec,
      sets: ex.sets.map((s) => ({
        weight: s.weight,
        reps: s.reps,
        warmup: s.warmup,
        durationMin: null,
        distance: null,
      })),
    };
  });
}

export function PublicProgramShelf() {
  const programs = useGym((s) => s.programs);
  const importProgramPack = useGym((s) => s.importProgramPack);
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const installed = new Set(programs.map((p) => p.packName).filter(Boolean));

  function add(id: string) {
    const spec = PUBLIC_PROGRAMS.find((p) => p.id === id);
    if (!spec) return;
    try {
      const pack = parseCoachProgramText(spec.text);
      importProgramPack({
        name: spec.name,
        source: spec.source,
        mapWeek: false,
        days: pack.days.map((d) => ({ label: d.label, exercises: toExercises(d) })),
      });
      setMsg(`${spec.name} is in My programs. Open a day when you’re ready.`);
    } catch {
      setMsg("Could not add that program.");
    }
  }

  return (
    <section className="mt-8">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-xl bg-surface px-4 py-4 text-left shadow-[var(--shadow-border)]"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>
          <span className="block text-xs font-semibold text-muted">Free programs</span>
          <span className="mt-1 block text-lg font-bold">Run a known split</span>
          <span className="mt-0.5 block text-sm text-muted">
            {PUBLIC_PROGRAMS.length} public templates · tap to {open ? "hide" : "show"}
          </span>
        </span>
        <ChevronDown className={`size-5 shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="mt-2">
          <p className="px-1 text-sm text-muted">
            Public templates, not paid influencer PDFs. Add one, then start a day like any other session.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {PUBLIC_PROGRAMS.map((p) => {
              const on = installed.has(p.name);
              return (
                <li key={p.id} className="rounded-2xl bg-surface px-3 py-3 shadow-[var(--shadow-border)]">
                  <div className="flex items-center gap-3">
                    <MuscleMap hits={hitsFromWorkoutText(p.text)} compact />
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold">{p.name}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {p.days} · {p.source}
                      </p>
                      <p className="mt-1 text-sm text-muted">{p.blurb}</p>
                    </div>
                    <Button type="button" variant={on ? "ghost" : "secondary"} disabled={on} onClick={() => add(p.id)}>
                      {on ? "Added" : "Add"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
          {msg ? <p className="mt-2 text-xs text-muted">{msg}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

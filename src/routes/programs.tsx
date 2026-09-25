import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Library } from "lucide-react";
import { ProgramImportButton } from "@/components/program-import";
import { PublicProgramShelf } from "@/components/public-programs";
import { MuscleMap, hitsFromExerciseIds, hitsFromProgramExercises } from "@/components/muscle-map";
import { Button } from "@/components/ui/button";
import { TEMPLATES } from "@/lib/exercises";
import { useGym } from "@/lib/store";
import type { Program } from "@/lib/types";
import { ForgeCharacter, ForgeEmptyState } from "@/components/forge-character";

export const Route = createFileRoute("/programs")({ component: ProgramsPage });

export function ProgramsPage() {
  const setPlayerFlag = useGym((s) => s.setPlayerFlag);
  useEffect(() => {
    setPlayerFlag("visitedPrograms");
  }, [setPlayerFlag]);
  const navigate = useNavigate();
  const programs = useGym((s) => s.programs);
  const startSession = useGym((s) => s.startSession);
  const deleteProgram = useGym((s) => s.deleteProgram);
  const deleteProgramPack = useGym((s) => s.deleteProgramPack);

  const packs = new Map<string, Program[]>();
  const singles: Program[] = [];
  for (const p of programs) {
    if (p.packId) {
      const list = packs.get(p.packId) ?? [];
      list.push(p);
      packs.set(p.packId, list);
    } else {
      singles.push(p);
    }
  }

  return (
    <main className="px-4 pt-4">
      <header className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Back"
          className="flex size-10 items-center justify-center rounded-full bg-surface text-muted shadow-[var(--shadow-border)]"
          onClick={() => void navigate({ to: "/session" })}
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-wider text-accent uppercase">Library</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Programs</h1>
        </div>
        <ForgeCharacter kind="mascot" size="xs" motion="none" className="shrink-0" />
      </header>
      <p className="mt-2 text-sm text-muted">
        Your saved days, public starters, and Spotter plans — pick one and go.
      </p>

      <div className="mt-5 flex flex-col gap-2">
        <ProgramImportButton />
        <Link
          to="/spotter"
          className="flex min-h-12 items-center justify-between rounded-xl bg-surface px-4 text-sm font-medium shadow-[var(--shadow-border)]"
        >
          Spotter coach plans
          <Library className="size-4 text-muted" />
        </Link>
      </div>

      {programs.length === 0 ? (
        <div className="mt-6">
          <ForgeEmptyState
            title="No saved programs yet"
            body="Finish a session → Save as program, or grab a public starter below."
            kind="mascot"
          />
        </div>
      ) : (
        <section className="mt-6">
          <h2 className="font-display text-lg font-semibold">Yours</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {[...packs.entries()].map(([packId, items]) => (
              <li key={packId} className="rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{items[0]?.packName ?? "Pack"}</p>
                  <button
                    type="button"
                    className="font-mono text-[10px] tracking-wider text-muted uppercase"
                    onClick={() => deleteProgramPack(packId)}
                  >
                    Delete pack
                  </button>
                </div>
                <ul className="mt-2 flex flex-col gap-1">
                  {items.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-xl bg-bg px-3 py-3 text-left"
                        onClick={() => {
                          startSession({ programId: p.id, name: p.dayLabel || p.name });
                          void navigate({ to: "/session" });
                        }}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{p.dayLabel || p.name}</span>
                          <span className="block text-xs text-muted">{p.exercises.length} lifts</span>
                        </span>
                        <MuscleMap hits={hitsFromProgramExercises(p.exercises)} compact />
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
            {singles.map((p) => (
              <li key={p.id}>
                <div className="flex items-center gap-2 rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center justify-between text-left"
                    onClick={() => {
                      startSession({ programId: p.id, name: p.name });
                      void navigate({ to: "/session" });
                    }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{p.name}</span>
                      <span className="block text-xs text-muted">{p.exercises.length} lifts</span>
                    </span>
                    <MuscleMap hits={hitsFromProgramExercises(p.exercises)} compact />
                  </button>
                  <button
                    type="button"
                    className="font-mono text-[10px] tracking-wider text-muted uppercase"
                    onClick={() => deleteProgram(p.id)}
                  >
                    Del
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Public starters</h2>
        <PublicProgramShelf />
      </section>

      <section className="mt-8 pb-4">
        <h2 className="font-display text-lg font-semibold">Templates</h2>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {TEMPLATES.map((tmpl) => (
            <li key={tmpl.id}>
              <button
                type="button"
                onClick={() => {
                  startSession({
                    templateId: tmpl.id,
                    name: tmpl.name === "Blank session" ? "Session" : tmpl.name,
                  });
                  void navigate({ to: "/session" });
                }}
                className="flex min-h-24 w-full flex-col rounded-2xl bg-surface px-3 py-3 text-left shadow-[var(--shadow-border)]"
              >
                {tmpl.exerciseIds.length ? (
                  <MuscleMap hits={hitsFromExerciseIds(tmpl.exerciseIds)} compact className="mx-auto" />
                ) : null}
                <span className="mt-1 block text-base font-bold">{tmpl.name}</span>
                <span className="mt-0.5 block text-xs text-muted">{tmpl.blurb}</span>
              </button>
            </li>
          ))}
        </ul>
        <Button variant="secondary" className="mt-4 w-full" onClick={() => void navigate({ to: "/session" })}>
          Back to Train
        </Button>
      </section>
    </main>
  );
}

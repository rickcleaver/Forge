import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Camera, Check, Plus, RotateCcw, X } from "lucide-react";
import { ExerciseCard } from "@/components/exercise-card";
import { ExercisePicker } from "@/components/exercise-picker";
import { MfpHandoff } from "@/components/mfp-handoff";
import { RecapScreen } from "@/components/recap-screen";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ScanLogButton } from "@/components/scan-log";
import { ProgramImportButton } from "@/components/program-import";
import { MuscleMap, hitsFromExerciseIds, hitsFromProgramExercises } from "@/components/muscle-map";
import { PublicProgramShelf } from "@/components/public-programs";
import { SessionPhotoButton } from "@/components/photo-capture";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ForgeCharacter, ForgeEmptyState } from "@/components/forge-character";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { coachWorkoutPlan } from "@/lib/coach-engine";
import { LIBRARY_MAP, TEMPLATES } from "@/lib/exercises";
import { isSetupSession, nextIncompleteSet, sessionDurationMs, sessionPrNames, sessionSetCount, sessionVolume } from "@/lib/stats";
import { speakText } from "@/lib/speech";
import { useGym } from "@/lib/store";
import { formatDuration, formatVolume } from "@/lib/utils";
import type { Program } from "@/lib/types";

export const Route = createFileRoute("/session")({ component: SessionPage });

function CoachStartCard({ onStart }: { onStart: () => void }) {
  const sessions = useGym((s) => s.sessions);
  const readiness = useGym((s) => s.readinessLogs);
  const settings = useGym((s) => s.settings);
  const plan = coachWorkoutPlan(sessions, readiness, settings);
  return (
    <section className="forge-card-play relative mt-5 overflow-hidden rounded-[1.75rem] bg-accent px-4 py-4 text-accent-fg shadow-[var(--shadow-glow)]">
      <span className="forge-blob forge-blob--a opacity-35" />
      <div className="relative z-[1] flex items-center gap-3">
        <div className="rounded-xl bg-bg/20 p-1">
          <MuscleMap hits={hitsFromExerciseIds(plan.exerciseIds)} compact />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold opacity-80">Built for you</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">{plan.name}</h2>
          <p className="mt-1 text-sm opacity-80">{plan.why}</p>
        </div>
        <ForgeCharacter kind="mascot" size="xs" motion="wiggle" className="shrink-0" />
      </div>
      <Button className="relative z-[1] mt-4 w-full rounded-full bg-bg text-fg shadow-none hover:bg-bg/90" onClick={onStart}>
        Use this session
      </Button>
    </section>
  );
}

function SessionPage() {
  const sessions = useGym((s) => s.sessions);
  const activeId = useGym((s) => s.activeSessionId);
  const startSession = useGym((s) => s.startSession);
  const startCoachSession = useGym((s) => s.startCoachSession);
  const repeatSession = useGym((s) => s.repeatSession);
  const programs = useGym((s) => s.programs);
  const deleteProgram = useGym((s) => s.deleteProgram);
  const deleteProgramPack = useGym((s) => s.deleteProgramPack);
  const [recapId, setRecapId] = useState<string | null>(null);
  const lastFinished = [...sessions]
    .filter((s) => s.finishedAt)
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))[0];
  const active = sessions.find((s) => s.id === activeId && !s.finishedAt);
  const recap = recapId ? sessions.find((s) => s.id === recapId) : null;
  const navigate = useNavigate();

  if (recap?.finishedAt) {
    return (
      <RecapScreen
        session={recap}
        onDone={() => {
          setRecapId(null);
          void navigate({ to: "/history" });
        }}
      />
    );
  }

  if (!active) {
    return (
      <main className="px-4 pt-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight forge-page-title">Train</h1>
            <p className="mt-1 text-sm text-muted">Pick today’s workout. Tap a card — logging stays fast.</p>
          </div>
          <Link
            to="/programs"
            className="mb-1 shrink-0 rounded-full bg-surface px-3 py-2 font-mono text-[10px] tracking-wider uppercase shadow-[var(--shadow-border)]"
          >
            Programs
          </Link>
        </div>
        <CoachStartCard onStart={() => startCoachSession()} />
        <div className="mt-6 flex flex-col gap-2">
          <ScanLogButton />
          <ProgramImportButton />
        </div>
        {programs.length > 0 ? (
          <ProgramList
            programs={programs}
            onStart={startSession}
            onDelete={deleteProgram}
            onDeletePack={deleteProgramPack}
          />
        ) : null}
        <PublicProgramShelf />
        {lastFinished ? (
          <button
            type="button"
            onClick={() => repeatSession(lastFinished.id)}
            className="mt-3 flex w-full items-center justify-between rounded-xl bg-accent px-4 py-4 text-left text-accent-fg"
          >
            <span>
              <span className="block font-mono text-[10px] tracking-wider uppercase">Repeat last</span>
              <span className="mt-1 block font-display text-lg font-semibold">{lastFinished.name}</span>
              <span className="mt-0.5 block text-sm opacity-70">
                {sessionSetCount(lastFinished)} sets logged — same weights waiting.
              </span>
            </span>
            <RotateCcw className="size-4" />
          </button>
        ) : null}
        <ul className={lastFinished ? "mt-3 grid grid-cols-2 gap-2" : "mt-5 grid grid-cols-2 gap-2"}>
          {TEMPLATES.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => {
                  startSession({ templateId: t.id, name: t.name === "Blank session" ? "Session" : t.name });
                }}
                className="flex min-h-24 w-full flex-col rounded-2xl bg-surface px-3 py-3 text-left shadow-[var(--shadow-border)]"
              >
                {t.exerciseIds.length ? (
                  <MuscleMap hits={hitsFromExerciseIds(t.exerciseIds)} compact className="mx-auto" />
                ) : null}
                <span className="mt-1 block text-base font-bold">{t.name}</span>
                <span className="mt-0.5 block text-xs text-muted">{t.blurb}</span>
              </button>
            </li>
          ))}
        </ul>
      </main>
    );
  }

  return <LiveSession id={active.id} onFinished={setRecapId} />;
}

function LiveSession({ id, onFinished }: { id: string; onFinished: (id: string) => void }) {
  const session = useGym((s) => s.sessions.find((x) => x.id === id));
  const unit = useGym((s) => s.settings.unit);
  const renameSession = useGym((s) => s.renameSession);
  const finishSession = useGym((s) => s.finishSession);
  const goLive = useGym((s) => s.goLive);
  const trimActiveSession = useGym((s) => s.trimActiveSession);
  const saveProgram = useGym((s) => s.saveProgram);
  const discardSession = useGym((s) => s.discardSession);
  const addExercise = useGym((s) => s.addExercise);
  const setSessionPhoto = useGym((s) => s.setSessionPhoto);
  const setSessionNotes = useGym((s) => s.setSessionNotes);
  const sessions = useGym((s) => s.sessions);
  const [picker, setPicker] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [programName, setProgramName] = useState("");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const navigate = useNavigate();

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  if (!session) return null;

  const sets = sessionSetCount(session);
  const volume = sessionVolume(session);
  const prs = sessionPrNames(session, sessions);
  const setup = isSetupSession(session);

  return (
    <main className="px-4 pt-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-muted">
            {setup ? "Setup" : "Live"}
          </p>
          <Input
            value={session.name}
            onChange={(e) => renameSession(id, e.target.value)}
            className="mt-0.5 h-auto border-0 bg-transparent px-0 font-display text-2xl font-extrabold tracking-tight shadow-none focus-visible:ring-0"
            aria-label="Session name"
          />
        </div>
        {setup ? (
          <Button size="sm" onClick={() => goLive(id)}>
            Start
          </Button>
        ) : (
          <div className="flex shrink-0 gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const nxt = nextIncompleteSet(session);
                speakText(
                  nxt
                    ? `Next. ${nxt.name}. ${nxt.label}.`
                    : "All sets are done.",
                );
              }}
            >
              Next
            </Button>
            <Button size="sm" onClick={() => setFinishOpen(true)}>
              <Check /> Finish
            </Button>
          </div>
        )}
      </header>

      <p className="mt-1 font-mono text-xs text-muted tabular-nums">
        {setup
          ? "Timer off · add or change lifts, then Start"
          : `${formatDuration(sessionDurationMs(session, now))} · ${sets} sets · ${formatVolume(volume, unit)}`}
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {([15, 25, 40, 90] as const).map((m) => {
            const selected = (session.targetMin ?? 90) === m;
            return (
              <Button
                key={m}
                className="flex-1"
                variant={selected ? "default" : "secondary"}
                onClick={() => trimActiveSession(m)}
              >
                {m === 90 ? "Full" : `${m} min`}
              </Button>
            );
          })}
        </div>
        {setup ? (
          <Button className="w-full" onClick={() => goLive(id)}>
            Start workout
          </Button>
        ) : null}
      </div>

      {session.photo ? (
        <img
          src={session.photo}
          alt=""
          className="mt-4 h-36 w-full rounded-lg object-cover"
        />
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <SessionPhotoButton photo={session.photo} onChange={(src) => setSessionPhoto(id, src)} />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {session.exercises.length === 0 ? (
          <ForgeEmptyState
            title="No lifts yet"
            body="Add from the library, or name one and tag muscles. Logging stays one-tap fast."
            kind="mascot"
          />
        ) : (
          session.exercises.map((ex, i) => (
            <ExerciseCard
              key={ex.id}
              sessionId={id}
              exercise={ex}
              index={i}
              total={session.exercises.length}
            />
          ))
        )}
      </div>

      <Button className="mt-4 mb-4 w-full" variant="secondary" onClick={() => setPicker(true)}>
        <Plus /> Add exercise
      </Button>

      <Button
        className="mb-4 w-full"
        variant="secondary"
        onClick={() => {
          setProgramName(session.name);
          setSavedMsg(null);
          setSaveOpen(true);
        }}
      >
        Save as program
      </Button>

      <button
        type="button"
        className="mb-2 w-full py-2 text-center text-xs text-subtle"
        onClick={() => setDiscardOpen(true)}
      >
        Discard session
      </button>
      <ConfirmDialog
        open={discardOpen}
        title="Discard session?"
        body="This session leaves the log. That cannot be undone."
        confirmLabel="Discard"
        onClose={() => setDiscardOpen(false)}
        onConfirm={() => {
          discardSession(id);
          setDiscardOpen(false);
          void navigate({ to: "/" });
        }}
      />

      <ExercisePicker
        open={picker}
        onOpenChange={setPicker}
        onPick={(p) => addExercise(id, p)}
      />

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogTitle>Save as program</DialogTitle>
          <DialogDescription>Name this lift list. Next time it shows on Start.</DialogDescription>
          <Input
            className="mt-4"
            placeholder="Tuesday Push"
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
          />
          {savedMsg ? <p className="mt-2 text-sm text-muted">{savedMsg}</p> : null}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                const ok = saveProgram(id, programName);
                setSavedMsg(ok ? "Saved." : "Add a lift and a name first.");
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
        <DialogContent>
          <DialogTitle>Finish session?</DialogTitle>
          <DialogDescription>
            {sets} sets · {formatDuration(sessionDurationMs(session, now))} · {formatVolume(volume, unit)}.
          </DialogDescription>
          {prs.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1">
              {prs.map((name) => (
                <Badge key={name} tone="accent">
                  PR {name}
                </Badge>
              ))}
            </div>
          ) : null}
          <Input
            className="mt-4"
            placeholder="Session notes"
            value={session.notes}
            onChange={(e) => setSessionNotes(id, e.target.value)}
          />
          <div className="mt-4">
            <MfpHandoff session={session} endedAt={now} />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setFinishOpen(false)}>
              Keep lifting
            </Button>
            <Button
              onClick={() => {
                finishSession(id);
                setFinishOpen(false);
                onFinished(id);
                void import("@/lib/spotter-sync").then((m) => m.pushWeekToCoach().catch(() => null));
                const gym = useGym.getState();
                gym.markBackedUp();
              }}
            >
              Finish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function groupPrograms(programs: Program[]): Array<{ key: string; title: string; packId: string | null; items: Program[] }> {
  const packs = new Map<string, Program[]>();
  const singles: Program[] = [];
  for (const p of programs) {
    if (p.packId) {
      const list = packs.get(p.packId) ?? [];
      list.push(p);
      packs.set(p.packId, list);
    } else singles.push(p);
  }
  const groups: Array<{ key: string; title: string; packId: string | null; items: Program[] }> = [
    ...packs.entries(),
  ].map(([packId, items]) => ({
    key: packId,
    title: items[0]?.packName || items[0]?.name || "Program",
    packId,
    items,
  }));
  for (const p of singles) {
    groups.push({ key: p.id, title: p.name, packId: null, items: [p] });
  }
  return groups;
}

function ProgramList({
  programs,
  onStart,
  onDelete,
  onDeletePack,
}: {
  programs: Program[];
  onStart: (opts: { programId: string; name?: string }) => void;
  onDelete: (id: string) => void;
  onDeletePack: (packId: string) => void;
}) {
  const groups = groupPrograms(programs);
  const [kill, setKill] = useState<{ kind: "pack" | "day"; id: string; name: string } | null>(null);
  return (
    <div className="mt-6 flex flex-col gap-4">
      {groups.map((g) => (
        <div key={g.key}>
          {g.packId ? (
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">{g.title}</p>
              <button
                type="button"
                className="font-mono text-[10px] tracking-wider text-muted uppercase"
                onClick={() => setKill({ kind: "pack", id: g.packId!, name: g.title })}
              >
                Delete pack
              </button>
            </div>
          ) : null}
          <ul className="flex flex-col gap-2">
            {g.items.map((p) => (
              <li key={p.id} className="flex items-stretch gap-1">
                <button
                  type="button"
                  onClick={() => onStart({ programId: p.id, name: p.dayLabel || p.name })}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-surface px-3 py-3 text-left shadow-[var(--shadow-border)]"
                >
                  <MuscleMap hits={hitsFromProgramExercises(p.exercises)} compact />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-muted">
                      {p.packId ? p.dayLabel || "Day" : "My program"}
                    </span>
                    <span className="mt-0.5 block text-base font-bold">{p.dayLabel || p.name}</span>
                    <span className="mt-0.5 block text-xs text-muted">{p.exercises.length} lifts</span>
                  </span>
                  <Plus className="size-4 shrink-0 text-muted" />
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-surface px-3 text-muted"
                  aria-label={`Delete ${p.name}`}
                  onClick={() => setKill({ kind: "day", id: p.id, name: p.dayLabel || p.name })}
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <ConfirmDialog
        open={Boolean(kill)}
        title={kill?.kind === "pack" ? "Delete this pack?" : "Delete this day?"}
        body={kill ? `${kill.name} leaves your programs.` : ""}
        confirmLabel="Delete"
        onClose={() => setKill(null)}
        onConfirm={() => {
          if (kill?.kind === "pack") onDeletePack(kill.id);
          if (kill?.kind === "day") onDelete(kill.id);
          setKill(null);
        }}
      />
    </div>
  );
}

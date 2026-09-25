import { useRef, useState } from "react";
import { Camera, FileText, ImagePlus, LoaderCircle } from "lucide-react";
import {
  parseCoachProgramText,
  SAMPLE_PPL_TEXT,
  type DraftDay,
  type DraftPack,
} from "@/lib/parse-coach-program";
import { matchLibrary, resolveMuscles } from "@/lib/exercises";
import type { ProgramExercise } from "@/lib/types";
import { parseCoachProgramPhoto } from "@/lib/parse-coach-program-ai";
import { compressScanImage } from "@/lib/photos";
import { useGym } from "@/lib/store";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";

const CAP_KEY = "forge-program-import-cap";
const CAP = 10;

function takeSlot(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const prev = JSON.parse(localStorage.getItem(CAP_KEY) ?? "{}") as { day?: string; n?: number };
    const n = prev.day === today ? (prev.n ?? 0) : 0;
    if (n >= CAP) return false;
    localStorage.setItem(CAP_KEY, JSON.stringify({ day: today, n: n + 1 }));
    return true;
  } catch {
    localStorage.setItem(CAP_KEY, JSON.stringify({ day: today, n: 1 }));
    return true;
  }
}

function draftToProgramExercises(day: DraftDay): ProgramExercise[] {
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

export function ProgramImportButton() {
  const importProgramPack = useGym((s) => s.importProgramPack);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pack, setPack] = useState<DraftPack | null>(null);
  const [name, setName] = useState("");
  const [mapWeek, setMapWeek] = useState(true);

  function reset() {
    setPack(null);
    setText("");
    setError(null);
    setName("");
    setMapWeek(true);
  }

  function applyText(raw: string) {
    setError(null);
    try {
      const next = parseCoachProgramText(raw);
      setPack(next);
      setName(next.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that program.");
      setPack(null);
    }
  }

  async function readFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!takeSlot()) {
      setError("Daily import limit reached. Paste the text instead.");
      return;
    }
    setBusy(true);
    try {
      const image = await compressScanImage(file);
      const result = await parseCoachProgramPhoto({ data: { image } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPack(result.pack);
      setName(result.pack.name);
    } catch {
      setError("Could not read that photo.");
    } finally {
      setBusy(false);
    }
  }

  function save() {
    if (!pack) return;
    const id = importProgramPack({
      name: name.trim() || pack.name,
      source: "coach",
      mapWeek,
      days: pack.days.map((d) => ({
        label: d.label,
        exercises: draftToProgramExercises(d),
      })),
    });
    if (!id) {
      setError("Nothing to save.");
      return;
    }
    reset();
    setOpen(false);
  }

  return (
    <>
      <Button type="button" variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        <FileText className="size-4" />
        Import coach program
      </Button>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          void readFile(file);
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          void readFile(file);
        }}
      />
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent className="max-h-[88dvh] overflow-y-auto">
          <DialogTitle>Import a program</DialogTitle>
          <DialogDescription>
            Paste a coach’s split (Nippard-style 3x8-10 lines) or snap a page. Forge turns each day into a tracked session.
          </DialogDescription>
          {!pack ? (
            <div className="mt-4 flex flex-col gap-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={9}
                placeholder={"Day 1 — Push\nBarbell Bench Press 3x8-10\nIncline Dumbbell Press 3x10-12"}
                className="w-full rounded-xl bg-bg px-3 py-3 font-mono text-sm text-fg"
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => applyText(text)} disabled={!text.trim()}>
                  Convert
                </Button>
                <Button type="button" variant="secondary" onClick={() => applyText(SAMPLE_PPL_TEXT)}>
                  Sample PPL
                </Button>
                <Button type="button" variant="secondary" disabled={busy} onClick={() => cameraRef.current?.click()}>
                  {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
                  Photo
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  disabled={busy}
                  aria-label="Choose a program photo"
                  onClick={() => galleryRef.current?.click()}
                >
                  <ImagePlus className="size-4" />
                </Button>
              </div>
              {busy ? <p className="text-xs text-muted">Reading the page…</p> : null}
              {error ? <p className="text-xs text-danger">{error}</p> : null}
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              <label className="text-xs text-muted">
                Program name
                <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <ul className="flex flex-col gap-2">
                {pack.days.map((d) => (
                  <li key={d.label} className="rounded-xl bg-bg px-3 py-3">
                    <p className="font-display text-sm font-semibold">{d.label}</p>
                    <p className="mt-1 text-xs text-muted">
                      {d.exercises.map((ex) => `${ex.name} ${ex.sets.length}×${ex.sets[0]?.reps ?? "?"}`).join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={mapWeek}
                  onChange={(e) => setMapWeek(e.target.checked)}
                  className="size-4 accent-[var(--accent)]"
                />
                Put days on this week (Mon first, Sunday rest)
              </label>
              {error ? <p className="text-xs text-danger">{error}</p> : null}
              <div className="flex gap-2">
                <Button type="button" className="flex-1" onClick={save}>
                  Save {pack.days.length} days
                </Button>
                <Button type="button" variant="secondary" onClick={() => setPack(null)}>
                  Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Camera, ImagePlus, LoaderCircle } from "lucide-react";
import { matchLibrary, resolveMuscles } from "@/lib/exercises";
import { parsePaperLog, type PaperLog } from "@/lib/parse-paper-log";
import { compressScanImage } from "@/lib/photos";
import { formatPrevLoad } from "@/lib/stats";
import { useGym } from "@/lib/store";
import { uid } from "@/lib/utils";
import type { ExerciseLog } from "@/lib/types";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";

const SCAN_CAP_KEY = "forge-scan-cap";
const SCAN_CAP = 8;

function takeScanSlot(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const prev = JSON.parse(localStorage.getItem(SCAN_CAP_KEY) ?? "{}") as { day?: string; n?: number };
    const n = prev.day === today ? (prev.n ?? 0) : 0;
    if (n >= SCAN_CAP) return false;
    localStorage.setItem(SCAN_CAP_KEY, JSON.stringify({ day: today, n: n + 1 }));
    return true;
  } catch {
    localStorage.setItem(SCAN_CAP_KEY, JSON.stringify({ day: today, n: 1 }));
    return true;
  }
}

function startedAtFrom(date: string | null): number {
  if (!date) return Date.now();
  const t = Date.parse(date.length === 10 ? `${date}T12:00:00` : date);
  return Number.isFinite(t) ? t : Date.now();
}

function toExercises(log: PaperLog): ExerciseLog[] {
  return log.exercises.map((ex) => {
    const lib = matchLibrary(ex.name);
    return {
      id: uid(),
      libraryId: lib?.id ?? null,
      name: lib?.name ?? ex.name,
      muscles: resolveMuscles({ name: lib?.name ?? ex.name, libraryId: lib?.id, muscles: lib?.muscles }),
      notes: "",
      photos: [],
      restSec: null,
      sets: ex.sets.map((s) => ({
        id: uid(),
        weight: s.weight,
        reps: s.reps,
        completed: true,
        warmup: s.warmup,
      })),
    };
  });
}

export function ScanLogButton({ compact = false }: { compact?: boolean }) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const importScannedSession = useGym((s) => s.importScannedSession);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [log, setLog] = useState<PaperLog | null>(null);
  const [name, setName] = useState("");

  async function readFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!takeScanSlot()) {
      setError("Daily scan limit reached. Try again tomorrow.");
      return;
    }
    setBusy(true);
    try {
      const image = await compressScanImage(file);
      const result = await parsePaperLog({ data: { image } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPhoto(image);
      setLog(result.log);
      setName(result.log.name);
    } catch {
      setError("Could not read that photo.");
    } finally {
      setBusy(false);
    }
  }

  function save(live: boolean) {
    if (!log) return;
    const id = importScannedSession({
      name,
      startedAt: startedAtFrom(log.date),
      photo,
      live,
      exercises: toExercises(log),
    });
    setLog(null);
    setPhoto(null);
    void navigate({ to: live ? "/session" : "/history", search: live ? undefined : undefined });
    void id;
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {compact ? (
          <Button type="button" variant="secondary" disabled={busy} onClick={() => cameraRef.current?.click()}>
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
            Scan paper log
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={busy}
              onClick={() => cameraRef.current?.click()}
            >
              {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
              Scan paper log
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              disabled={busy}
              aria-label="Choose a photo of a log"
              onClick={() => galleryRef.current?.click()}
            >
              <ImagePlus className="size-4" />
            </Button>
          </div>
        )}
        {error ? <p className="text-xs text-danger">{error}</p> : null}
        {busy ? <p className="text-xs text-muted">Reading the page…</p> : null}
      </div>
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

      <Dialog open={Boolean(log)} onOpenChange={(open) => !open && setLog(null)}>
        <DialogContent>
          <DialogTitle>Log from paper</DialogTitle>
          <DialogDescription>
            Check the lifts, then save to History or open them in Session to tweak.
          </DialogDescription>
          <Input className="mt-3" value={name} onChange={(e) => setName(e.target.value)} aria-label="Session name" />
          {photo ? (
            <img src={photo} alt="" className="mt-3 h-28 w-full rounded-md object-cover" />
          ) : null}
          <ul className="mt-3 flex max-h-56 flex-col gap-2 overflow-y-auto">
            {log?.exercises.map((ex, i) => (
              <li key={`${ex.name}-${i}`} className="rounded-md bg-surface-2 px-3 py-2">
                <p className="text-sm font-medium">{matchLibrary(ex.name)?.name ?? ex.name}</p>
                <p className="mt-0.5 font-mono text-[11px] text-muted">
                  {ex.sets.map((s) => `${s.warmup ? "W " : ""}${formatPrevLoad(s.weight, s.reps)}`).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            <Button type="button" onClick={() => save(false)}>
              Save to log
            </Button>
            <Button type="button" variant="secondary" onClick={() => save(true)}>
              Open in Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { reviewPhysique, reviewPhysiqueLocal } from "@/lib/physique-ai";
import { compressImage, shrinkDataUrl } from "@/lib/photos";
import { useGym } from "@/lib/store";
import type { PhysiquePose } from "@/lib/types";
import { Button } from "./ui/button";

const POSES: Array<{ id: PhysiquePose; label: string }> = [
  { id: "front", label: "Front" },
  { id: "back", label: "Back" },
  { id: "left", label: "Left" },
  { id: "right", label: "Right" },
];

export function PhysiqueCheckin() {
  const sessions = useGym((s) => s.sessions);
  const saved = useGym((s) => s.physiqueCheckins);
  const savePhysiqueCheckin = useGym((s) => s.savePhysiqueCheckin);
  const [photos, setPhotos] = useState<Partial<Record<PhysiquePose, string>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timedPose, setTimedPose] = useState<PhysiquePose | null>(null);
  const [open, setOpen] = useState(false);
  const last = saved[0];

  async function onFile(pose: PhysiquePose, file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const src = await compressImage(file, 640, 0.7);
      setPhotos((p) => ({ ...p, [pose]: src }));
    } catch {
      setError("Could not use that photo.");
    }
  }

  async function review() {
    const count = POSES.filter((p) => photos[p.id]).length;
    if (count < 2) {
      setError("Add at least front and back.");
      return;
    }
    setBusy(true);
    setError(null);
    const local = reviewPhysiqueLocal(sessions.filter((s) => s.finishedAt));
    try {
      const filled: Record<string, string> = {};
      for (const p of POSES) {
        if (!photos[p.id]) continue;
        filled[p.id] = await shrinkDataUrl(photos[p.id]!, 480, 0.62);
      }
      const result = await reviewPhysique({
        data: {
          photos: filled,
          snapshot: JSON.stringify(
            sessions
              .filter((s) => s.finishedAt)
              .slice(0, 8)
              .map((s) => ({
                name: s.name,
                at: s.finishedAt,
                lifts: s.exercises.map((e) => e.name),
                muscles: s.exercises.flatMap((e) => e.muscles),
              })),
          ),
        },
      });
      savePhysiqueCheckin({
        photos,
        note: result.note,
        focus: result.focus,
        strong: result.strong,
        score: result.score,
        angles: result.angles,
      });
    } catch {
      savePhysiqueCheckin({
        photos,
        note: local.note,
        focus: local.focus,
        strong: local.strong,
        score: local.score,
      });
    }
    setPhotos({});
    setBusy(false);
  }

  return (
    <section className="mt-8">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-xl bg-surface px-4 py-3 text-left shadow-[var(--shadow-border)]"
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          <span className="block font-mono text-[10px] tracking-wider text-muted uppercase">Weekly check-in</span>
          <span className="mt-0.5 block font-display text-lg font-semibold">Four angles</span>
          <span className="mt-1 block text-sm text-muted">
            Front, back, left, right. Forge looks at the shots and tells you what to train more this week.
          </span>
        </span>
        <span className="font-mono text-xs text-muted">{open ? "Hide" : last ? "View" : "Open"}</span>
      </button>
      {open ? (
        <div className="mt-3">
      <p className="text-sm text-muted">
        Front, back, left, right. Same light if you can. Shot has a 10s timer. File works too.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {POSES.map((p) => (
          <PoseSlot
            key={p.id}
            label={p.label}
            src={photos[p.id]}
            onPick={(f) => void onFile(p.id, f)}
            onTimedShot={() => setTimedPose(p.id)}
          />
        ))}
      </div>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      <Button className="mt-3 w-full" disabled={busy} onClick={() => void review()}>
        {busy ? "Reading photos…" : "Ask Forge"}
      </Button>

      {timedPose ? (
        <TimedShot
          label={POSES.find((p) => p.id === timedPose)?.label ?? "Shot"}
          onCancel={() => setTimedPose(null)}
          onCapture={(file) => {
            const pose = timedPose;
            setTimedPose(null);
            void onFile(pose, file);
          }}
        />
      ) : null}

      {last ? (
        <div className="mt-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[10px] tracking-wider text-muted uppercase">
            {format(last.at, "EEE d MMM")}
            {last.score != null ? ` · ${last.score}` : ""}
          </p>
          {(last.strong ?? []).length ? (
            <p className="mt-2 text-sm">Ahead: {(last.strong ?? []).join(", ")}</p>
          ) : null}
          {(last.focus ?? []).length ? (
            <p className="mt-1 text-sm">Train more: {(last.focus ?? []).join(", ")}</p>
          ) : null}
          {last.angles
            ? Object.entries(last.angles).map(([pose, line]) => (
                <p key={pose} className="mt-1 text-sm text-muted">
                  <span className="font-mono text-[10px] uppercase">{pose}</span> {line}
                </p>
              ))
            : null}
          <p className="mt-2 text-sm text-muted">{last.note}</p>
        </div>
      ) : null}
        </div>
      ) : null}
    </section>
  );
}

function PoseSlot({
  label,
  src,
  onPick,
  onTimedShot,
}: {
  label: string;
  src?: string;
  onPick: (file: File | undefined) => void;
  onTimedShot: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-well">
      {src ? <img src={src} alt="" className="size-full object-cover" /> : null}
      <span className="absolute top-1 left-1 rounded bg-bg/80 px-1.5 py-0.5 font-mono text-[10px] uppercase">
        {label}
      </span>
      <div className="absolute inset-x-1 bottom-1 flex gap-1">
        <button
          type="button"
          className="flex-1 rounded-md bg-bg/80 py-2 font-mono text-[10px] uppercase"
          onClick={onTimedShot}
        >
          Shot
        </button>
        <button
          type="button"
          className="flex-1 rounded-md bg-bg/80 py-2 font-mono text-[10px] uppercase"
          onClick={() => fileRef.current?.click()}
        >
          File
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function TimedShot({
  label,
  onCancel,
  onCapture,
}: {
  label: string;
  onCancel: () => void;
  onCapture: (file: File) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [count, setCount] = useState(10);
  const [err, setErr] = useState<string | null>(null);
  const shot = useRef(false);
  const captureRef = useRef(onCapture);
  captureRef.current = onCapture;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 720 }, height: { ideal: 960 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
      } catch {
        setErr("Camera permission needed for timed shot.");
      }
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (err) return;
    if (count <= 0) {
      if (shot.current) return;
      const video = videoRef.current;
      if (!video || video.videoWidth < 2) {
        const wait = window.setTimeout(() => setCount(0), 250);
        return () => window.clearTimeout(wait);
      }
      shot.current = true;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          captureRef.current(new File([blob], `${label}.jpg`, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.85,
      );
      return;
    }
    const t = window.setTimeout(() => setCount((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [count, err, label]);

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-bg">
      <video ref={videoRef} playsInline muted className="min-h-0 flex-1 object-cover" style={{ transform: "scaleX(-1)" }} />
      <div className="absolute inset-x-0 top-10 text-center">
        <p className="font-mono text-[10px] tracking-wider text-muted uppercase">{label}</p>
        <p className="font-display text-6xl font-semibold tabular-nums">{err ? "" : count > 0 ? count : ""}</p>
        {err ? <p className="mt-2 text-sm text-danger">{err}</p> : null}
      </div>
      <button type="button" className="absolute bottom-10 left-1/2 -translate-x-1/2 text-sm text-muted" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

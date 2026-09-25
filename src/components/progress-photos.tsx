import { useRef, useState } from "react";
import { format } from "date-fns";
import { Camera, Columns2, ImagePlus, LoaderCircle, X } from "lucide-react";
import { compressProgressImage } from "@/lib/photos";
import { useGym } from "@/lib/store";
import type { ProgressPhoto, WeighIn } from "@/lib/types";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";

const LB_TO_KG = 0.453592;

function nearestWeight(weighIns: WeighIn[], at: number): WeighIn | null {
  if (!weighIns.length) return null;
  const best = weighIns.reduce((a, b) => (Math.abs(b.at - at) < Math.abs(a.at - at) ? b : a));
  return Math.abs(best.at - at) <= 3 * 86_400_000 ? best : null;
}

export function ProgressPhotos() {
  const photos = useGym((s) => s.progressPhotos);
  const weighIns = useGym((s) => s.weighIns);
  const unit = useGym((s) => s.settings.unit);
  const addProgressPhoto = useGym((s) => s.addProgressPhoto);
  const removeProgressPhoto = useGym((s) => s.removeProgressPhoto);
  const patchProgressPhoto = useGym((s) => s.patchProgressPhoto);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [compare, setCompare] = useState(false);

  const open = photos.find((p) => p.id === openId) ?? null;
  const newest = photos[0] ?? null;
  const oldest = photos.length > 1 ? photos[photos.length - 1] : null;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const src = await compressProgressImage(file);
      const id = addProgressPhoto(src);
      if (!id) setError("24 shots max. Delete an older one first.");
    } catch {
      setError("Could not save that photo.");
    } finally {
      setBusy(false);
    }
  }

  function formatLb(lb: number) {
    return unit === "kg" ? `${Math.round(lb * LB_TO_KG * 10) / 10} kg` : `${Math.round(lb * 10) / 10} lb`;
  }

  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold">Progress</h2>
      <p className="mt-1 text-sm text-muted">Same light, same pose. Track the body, not just the log.</p>

      <div className="mt-3 flex gap-2">
        <Button type="button" variant="secondary" className="flex-1" disabled={busy} onClick={() => cameraRef.current?.click()}>
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
          Take photo
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          disabled={busy}
          aria-label="Add a progress photo from files"
          onClick={() => galleryRef.current?.click()}
        >
          <ImagePlus className="size-4" />
        </Button>
        {newest && oldest ? (
          <Button type="button" variant="secondary" size="icon" aria-label="Compare first and latest" onClick={() => setCompare(true)}>
            <Columns2 className="size-4" />
          </Button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}

      {photos.length === 0 ? (
        <div className="mt-3 rounded-xl bg-surface px-4 py-8 text-center text-sm text-muted shadow-[var(--shadow-border)]">
          First shot starts the timeline.
        </div>
      ) : (
        <ul className="mt-3 grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="block w-full overflow-hidden rounded-lg bg-surface-2"
                onClick={() => setOpenId(p.id)}
              >
                <img src={p.src} alt="" className="aspect-[3/4] w-full object-cover" />
                <p className="px-1.5 py-1 font-mono text-[10px] text-muted">{format(p.at, "d MMM")}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <Dialog open={Boolean(open)} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="p-3">
          <DialogTitle className="sr-only">Progress photo</DialogTitle>
          {open ? (
            <div className="flex flex-col gap-3">
              <img src={open.src} alt="" className="max-h-[60dvh] w-full rounded-lg object-contain" />
              <p className="font-mono text-[11px] text-muted">
                {format(open.at, "EEE d MMM yyyy")}
                {(() => {
                  const w = nearestWeight(weighIns, open.at);
                  return w ? ` · ${formatLb(w.lb)}` : "";
                })()}
              </p>
              <Input
                placeholder="Note (pose, lighting)"
                value={open.note}
                onChange={(e) => patchProgressPhoto(open.id, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                className="self-end text-danger"
                onClick={() => {
                  removeProgressPhoto(open.id);
                  setOpenId(null);
                }}
              >
                <X className="size-3.5" /> Delete
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={compare} onOpenChange={setCompare}>
        <DialogContent>
          <DialogTitle>Compare</DialogTitle>
          <DialogDescription>Oldest on the left, latest on the right.</DialogDescription>
          {oldest && newest ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ComparePane photo={oldest} weighIns={weighIns} formatLb={formatLb} />
              <ComparePane photo={newest} weighIns={weighIns} formatLb={formatLb} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ComparePane({
  photo,
  weighIns,
  formatLb,
}: {
  photo: ProgressPhoto;
  weighIns: WeighIn[];
  formatLb: (lb: number) => string;
}) {
  const w = nearestWeight(weighIns, photo.at);
  return (
    <div>
      <img src={photo.src} alt="" className="aspect-[3/4] w-full rounded-md object-cover" />
      <p className="mt-1.5 font-mono text-[10px] text-muted">
        {format(photo.at, "d MMM yy")}
        {w ? ` · ${formatLb(w.lb)}` : ""}
      </p>
    </div>
  );
}

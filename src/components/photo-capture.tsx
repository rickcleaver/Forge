import { useRef, useState } from "react";
import { Camera, ImagePlus, LoaderCircle, X } from "lucide-react";
import { compressImage } from "@/lib/photos";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";

type Props = {
  photos: string[];
  onAdd: (dataUrl: string) => void;
  onRemove: (index: number) => void;
  max?: number;
  readOnly?: boolean;
};

export function PhotoStrip({ photos, onAdd, onRemove, max = 4, readOnly }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const data = await compressImage(file);
      onAdd(data);
    } catch {
      setError("Could not save that photo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {photos.map((src, i) => (
          <div key={`${i}-${src.slice(0, 24)}`} className="relative shrink-0">
            <button
              type="button"
              className="block size-16 overflow-hidden rounded-md bg-surface-2"
              onClick={() => setPreview(src)}
            >
              <img src={src} alt="" className="size-full object-cover" />
            </button>
            {readOnly ? null : (
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => onRemove(i)}
                className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-bg text-fg shadow-[var(--shadow-border)]"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        ))}
        {photos.length < max && !readOnly ? (
          <>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              disabled={busy}
              className={cn(
                "flex size-16 shrink-0 flex-col items-center justify-center gap-1 rounded-md bg-surface-2 text-muted shadow-[var(--shadow-border)] transition-[background-color,color] duration-150 hover:text-fg",
              )}
            >
              {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
              <span className="font-mono text-[9px] tracking-wider uppercase">Shot</span>
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              disabled={busy}
              className="flex size-16 shrink-0 flex-col items-center justify-center gap-1 rounded-md bg-surface-2 text-muted shadow-[var(--shadow-border)] transition-[background-color,color] duration-150 hover:text-fg"
            >
              <ImagePlus className="size-4" />
              <span className="font-mono text-[9px] tracking-wider uppercase">File</span>
            </button>
          </>
        ) : null}
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}

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

      <Dialog open={Boolean(preview)} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="p-3">
          <DialogTitle className="sr-only">Photo</DialogTitle>
          {preview ? (
            <img src={preview} alt="Exercise photo" className="max-h-[70dvh] w-full rounded-lg object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function SessionPhotoButton({
  photo,
  onChange,
}: {
  photo: string | null;
  onChange: (src: string | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => ref.current?.click()}
        disabled={busy}
      >
        {busy ? <LoaderCircle className="animate-spin" /> : <Camera />}
        {photo ? "Replace photo" : "Add photo"}
      </Button>
      {photo ? (
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
          Remove
        </Button>
      ) : null}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          try {
            onChange(await compressImage(file));
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}

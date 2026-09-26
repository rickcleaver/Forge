import { useRef, useState } from "react";
import { Camera, ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { AVATAR_DEFS } from "@/lib/avatars";
import { compressImage } from "@/lib/photos";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export type AvatarPickerValue = {
  presetId: string | null;
  photoUrl: string | null;
};

type Props = {
  value: AvatarPickerValue;
  onChange: (next: AvatarPickerValue) => void;
  /** Compact grid for settings drawer */
  compact?: boolean;
  className?: string;
};

/**
 * Pick a neon cartoon preset, or capture / choose a photo.
 * Web / PWA: `<input type=file accept=image/* capture>` (selfie = user).
 * Native Cap later: see README Cap Camera note — web path always works.
 */
export function AvatarPicker({ value, onChange, compact, className }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      // Small edge for HUD circle — keeps IndexedDB payloads lean.
      const data = await compressImage(file, 384, 0.78);
      onChange({ presetId: null, photoUrl: data });
    } catch {
      setError("Could not use that photo — try another.");
    } finally {
      setBusy(false);
    }
  }

  const selectedPreset = value.photoUrl ? null : value.presetId;
  const preview = value.photoUrl ?? (selectedPreset ? AVATAR_DEFS.find((a) => a.id === selectedPreset)?.src : null);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {preview ? (
        <div className="flex items-center gap-3">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-well shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-ring)_70%,transparent)]">
            <img src={preview} alt="" className="size-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {value.photoUrl
                ? "Your photo"
                : AVATAR_DEFS.find((a) => a.id === selectedPreset)?.label ?? "Avatar"}
            </p>
            <p className="text-xs text-muted">Shows in the top HUD. Change anytime in Settings.</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Clear avatar"
            onClick={() => onChange({ presetId: null, photoUrl: null })}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ) : null}

      <div className={cn("grid gap-2", compact ? "grid-cols-5" : "grid-cols-5 sm:grid-cols-5")}>
        {AVATAR_DEFS.map((a) => {
          const on = selectedPreset === a.id;
          return (
            <button
              key={a.id}
              type="button"
              title={a.label}
              aria-label={a.label}
              aria-pressed={on}
              onClick={() => onChange({ presetId: a.id, photoUrl: null })}
              className={cn(
                "aspect-square overflow-hidden rounded-2xl bg-well transition-transform",
                on
                  ? "scale-105 shadow-[0_0_0_2px_var(--color-accent),0_0_16px_color-mix(in_srgb,var(--color-accent)_45%,transparent)]"
                  : "hover:brightness-110",
              )}
            >
              <img src={a.src} alt="" className="size-full object-cover" draggable={false} />
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          disabled={busy}
          onClick={() => cameraRef.current?.click()}
        >
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
          Take photo
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          disabled={busy}
          onClick={() => galleryRef.current?.click()}
        >
          <ImagePlus className="size-4" />
          From photos
        </Button>
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <p className="font-mono text-[10px] tracking-wider text-muted uppercase">
        Stays on this device · camera / gallery via web file input
      </p>

      {/* capture=user → front camera on mobile browsers / PWA */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="user"
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
    </div>
  );
}

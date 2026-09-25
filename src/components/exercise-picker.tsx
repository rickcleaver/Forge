import { useMemo, useRef, useState } from "react";
import { Camera, Check, Plus, Search } from "lucide-react";
import { LIBRARY, searchLibrary, GEAR_LABEL, type KitFilter, guessMusclesFromName } from "@/lib/exercises";
import { compressImage } from "@/lib/photos";
import { MUSCLES, type MuscleId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MuscleMap, hitsFromMuscles } from "@/components/muscle-map";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "./ui/drawer";
import { Input } from "./ui/input";

const KITS: Array<{ id: KitFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "home", label: "Home" },
  { id: "band", label: "Bands" },
  { id: "cardio", label: "Cardio" },
];

const FILTERS: Array<{ id: "all" | MuscleId; label: string }> = [
  { id: "all", label: "All" },
  { id: "chest", label: "Chest" },
  { id: "back", label: "Back" },
  { id: "shoulders", label: "Shoulders" },
  { id: "biceps", label: "Biceps" },
  { id: "triceps", label: "Triceps" },
  { id: "core", label: "Core" },
  { id: "quads", label: "Quads" },
  { id: "hamstrings", label: "Hams" },
  { id: "glutes", label: "Glutes" },
  { id: "calves", label: "Calves" },
  { id: "cardio", label: "Cardio" },
];

export type PickedExercise = {
  name: string;
  muscles: MuscleId[];
  libraryId?: string | null;
  photos?: string[];
};

export function ExercisePicker({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (picked: PickedExercise) => void;
}) {
  const [tab, setTab] = useState<"library" | "custom">("library");
  const [q, setQ] = useState("");
  const [kit, setKit] = useState<KitFilter>("all");
  const [muscle, setMuscle] = useState<"all" | MuscleId>("all");
  const [name, setName] = useState("");
  const [pickedMuscles, setPickedMuscles] = useState<MuscleId[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const camRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchLibrary(q, muscle, kit), [q, muscle, kit]);

  function reset() {
    setTab("library");
    setQ("");
    setKit("all");
    setMuscle("all");
    setName("");
    setPickedMuscles([]);
    setPhotos([]);
  }

  function pickLib(id: string, n: string, muscles: MuscleId[]) {
    onPick({ name: n, muscles, libraryId: id });
    onOpenChange(false);
    reset();
  }

  function submitCustom() {
    const trimmed = name.trim();
    if (!trimmed || pickedMuscles.length === 0) return;
    onPick({ name: trimmed, muscles: pickedMuscles, libraryId: null, photos });
    onOpenChange(false);
    reset();
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DrawerContent>
        <div className="flex flex-col gap-3 overflow-hidden px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div>
            <DrawerTitle>Add exercise</DrawerTitle>
            <DrawerDescription>
              {LIBRARY.length} lifts by body group. Gym, home, bands, or a photo.
            </DrawerDescription>
          </div>

          <div className="flex rounded-md bg-bg p-1">
            {(["library", "custom"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "h-9 flex-1 rounded-sm font-mono text-[10px] tracking-wider uppercase transition-[background-color,color] duration-150",
                  tab === t ? "bg-surface-2 text-fg" : "text-muted",
                )}
              >
                {t === "library" ? "Library" : "Custom / photo"}
              </button>
            ))}
          </div>

          {tab === "library" ? (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search — try band, squat, home"
                  className="pl-9"
                  autoFocus
                />
              </div>
              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1">
                {KITS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setKit(f.id)}
                    className={cn(
                      "h-8 shrink-0 rounded-full px-3 font-mono text-[10px] tracking-wider uppercase",
                      kit === f.id ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setMuscle(f.id)}
                    className={cn(
                      "h-8 shrink-0 rounded-full px-3 font-mono text-[10px] tracking-wider uppercase",
                      muscle === f.id ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <ul className="max-h-[50dvh] divide-y divide-border overflow-y-auto">
                {results.map((ex) => (
                  <li key={ex.id} className="[content-visibility:auto] [contain-intrinsic-size:0_72px]">
                    <button
                      type="button"
                      onClick={() => pickLib(ex.id, ex.name, ex.muscles)}
                      className="flex w-full items-center gap-3 py-2.5 text-left"
                    >
                      <MuscleMap
                        hits={hitsFromMuscles(ex.muscles)}
                        compact
                        className="w-[4.75rem] pointer-events-none"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{ex.name}</span>
                        <span className="mt-0.5 flex flex-wrap gap-1">
                          <Badge>{GEAR_LABEL[ex.gear]}</Badge>
                          {ex.muscles
                            .filter((m) => m !== "cardio")
                            .slice(0, 3)
                            .map((m) => (
                              <Badge key={m}>{m}</Badge>
                            ))}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
                {results.length === 0 ? (
                  <li className="py-8 text-center text-sm text-muted">
                    No match. Switch to custom.
                  </li>
                ) : null}
              </ul>
            </>
          ) : (
            <div className="flex max-h-[60dvh] flex-col gap-4 overflow-y-auto pb-2">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] tracking-wider text-muted uppercase">Name</span>
                <Input
                  value={name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setName(v);
                    setPickedMuscles((prev) => (prev.length ? prev : guessMusclesFromName(v)));
                  }}
                  placeholder="e.g. Band face pull"
                />
              </label>

              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] tracking-wider text-muted uppercase">
                  Muscles worked
                </span>
                {pickedMuscles.some((m) => m !== "cardio") ? (
                  <MuscleMap
                    hits={hitsFromMuscles(pickedMuscles)}
                    compact
                    className="w-[7.5rem] self-center pointer-events-none"
                  />
                ) : null}
                <div className="flex flex-wrap gap-1.5">
                  {MUSCLES.map((m) => {
                    const on = pickedMuscles.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          setPickedMuscles((prev) =>
                            on ? prev.filter((x) => x !== m.id) : [...prev, m.id],
                          )
                        }
                        className={cn(
                          "inline-flex h-8 items-center gap-1 rounded-full px-3 font-mono text-[10px] tracking-wider uppercase transition-[background-color,color] duration-150",
                          on ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
                        )}
                      >
                        {on ? <Check className="size-3" /> : null}
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] tracking-wider text-muted uppercase">
                  Photo (optional)
                </span>
                <div className="flex gap-2">
                  {photos.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="size-16 rounded-md object-cover"
                      onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                    />
                  ))}
                  {photos.length < 2 ? (
                    <button
                      type="button"
                      onClick={() => camRef.current?.click()}
                      className="flex size-16 flex-col items-center justify-center gap-1 rounded-md bg-surface-2 text-muted"
                    >
                      <Camera className="size-4" />
                      <span className="font-mono text-[9px] tracking-wider uppercase">Add</span>
                    </button>
                  ) : null}
                </div>
                <input
                  ref={camRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    const data = await compressImage(file);
                    setPhotos((p) => [...p, data].slice(0, 2));
                  }}
                />
              </div>

              <Button
                onClick={submitCustom}
                disabled={!name.trim() || pickedMuscles.length === 0}
              >
                <Plus className="size-4" />
                Add to session
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export const LIBRARY_COUNT = LIBRARY.length;

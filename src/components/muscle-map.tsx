import { cn } from "@/lib/utils";
import { LIBRARY_MAP, matchLibrary } from "@/lib/exercises";
import type { MuscleId, ProgramExercise } from "@/lib/types";

type Hits = Partial<Record<MuscleId, number>>;

type Props = {
  hits?: Hits;
  selected?: MuscleId | null;
  onSelect?: (id: MuscleId) => void;
  className?: string;
  compact?: boolean;
};

export function hitsFromMuscles(ids: MuscleId[]): Hits {
  const hits: Hits = {};
  for (const m of ids) {
    if (m === "cardio") continue;
    hits[m] = 8;
  }
  return hits;
}

export function hitsFromExerciseIds(ids: string[]): Hits {
  const hits: Hits = {};
  for (const id of ids) {
    for (const m of LIBRARY_MAP[id]?.muscles ?? []) {
      if (m === "cardio") continue;
      hits[m] = (hits[m] ?? 0) + 6;
    }
  }
  return hits;
}

export function hitsFromProgramExercises(exercises: ProgramExercise[]): Hits {
  const hits: Hits = {};
  for (const ex of exercises) {
    for (const m of ex.muscles) {
      if (m === "cardio") continue;
      hits[m] = (hits[m] ?? 0) + 6;
    }
  }
  return hits;
}

export function hitsFromWorkoutText(text: string): Hits {
  const hits: Hits = {};
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || /^(day|week)\b/i.test(line) || line.length < 4) continue;
    const name = line.replace(/\s+\d+\s*[x×].*$/i, "").trim();
    const lib = matchLibrary(name);
    if (!lib) continue;
    for (const m of lib.muscles) {
      if (m === "cardio") continue;
      hits[m] = (hits[m] ?? 0) + 4;
    }
  }
  return hits;
}

const FRONT_IDS: MuscleId[] = ["shoulders", "chest", "biceps", "core", "quads", "calves"];
const BACK_IDS: MuscleId[] = ["shoulders", "back", "triceps", "glutes", "hamstrings", "calves"];

/** Invisible tap targets only — color comes from per-muscle PNG masks. */
const FRONT_TAP: Array<{ id: MuscleId; d: string }> = [
  { id: "shoulders", d: "M48 62h28v40H48Z" },
  { id: "shoulders", d: "M124 62h28v40h-28Z" },
  { id: "chest", d: "M72 70h56v48H72Z" },
  { id: "biceps", d: "M40 88h24v48H40Z" },
  { id: "biceps", d: "M136 88h24v48h-24Z" },
  { id: "core", d: "M78 118h44v52H78Z" },
  { id: "quads", d: "M68 172h64v72H68Z" },
  { id: "calves", d: "M72 248h56v40H72Z" },
];

const BACK_TAP: Array<{ id: MuscleId; d: string }> = [
  { id: "shoulders", d: "M48 62h28v40H48Z" },
  { id: "shoulders", d: "M124 62h28v40h-28Z" },
  { id: "back", d: "M70 64h60v100H70Z" },
  { id: "triceps", d: "M40 88h24v48H40Z" },
  { id: "triceps", d: "M136 88h24v48h-24Z" },
  { id: "glutes", d: "M72 164h56v36H72Z" },
  { id: "hamstrings", d: "M70 200h60v52H70Z" },
  { id: "calves", d: "M74 252h52v36H74Z" },
];

function Tint({ view, id }: { view: "front" | "back"; id: MuscleId }) {
  const src = `/art/muscles/${view}-${id}.png`;
  return (
    <div
      className="pointer-events-none absolute inset-0 bg-muscle-hit"
      style={{
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskSize: "100% 100%",
        WebkitMaskSize: "100% 100%",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
      }}
    />
  );
}

function Plate({
  src,
  view,
  hits,
  selected,
  onSelect,
  alt,
}: {
  src: string;
  view: "front" | "back";
  hits: Hits;
  selected?: MuscleId | null;
  onSelect?: (id: MuscleId) => void;
  alt: string;
}) {
  const ids = view === "front" ? FRONT_IDS : BACK_IDS;
  const taps = view === "front" ? FRONT_TAP : BACK_TAP;
  return (
    <div className="relative">
      <img src={src} alt={alt} draggable={false} className="block h-auto w-full select-none" />
      {ids.map((id) =>
        (hits[id] ?? 0) > 0 || selected === id ? <Tint key={id} view={view} id={id} /> : null,
      )}
      {onSelect ? (
        <svg viewBox="0 0 200 300" className="absolute inset-0 h-full w-full">
          {taps.map((p, i) => (
            <path
              key={`${p.id}-${i}`}
              d={p.d}
              fill="transparent"
              className="cursor-pointer"
              onClick={() => onSelect(p.id)}
              role="button"
              tabIndex={0}
              aria-label={p.id}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(p.id);
                }
              }}
            />
          ))}
        </svg>
      ) : null}
    </div>
  );
}

export function MuscleMap({ hits = {}, selected = null, onSelect, className, compact }: Props) {
  const pair = (
    <div className="grid grid-cols-2 items-end gap-0 overflow-hidden rounded-xl bg-white">
      <Plate
        src="/art/muscle-front.jpg"
        view="front"
        alt="Front muscles"
        hits={hits}
        selected={selected}
        onSelect={onSelect}
      />
      <Plate
        src="/art/muscle-back.jpg"
        view="back"
        alt="Back muscles"
        hits={hits}
        selected={selected}
        onSelect={onSelect}
      />
    </div>
  );

  if (compact) {
    return <div className={cn("w-[8.5rem] shrink-0", className)}>{pair}</div>;
  }

  return (
    <div className={cn("w-full", className)}>
      {pair}
      <p className="mt-2 text-center text-[10px] font-semibold text-muted">
        Color fills the exact muscle plates
      </p>
    </div>
  );
}

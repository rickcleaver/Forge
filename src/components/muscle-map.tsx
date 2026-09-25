import { useId } from "react";
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

type PathSpec = { id: MuscleId; d: string };

/**
 * Cartoon athlete plates — athletic proportions, thick sticker outlines.
 * Regions keep the same MuscleId contract as the old mask map.
 */
const FRONT_PATHS: PathSpec[] = [
  // delts
  { id: "shoulders", d: "M44 68c-2-8 6-18 18-18 8 0 14 6 16 14 2 10-2 20-12 24-12 4-22-4-22-20z" },
  { id: "shoulders", d: "M156 68c2-8-6-18-18-18-8 0-14 6-16 14-2 10 2 20 12 24 12 4 22-4 22-20z" },
  // pecs
  { id: "chest", d: "M68 78c0-8 10-16 24-14 6 1 8 4 8 8v22c0 10-8 16-20 14-10-2-14-10-12-20v-10z" },
  { id: "chest", d: "M132 78c0-8-10-16-24-14-6 1-8 4-8 8v22c0 10 8 16 20 14 10-2 14-10 12-20v-10z" },
  // biceps
  { id: "biceps", d: "M38 88c-8 4-12 22-8 40 3 14 14 22 24 16 8-5 10-20 6-34-4-14-12-26-22-22z" },
  { id: "biceps", d: "M162 88c8 4 12 22 8 40-3 14-14 22-24 16-8-5-10-20-6-34 4-14 12-26 22-22z" },
  // core / abs block
  { id: "core", d: "M82 118c-4 2-8 8-8 16v40c0 12 10 20 26 20s26-8 26-20v-40c0-8-4-14-8-16-6 4-12 6-18 6s-12-2-18-6z" },
  // quads
  { id: "quads", d: "M70 178c-6 4-12 18-10 40 2 24 10 42 22 42 8 0 12-10 14-22 2 12 6 22 14 22 12 0 20-18 22-42 2-22-4-36-10-40-8-4-16 4-20 10-4-6-12-14-20-10z" },
  // calves
  { id: "calves", d: "M76 256c-5 2-10 14-7 26 3 12 12 18 22 14 4-2 6-8 7-14 1 6 3 12 7 14 10 4 19-2 22-14 3-12-2-24-7-26-7-3-13 4-17 10-4-6-10-13-17-10z" },
];

const BACK_PATHS: PathSpec[] = [
  { id: "shoulders", d: "M44 68c-2-8 6-18 18-18 8 0 14 6 16 14 2 10-2 20-12 24-12 4-22-4-22-20z" },
  { id: "shoulders", d: "M156 68c2-8-6-18-18-18-8 0-14 6-16 14-2 10 2 20 12 24 12 4 22-4 22-20z" },
  // lats + mid-back as one selectable "back"
  {
    id: "back",
    d: "M66 72c-6 10-12 34-6 60 6 28 20 48 40 50 4 0 6 0 6 0s2 0 6 0c20-2 34-22 40-50 6-26 0-50-6-60-8-12-22-8-30 2-8-10-22-14-30-2z",
  },
  { id: "triceps", d: "M38 88c-8 4-12 22-8 40 3 14 14 22 24 16 8-5 10-20 6-34-4-14-12-26-22-22z" },
  { id: "triceps", d: "M162 88c8 4 12 22 8 40-3 14-14 22-24 16-8-5-10-20-6-34 4-14 12-26 22-22z" },
  { id: "glutes", d: "M74 170c-4 2-12 12-10 26 2 14 14 22 36 20 4 0 6-1 6-1s2 1 6 1c22 2 34-6 36-20 2-14-6-24-10-26-10-6-22 2-28 10-6-8-18-16-28-10z" },
  {
    id: "hamstrings",
    d: "M72 206c-5 4-12 18-10 36 2 20 10 34 20 34 8 0 12-10 14-20 2 10 6 20 14 20 10 0 18-14 20-34 2-18-5-32-10-36-8-5-16 4-20 10-4-6-12-15-20-10z",
  },
  { id: "calves", d: "M76 256c-5 2-10 14-7 26 3 12 12 18 22 14 4-2 6-8 7-14 1 6 3 12 7 14 10 4 19-2 22-14 3-12-2-24-7-26-7-3-13 4-17 10-4-6-10-13-17-10z" },
];

function lit(hits: Hits, selected: MuscleId | null | undefined, id: MuscleId) {
  return selected === id || (hits[id] ?? 0) > 0;
}

function Plate({
  view,
  hits,
  selected,
  onSelect,
  label,
}: {
  view: "front" | "back";
  hits: Hits;
  selected?: MuscleId | null;
  onSelect?: (id: MuscleId) => void;
  label: string;
}) {
  const paths = view === "front" ? FRONT_PATHS : BACK_PATHS;
  const interactive = Boolean(onSelect);
  const glowId = `${useId().replace(/:/g, "")}-glow`;

  return (
    <div className="relative">
      <svg
        viewBox="0 0 200 300"
        className="block h-auto w-full select-none"
        role="img"
        aria-label={label}
      >
        <defs>
          <filter id={glowId} x="-45%" y="-45%" width="190%" height="190%">
            <feGaussianBlur stdDeviation="2.8" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse cx="100" cy="292" rx="58" ry="7" className="fill-well/70" />

        {/* cohesive athletic silhouette */}
        <path
          d="M100 52
             C86 52 78 58 72 68
             C58 70 46 78 42 92
             C36 110 34 132 40 152
             C46 160 54 164 58 160
             L62 170
             C58 200 62 236 70 256
             C74 268 78 280 86 286
             L96 286
             C98 278 100 270 100 262
             C100 270 102 278 104 286
             L114 286
             C122 280 126 268 130 256
             C138 236 142 200 138 170
             L142 160
             C146 164 154 160 160 152
             C166 132 164 110 158 92
             C154 78 142 70 128 68
             C122 58 114 52 100 52Z"
          className="fill-muscle/55 stroke-muscle-ink/20"
          strokeWidth="1.5"
        />

        {/* head — friendly cartoon teen, not clinical */}
        <ellipse cx="100" cy="30" rx="18" ry="20" className="fill-skin" />
        {view === "front" ? (
          <>
            <path
              d="M84 18c2-12 30-12 32 0 2 4 0 8-3 9-8 2-18 2-26 0-3-1-5-5-3-9z"
              className="fill-fg/95"
            />
            <path
              d="M90 8c2-5 6-7 9-3M101 7c3-6 8-7 11-2M112 10c2-4 5-5 7-1"
              className="fill-none stroke-fg"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            <circle cx="93" cy="31" r="2.3" className="fill-fg/90" />
            <circle cx="107" cy="31" r="2.3" className="fill-fg/90" />
            <circle cx="93.7" cy="30.3" r="0.7" className="fill-bg" />
            <circle cx="107.7" cy="30.3" r="0.7" className="fill-bg" />
            <path d="M94 40c3 4 9 4 12 0" className="fill-none stroke-fg/80" strokeWidth="2" strokeLinecap="round" />
          </>
        ) : (
          <path
            d="M82 14c5-11 31-11 36 0 2 9-1 18-8 22-6 3-14 3-20 0-7-4-10-13-8-22z"
            className="fill-fg/95"
          />
        )}
        <path d="M92 48c2 7 6 11 8 11s6-4 8-11c-4 2-12 2-16 0z" className="fill-skin" />

        {/* forearms + hands + feet (decorative) */}
        <path d="M40 148c-3 10-2 24 4 32 4 6 12 6 14 0 1-8-1-18-4-26-2-6-8-10-14-6z" className="fill-skin/90" />
        <path d="M160 148c3 10 2 24-4 32-4 6-12 6-14 0-1-8 1-18 4-26 2-6 8-10 14-6z" className="fill-skin/90" />
        <ellipse cx="44" cy="182" rx="10" ry="7.5" className="fill-skin" />
        <ellipse cx="156" cy="182" rx="10" ry="7.5" className="fill-skin" />
        <path d="M80 284c-1 5 4 12 14 11h6c5 0 9-5 7-10-3-6-12-8-20-5z" className="fill-skin" />
        <path d="M120 284c1 5-4 12-14 11h-6c-5 0-9-5-7-10 3-6 12-8 20-5z" className="fill-skin" />

        {paths.map((p, i) => {
          const on = lit(hits, selected, p.id);
          const sel = selected === p.id;
          return (
            <path
              key={`${p.id}-${i}`}
              d={p.d}
              className={cn(
                "stroke-muscle-ink/40 transition-[fill,filter,stroke] duration-200",
                on ? "fill-muscle-hit" : "fill-muscle",
                sel && "stroke-accent",
                interactive && "cursor-pointer",
              )}
              strokeWidth={sel ? 3 : 2.4}
              strokeLinejoin="round"
              style={on ? { filter: `url(#${glowId})` } : undefined}
              onClick={
                interactive
                  ? (e) => {
                      e.stopPropagation();
                      onSelect?.(p.id);
                    }
                  : undefined
              }
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={interactive ? p.id : undefined}
              aria-pressed={interactive ? selected === p.id : undefined}
              onKeyDown={
                interactive
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect?.(p.id);
                      }
                    }
                  : undefined
              }
            />
          );
        })}

        {view === "front" ? (
          <path
            d="M100 124v46M88 136h24M88 150h24M88 164h24"
            className="pointer-events-none fill-none stroke-muscle-ink/30"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M100 84v88M86 108c10 8 18 8 28 0M84 140c12 10 20 10 32 0"
            className="pointer-events-none fill-none stroke-muscle-ink/30"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
}

export function MuscleMap({ hits = {}, selected = null, onSelect, className, compact }: Props) {
  const pair = (
    <div className="grid grid-cols-2 items-end gap-1 overflow-hidden rounded-2xl bg-surface-2/90 px-1.5 pt-2 pb-1">
      <Plate view="front" label="Front muscles" hits={hits} selected={selected} onSelect={onSelect} />
      <Plate view="back" label="Back muscles" hits={hits} selected={selected} onSelect={onSelect} />
    </div>
  );

  if (compact) {
    return <div className={cn("w-[8.5rem] shrink-0", className)}>{pair}</div>;
  }

  return (
    <div className={cn("w-full", className)}>
      {pair}
      <p className="mt-2 text-center text-[10px] font-semibold text-muted">
        Neon = you hit it · tap a muscle to flex
      </p>
    </div>
  );
}

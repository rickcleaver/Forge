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

/** Region IDs drawn on each view — exported so tests can lock the contract. */
export const FRONT_REGION_IDS: MuscleId[] = [
  "shoulders",
  "chest",
  "biceps",
  "core",
  "quads",
  "calves",
];
export const BACK_REGION_IDS: MuscleId[] = [
  "shoulders",
  "back",
  "triceps",
  "glutes",
  "hamstrings",
  "calves",
];

/** Athletic teen sticker silhouette — neck, V-taper, defined limbs. */
const BODY_OUTLINE = "M100 50C91 50 84 55 81 62C65 64 51 72 46 88C40 108 38 128 44 146C47 153 54 155 58 149L59 162C54 192 57 228 66 250C71 264 79 276 90 282L97 282C99 274 100 266 100 258C100 266 101 274 103 282L110 282C121 276 129 264 134 250C143 228 146 192 141 162L142 149C146 155 153 153 156 146C162 128 160 108 154 88C149 72 135 64 119 62C116 55 109 50 100 50Z";

/**
 * Front plates — puzzle pieces with intentional gutters (dark stroke + spacing)
 * so hit neon stays readable as separate regions, not one cyan blob.
 */
const FRONT_PATHS: PathSpec[] = [
  { id: "shoulders", d: "M44 80C40 68 48 56 61 54C70 52 76 56 78 64C80 72 76 82 66 86C55 91 47 90 44 80Z" },
  { id: "shoulders", d: "M156 80C160 68 152 56 139 54C130 52 124 56 122 64C120 72 124 82 134 86C145 91 153 90 156 80Z" },
  { id: "chest", d: "M75 64C76 56 86 52 96 54C99 55 101 59 101 65L101 98C101 108 92 114 83 110C73 106 69 96 71 86C72 76 73 68 75 64Z" },
  { id: "chest", d: "M125 64C124 56 114 52 104 54C101 55 99 59 99 65L99 98C99 108 108 114 117 110C127 106 131 96 129 86C128 76 127 68 125 64Z" },
  { id: "biceps", d: "M43 88C36 94 33 112 35 130C37 144 46 150 54 144C60 139 60 126 58 112C56 98 49 86 43 88Z" },
  { id: "biceps", d: "M157 88C164 94 167 112 165 130C163 144 154 150 146 144C140 139 140 126 142 112C144 98 151 86 157 88Z" },
  { id: "core", d: "M79 118C73 124 71 134 71 144L73 170C75 182 85 190 100 190C115 190 125 182 127 170L129 144C129 134 127 124 121 118C111 126 89 126 79 118Z" },
  { id: "quads", d: "M71 198C63 206 59 230 63 252C67 266 79 272 89 264C95 258 97 244 95 226C93 210 85 198 77 196C75 196 73 196 71 198Z" },
  { id: "quads", d: "M129 198C137 206 141 230 137 252C133 266 121 272 111 264C105 258 103 244 105 226C107 210 115 198 123 196C125 196 127 196 129 198Z" },
  { id: "calves", d: "M75 268C69 274 71 288 81 292C89 295 95 288 95 278C95 272 87 266 79 266C77 266 76 267 75 268Z" },
  { id: "calves", d: "M125 268C131 274 129 288 119 292C111 295 105 288 105 278C105 272 113 266 121 266C123 266 124 267 125 268Z" },
];

const BACK_PATHS: PathSpec[] = [
  { id: "shoulders", d: "M44 80C40 68 48 56 61 54C70 52 76 56 78 64C80 72 76 82 66 86C55 91 47 90 44 80Z" },
  { id: "shoulders", d: "M156 80C160 68 152 56 139 54C130 52 124 56 122 64C120 72 124 82 134 86C145 91 153 90 156 80Z" },
  { id: "back", d: "M73 62C63 70 53 94 57 126C61 152 75 168 96 170L104 170C125 168 139 152 143 126C147 94 137 70 127 62C117 70 109 76 100 76C91 76 83 70 73 62Z" },
  { id: "triceps", d: "M43 88C36 94 33 112 35 130C37 144 46 150 54 144C60 139 60 126 58 112C56 98 49 86 43 88Z" },
  { id: "triceps", d: "M157 88C164 94 167 112 165 130C163 144 154 150 146 144C140 139 140 126 142 112C144 98 151 86 157 88Z" },
  { id: "glutes", d: "M73 174C65 180 63 194 71 206C79 216 91 218 100 212C109 218 121 216 129 206C137 194 135 180 127 174C117 168 109 178 100 184C91 178 83 168 73 174Z" },
  { id: "hamstrings", d: "M71 212C63 220 59 240 63 258C67 270 79 274 89 266C95 260 97 246 95 230C93 218 85 210 77 210C75 210 73 210 71 212Z" },
  { id: "hamstrings", d: "M129 212C137 220 141 240 137 258C133 270 121 274 111 266C105 260 103 246 105 230C107 218 115 210 123 210C125 210 127 210 129 212Z" },
  { id: "calves", d: "M75 268C69 274 71 288 81 292C89 295 95 288 95 278C95 272 87 266 79 266C77 266 76 267 75 268Z" },
  { id: "calves", d: "M125 268C131 274 129 288 119 292C111 295 105 288 105 278C105 272 113 266 121 266C123 266 124 267 125 268Z" },
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
  const uid = useId().replace(/:/g, "");
  const glowId = `${uid}-glow`;

  return (
    <div className="relative">
      <svg
        viewBox="0 0 200 300"
        className="block h-auto w-full select-none"
        role="img"
        aria-label={label}
      >
        <defs>
          <filter id={glowId} x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="0.85" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse cx="100" cy="292" rx="48" ry="5.5" className="fill-well/60" />

        <path
          d={BODY_OUTLINE}
          className="fill-muscle/75 stroke-border"
          strokeWidth="1.5"
        />

        <ellipse cx="100" cy="23" rx="13.5" ry="15.5" className="fill-skin" />
        {view === "front" ? (
          <>
            <path
              d="M88 13c1.6-8 22.4-8 24 0 1.2 2.6 0 5.8-2.2 6.6-6.4 1.6-15 1.6-21.6 0-2.2-.8-3.8-4-2.2-6.6z"
              className="fill-fg/95"
            />
            <path
              d="M92.5 7c1.8-3.5 5-5 7.5-1.5M100 6c2-4.5 5.5-5.5 8.5-1.5M109 8.5c1.4-3 4-4 6-1"
              className="fill-none stroke-fg"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="93.5" cy="25" r="2" className="fill-fg/90" />
            <circle cx="106.5" cy="25" r="2" className="fill-fg/90" />
            <circle cx="94.1" cy="24.4" r="0.55" className="fill-bg" />
            <circle cx="107.1" cy="24.4" r="0.55" className="fill-bg" />
            <path
              d="M94.5 34c2.6 2.8 8 2.8 10.8 0"
              className="fill-none stroke-fg/80"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </>
        ) : (
          <path
            d="M86 11c3.2-8 24.8-8 28 0 1.6 6.5-1 14.5-6.5 17.5-4.5 2.5-12 2.5-16.5 0-5.5-3-8.5-11-5-17.5z"
            className="fill-fg/95"
          />
        )}
        <path
          d="M93 38c1.6 7 4.6 10.5 7 10.5s5.4-3.5 7-10.5c-3.4 1.6-10.6 1.6-14 0z"
          className="fill-skin"
        />

        <path
          d="M44 144c-2 8.5 0 19.5 4 25 3.2 4 10 3 11.5-1.5.8-7-1-15-3.5-21.5-1.6-4.2-7.5-6.5-12-2z"
          className="fill-skin/90"
        />
        <path
          d="M156 144c2 8.5 0 19.5-4 25-3.2 4-10 3-11.5-1.5-.8-7 1-15 3.5-21.5 1.6-4.2 7.5-6.5 12-2z"
          className="fill-skin/90"
        />
        <ellipse cx="48" cy="172" rx="7.5" ry="5.8" className="fill-skin" />
        <ellipse cx="152" cy="172" rx="7.5" ry="5.8" className="fill-skin" />
        <path
          d="M82 280c-.7 3.2 2.4 8.2 9.5 7.2h4c3.2 0 6-3 5.2-6.2-1.6-4-8.5-5-13.7-3z"
          className="fill-skin"
        />
        <path
          d="M118 280c.7 3.2-2.4 8.2-9.5 7.2h-4c-3.2 0-6-3-5.2-6.2 1.6-4 8.5-5 13.7-3z"
          className="fill-skin"
        />

        {paths.map((p, i) => {
          const on = lit(hits, selected, p.id);
          const sel = selected === p.id;
          return (
            <path
              key={`${p.id}-${i}`}
              d={p.d}
              className={cn(
                "muscle-plate transition-[fill,filter,stroke] duration-200",
                on ? "muscle-plate-hit" : "fill-muscle",
                sel && "muscle-plate-selected",
                interactive && "cursor-pointer",
              )}
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

        {/* Inner neon rim on hit plates — keeps borders readable when neighbors glow */}
        {paths.map((p, i) => {
          if (!lit(hits, selected, p.id)) return null;
          return (
            <path
              key={`rim-${p.id}-${i}`}
              d={p.d}
              className="pointer-events-none fill-none stroke-candy-2/70"
              strokeWidth="1.15"
              strokeLinejoin="round"
            />
          );
        })}

        {view === "front" ? (
          <path
            d="M100 128v46M86 140h28M86 154h28M86 168h28"
            className="pointer-events-none fill-none stroke-bg/55"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M100 84v74M84 110c12 8 20 8 32 0M82 140c14 10 22 10 36 0"
            className="pointer-events-none fill-none stroke-bg/55"
            strokeWidth="1.4"
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

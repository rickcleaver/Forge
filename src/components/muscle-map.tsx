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
const FRONT_PATHS: PathSpec[] = [
  { id: "shoulders", d: "M 56.0 106.0 C 52.3 105.7 46.7 110.3 44.0 114.0 C 41.3 117.7 39.3 124.0 40.0 128.0 C 40.7 132.0 44.7 137.7 48.0 138.0 C 51.3 138.3 57.0 133.7 60.0 130.0 C 63.0 126.3 66.7 120.0 66.0 116.0 C 65.3 112.0 59.7 106.3 56.0 106.0 Z" },
  { id: "shoulders", d: "M 144.0 106.0 C 147.7 105.7 153.3 110.3 156.0 114.0 C 158.7 117.7 160.7 124.0 160.0 128.0 C 159.3 132.0 155.3 137.7 152.0 138.0 C 148.7 138.3 143.0 133.7 140.0 130.0 C 137.0 126.3 133.3 120.0 134.0 116.0 C 134.7 112.0 140.3 106.3 144.0 106.0 Z" },
  { id: "biceps", d: "M 42.0 146.0 C 44.5 144.7 51.0 139.5 52.5 142.5 C 54.0 145.5 53.5 160.5 52.5 166.0 C 51.5 171.0 47.5 174.5 45.0 173.5 C 42.5 172.5 39.0 164.0 38.0 160.0 C 37.0 156.0 37.5 152.5 38.0 150.0 C 38.5 147.5 39.5 147.0 42.0 146.0 Z" },
  { id: "biceps", d: "M 158.0 146.0 C 155.5 144.7 149.0 139.5 147.5 142.5 C 146.0 145.5 146.5 160.5 147.5 166.0 C 148.5 171.0 152.5 174.5 155.0 173.5 C 157.5 172.5 161.0 164.0 162.0 160.0 C 163.0 156.0 162.5 152.5 162.0 150.0 C 161.5 147.5 160.5 147.0 158.0 146.0 Z" },
  { id: "quads", d: "M 74.0 212.0 C 77.7 210.3 90.2 211.0 93.0 218.0 C 95.8 225.0 93.0 245.0 91.0 254.0 C 89.0 263.0 84.2 272.0 81.0 272.0 C 77.8 272.0 73.7 261.3 72.0 254.0 C 70.3 246.7 70.7 235.0 71.0 228.0 C 71.3 221.0 70.3 213.7 74.0 212.0 Z" },
  { id: "quads", d: "M 126.0 212.0 C 122.3 210.3 109.8 211.0 107.0 218.0 C 104.2 225.0 107.0 245.0 109.0 254.0 C 111.0 263.0 115.8 272.0 119.0 272.0 C 122.2 272.0 126.3 261.3 128.0 254.0 C 129.7 246.7 129.3 235.0 129.0 228.0 C 128.7 221.0 129.7 213.7 126.0 212.0 Z" },
  { id: "chest", d: "M92 116 C82 108 74 112 72 128 C70 142 74 156 84 162 C92 166 97 156 97 140 C97 126 96 118 92 116 Z" },
  { id: "chest", d: "M 108.0 116.0 C 118.0 108.0 126.0 112.0 128.0 128.0 C 130.0 142.0 126.0 156.0 116.0 162.0 C 108.0 166.0 103.0 156.0 103.0 140.0 C 103.0 126.0 104.0 118.0 108.0 116.0 Z" },
  { id: "calves", d: "M70 296 C78 290 82 304 76 326 C72 330 66 320 64 308 C62 298 66 296 70 296 Z" },
  { id: "calves", d: "M 130.0 296.0 C 122.0 290.0 118.0 304.0 124.0 326.0 C 128.0 330.0 134.0 320.0 136.0 308.0 C 138.0 298.0 134.0 296.0 130.0 296.0 Z" },
  { id: "core", d: "M 87.6 130.0 H 93.4 Q 97.0 130.0 97.0 133.6 V 141.4 Q 97.0 145.0 93.4 145.0 H 87.6 Q 84.0 145.0 84.0 141.4 V 133.6 Q 84.0 130.0 87.6 130.0 Z" },
  { id: "core", d: "M 107.6 130.0 H 113.4 Q 117.0 130.0 117.0 133.6 V 141.4 Q 117.0 145.0 113.4 145.0 H 107.6 Q 104.0 145.0 104.0 141.4 V 133.6 Q 104.0 130.0 107.6 130.0 Z" },
  { id: "core", d: "M 88.6 151.0 H 93.4 Q 97.0 151.0 97.0 154.6 V 161.4 Q 97.0 165.0 93.4 165.0 H 88.6 Q 85.0 165.0 85.0 161.4 V 154.6 Q 85.0 151.0 88.6 151.0 Z" },
  { id: "core", d: "M 106.6 151.0 H 111.4 Q 115.0 151.0 115.0 154.6 V 161.4 Q 115.0 165.0 111.4 165.0 H 106.6 Q 103.0 165.0 103.0 161.4 V 154.6 Q 103.0 151.0 106.6 151.0 Z" },
  { id: "core", d: "M 89.6 171.0 H 93.4 Q 97.0 171.0 97.0 174.6 V 179.4 Q 97.0 183.0 93.4 183.0 H 89.6 Q 86.0 183.0 86.0 179.4 V 174.6 Q 86.0 171.0 89.6 171.0 Z" },
  { id: "core", d: "M 106.6 171.0 H 110.4 Q 114.0 171.0 114.0 174.6 V 179.4 Q 114.0 183.0 110.4 183.0 H 106.6 Q 103.0 183.0 103.0 179.4 V 174.6 Q 103.0 171.0 106.6 171.0 Z" },
];
const BACK_PATHS: PathSpec[] = [
  { id: "back", d: "M100 98 C88 100 76 108 72 118 C82 128 94 130 100 124 C106 130 118 128 128 118 C124 108 112 100 100 98 Z" },
  { id: "back", d: "M95 124 C82 114 70 118 66 134 C64 150 70 164 82 172 C90 176 96 168 97 156 C98 142 98 130 95 124 Z" },
  { id: "back", d: "M 105.0 124.0 C 118.0 114.0 130.0 118.0 134.0 134.0 C 136.0 150.0 130.0 164.0 118.0 172.0 C 110.0 176.0 104.0 168.0 103.0 156.0 C 102.0 142.0 102.0 130.0 105.0 124.0 Z" },
  { id: "shoulders", d: "M 58.0 114.0 C 55.0 112.3 47.3 116.7 44.0 120.0 C 40.7 123.3 37.0 130.3 38.0 134.0 C 39.0 137.7 46.0 142.7 50.0 142.0 C 54.0 141.3 60.7 134.7 62.0 130.0 C 63.3 125.3 61.0 115.7 58.0 114.0 Z" },
  { id: "shoulders", d: "M 142.0 114.0 C 145.0 112.3 152.7 116.7 156.0 120.0 C 159.3 123.3 163.0 130.3 162.0 134.0 C 161.0 137.7 154.0 142.7 150.0 142.0 C 146.0 141.3 139.3 134.7 138.0 130.0 C 136.7 125.3 139.0 115.7 142.0 114.0 Z" },
  { id: "glutes", d: "M 76.0 198.0 C 79.3 194.3 88.5 190.0 92.0 192.0 C 95.5 194.0 97.0 204.3 97.0 210.0 C 97.0 215.7 95.2 223.0 92.0 226.0 C 88.8 229.0 81.3 230.0 78.0 228.0 C 74.7 226.0 72.3 219.0 72.0 214.0 C 71.7 209.0 72.7 201.7 76.0 198.0 Z" },
  { id: "glutes", d: "M 124.0 198.0 C 120.7 194.3 111.5 190.0 108.0 192.0 C 104.5 194.0 103.0 204.3 103.0 210.0 C 103.0 215.7 104.8 223.0 108.0 226.0 C 111.2 229.0 118.7 230.0 122.0 228.0 C 125.3 226.0 127.7 219.0 128.0 214.0 C 128.3 209.0 127.3 201.7 124.0 198.0 Z" },
  { id: "hamstrings", d: "M 74.0 236.0 C 76.0 231.0 82.7 227.0 84.0 232.0 C 85.3 237.0 84.0 261.0 82.0 266.0 C 80.0 271.0 73.3 267.0 72.0 262.0 C 70.7 257.0 72.0 241.0 74.0 236.0 Z" },
  { id: "hamstrings", d: "M 126.0 236.0 C 124.0 231.0 117.3 227.0 116.0 232.0 C 114.7 237.0 116.0 261.0 118.0 266.0 C 120.0 271.0 126.7 267.0 128.0 262.0 C 129.3 257.0 128.0 241.0 126.0 236.0 Z" },
  { id: "hamstrings", d: "M 88.0 238.0 C 89.7 233.7 95.2 231.3 96.0 236.0 C 96.8 240.7 94.7 261.7 93.0 266.0 C 91.3 270.3 86.8 266.7 86.0 262.0 C 85.2 257.3 86.3 242.3 88.0 238.0 Z" },
  { id: "hamstrings", d: "M 112.0 238.0 C 110.3 233.7 104.8 231.3 104.0 236.0 C 103.2 240.7 105.3 261.7 107.0 266.0 C 108.7 270.3 113.2 266.7 114.0 262.0 C 114.8 257.3 113.7 242.3 112.0 238.0 Z" },
  { id: "triceps", d: "M46 152 C51.5 148.5 54 158 53 170 C52 182 50.5 189 46 191 C41 193 39 182 40 168 C41 156 42 150.5 46 152 Z" },
  { id: "triceps", d: "M 154.0 152.0 C 148.5 148.5 146.0 158.0 147.0 170.0 C 148.0 182.0 149.5 189.0 154.0 191.0 C 159.0 193.0 161.0 182.0 160.0 168.0 C 159.0 156.0 158.0 150.5 154.0 152.0 Z" },
  { id: "calves", d: "M78 296 C70 294 66 306 68 316 C70 328 74 334 78 326 C80 318 76 316 78 308 C80 300 84 298 86 306 C88 296 84 290 78 296 Z" },
  { id: "calves", d: "M 122.0 296.0 C 130.0 294.0 134.0 306.0 132.0 316.0 C 130.0 328.0 126.0 334.0 122.0 326.0 C 120.0 318.0 124.0 316.0 122.0 308.0 C 120.0 300.0 116.0 298.0 114.0 306.0 C 112.0 296.0 116.0 290.0 122.0 296.0 Z" },
];

function uniqueRegionIds(paths: PathSpec[]): MuscleId[] {
  const ids: MuscleId[] = [];
  for (const p of paths) if (!ids.includes(p.id)) ids.push(p.id);
  return ids;
}

export const FRONT_REGION_IDS: MuscleId[] = uniqueRegionIds(FRONT_PATHS);
export const BACK_REGION_IDS: MuscleId[] = uniqueRegionIds(BACK_PATHS);

/**
 * One connected athletic silhouette (head, neck, V-taper, arms, hands, legs, feet).
 * Muscle paths are shapes inside this outline — never the limb itself.
 */
const BODY =
  "M 100.0 15.0 C 96.0 15.0 91.7 14.5 88.0 17.0 C 84.3 19.5 80.3 25.2 78.0 30.0 C 75.7 34.8 75.5 42.7 74.0 46.0 C 73.0 48.2 69.5 48.8 69.0 50.0 C 68.8 50.5 68.7 56.4 69.0 57.0 C 69.4 57.7 74.1 61.2 75.0 62.0 C 76.8 63.6 82.4 67.8 84.0 70.0 C 86.2 73.0 87.7 76.0 88.0 80.0 C 88.3 84.0 88.7 90.7 86.0 94.0 C 83.3 97.3 77.0 97.7 72.0 100.0 C 67.0 102.3 60.7 105.0 56.0 108.0 C 51.3 111.0 47.0 113.0 44.5 117.0 C 42.0 121.0 42.0 128.0 41.5 134.0 C 41.0 140.0 40.5 147.0 40.5 154.0 C 40.5 161.0 41.5 168.0 42.0 174.0 C 42.5 180.0 43.5 185.0 43.0 190.0 C 42.5 195.0 41.0 199.0 40.5 203.0 C 39.5 206.0 38.5 209.5 39.0 213.0 C 39.5 216.5 40.5 220.0 41.5 223.0 C 42.0 224.5 41.5 227.0 42.5 228.5 C 43.5 230.0 45.5 231.0 47.0 230.5 C 48.0 230.2 48.5 228.5 49.0 227.0 C 49.5 228.5 50.5 230.5 52.0 230.5 C 53.5 230.5 55.0 228.5 55.5 226.5 C 56.0 228.0 57.5 230.0 59.0 229.5 C 60.5 229.0 61.5 226.5 61.5 224.0 C 61.5 221.0 60.5 218.0 59.5 215.0 C 58.5 212.0 57.5 209.0 57.0 206.0 C 56.5 203.5 57.5 201.5 56.0 199.5 C 54.5 197.5 52.5 196.5 51.5 194.0 C 50.5 191.5 51.0 187.0 51.5 182.0 C 52.0 177.0 52.5 171.0 53.0 165.0 C 53.5 159.0 54.0 153.0 54.5 147.0 C 55.0 141.0 55.5 135.0 56.5 130.0 C 57.5 125.0 59.0 121.0 61.0 118.0 C 62.5 115.5 66.5 112.5 68.0 112.5 C 69.5 112.5 70.5 121.0 70.5 125.0 C 70.5 130.0 67.5 135.0 68.0 140.0 C 68.5 145.0 72.0 151.0 74.0 156.0 C 76.0 161.0 80.5 164.0 81.0 168.0 C 81.5 172.0 78.0 177.0 76.0 182.0 C 74.0 187.0 71.5 191.0 70.5 196.0 C 69.5 201.0 70.0 209.0 69.5 216.0 C 69.0 223.0 68.5 229.0 68.5 236.0 C 68.5 243.0 69.0 250.0 69.5 256.0 C 70.0 262.0 71.5 268.0 71.0 274.0 C 70.5 280.0 67.5 286.0 66.0 292.0 C 64.5 298.0 61.0 304.0 62.0 310.0 C 63.0 316.0 71.3 323.3 72.0 328.0 C 72.7 332.7 66.7 334.7 66.0 338.0 C 65.3 341.3 65.7 345.3 68.0 348.0 C 70.3 350.7 76.0 353.7 80.0 354.0 C 84.0 354.3 89.7 352.3 92.0 350.0 C 94.3 347.7 94.7 343.3 94.0 340.0 C 93.3 336.7 89.7 332.7 88.0 330.0 C 86.3 327.3 84.0 327.0 84.0 324.0 C 84.0 321.0 86.8 317.0 88.0 312.0 C 89.2 307.0 90.2 300.0 91.0 294.0 C 91.8 288.0 92.5 282.0 93.0 276.0 C 93.5 270.0 93.7 264.3 94.0 258.0 C 94.3 251.7 94.7 244.7 95.0 238.0 C 95.3 231.3 95.5 223.7 96.0 218.0 C 96.3 214.3 97.6 206.2 98.0 204.0 C 98.2 203.1 99.8 198.0 100.0 198.0 C 100.2 198.0 101.8 203.1 102.0 204.0 C 102.4 206.2 103.7 214.3 104.0 218.0 C 104.5 223.7 104.7 231.3 105.0 238.0 C 105.3 244.7 105.7 251.7 106.0 258.0 C 106.3 264.3 106.5 270.0 107.0 276.0 C 107.5 282.0 108.2 288.0 109.0 294.0 C 109.8 300.0 110.8 307.0 112.0 312.0 C 113.2 317.0 116.0 321.0 116.0 324.0 C 116.0 327.0 113.7 327.3 112.0 330.0 C 110.3 332.7 106.7 336.7 106.0 340.0 C 105.3 343.3 105.7 347.7 108.0 350.0 C 110.3 352.3 116.0 354.3 120.0 354.0 C 124.0 353.7 129.7 350.7 132.0 348.0 C 134.3 345.3 134.7 341.3 134.0 338.0 C 133.3 334.7 127.3 332.7 128.0 328.0 C 128.7 323.3 137.0 316.0 138.0 310.0 C 139.0 304.0 135.5 298.0 134.0 292.0 C 132.5 286.0 129.5 280.0 129.0 274.0 C 128.5 268.0 130.5 262.0 131.0 256.0 C 131.5 250.0 132.0 243.0 132.0 236.0 C 132.0 229.0 131.5 223.0 131.0 216.0 C 130.5 209.0 131.0 201.0 130.0 196.0 C 129.0 191.0 126.5 187.0 124.5 182.0 C 122.5 177.0 119.0 172.0 119.5 168.0 C 120.0 164.0 124.5 161.0 126.5 156.0 C 128.5 151.0 132.0 145.0 132.5 140.0 C 133.0 135.0 130.0 130.0 130.0 125.0 C 130.0 121.0 131.0 112.5 132.5 112.5 C 134.0 112.5 138.0 115.5 139.5 118.0 C 141.5 121.0 143.0 125.0 144.0 130.0 C 145.0 135.0 145.5 141.0 146.0 147.0 C 146.5 153.0 147.0 159.0 147.5 165.0 C 148.0 171.0 148.5 177.0 149.0 182.0 C 149.5 187.0 150.0 191.5 149.0 194.0 C 148.0 196.5 146.0 197.5 144.5 199.5 C 143.0 201.5 144.0 203.5 143.5 206.0 C 143.0 209.0 142.0 212.0 141.0 215.0 C 140.0 218.0 139.0 221.0 139.0 224.0 C 139.0 226.5 140.0 229.0 141.5 229.5 C 143.0 230.0 144.5 228.0 145.0 226.5 C 145.5 228.5 147.0 230.5 148.5 230.5 C 150.0 230.5 151.0 228.5 151.5 227.0 C 152.0 228.5 152.5 230.2 153.5 230.5 C 155.0 231.0 157.0 230.0 158.0 228.5 C 159.0 227.0 158.5 224.5 159.0 223.0 C 160.0 220.0 161.0 216.5 161.5 213.0 C 162.0 209.5 161.0 206.0 160.0 203.0 C 159.5 199.0 158.0 195.0 157.5 190.0 C 157.0 185.0 158.0 180.0 158.5 174.0 C 159.0 168.0 160.0 161.0 160.0 154.0 C 160.0 147.0 159.5 140.0 159.0 134.0 C 158.5 128.0 158.5 121.0 156.0 117.0 C 153.5 113.0 149.2 111.0 144.5 108.0 C 139.8 105.0 133.5 102.3 128.5 100.0 C 123.5 97.7 117.2 97.3 114.5 94.0 C 111.8 90.7 112.2 84.0 112.5 80.0 C 112.8 76.0 114.3 73.0 116.5 70.0 C 118.1 67.8 123.7 63.6 125.5 62.0 C 126.4 61.2 131.1 57.7 131.5 57.0 C 131.8 56.4 131.7 50.5 131.5 50.0 C 130.9 48.8 127.5 48.2 126.5 46.0 C 125.0 42.7 124.8 34.8 122.5 30.0 C 120.2 25.2 116.2 19.5 112.5 17.0 C 108.8 14.5 104.5 15.0 100.5 15.0 Z";

const THUMB_L =
  "M50 200 C57 195 64 204 61 213 C58 220 51 217 49 210 C48 205 48.5 201 50 200 Z";
const THUMB_R =
  "M150 200 C143 195 136 204 139 213 C142 220 149 217 151 210 C152 205 151.5 201 150 200 Z";

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
  const hitId = `${uid}-hit`;
  const clipId = `${uid}-clip`;
  const primary = new Set<MuscleId>();

  return (
    <div className="relative">
      <svg
        viewBox="18 6 164 360"
        className="block h-auto w-full select-none"
        role="img"
        aria-label={label}
      >
        <defs>
          <linearGradient id={hitId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-candy-2)" />
            <stop offset="42%" stopColor="var(--color-muscle-hit)" />
            <stop offset="100%" stopColor="var(--color-candy-3)" />
          </linearGradient>
          <filter id={glowId} x="-45%" y="-45%" width="190%" height="190%">
            <feGaussianBlur stdDeviation="1.15" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id={clipId}>
            <path d={BODY} />
          </clipPath>
        </defs>

        <ellipse cx="100" cy="358" rx="40" ry="4.5" className="fill-bg/55" />

        <path d={BODY} className="fill-skin" />
        <path
          d="M88 76 C91 94 109 94 112 76 C107 84 93 84 88 76 Z"
          className="pointer-events-none fill-skin-deep/35"
        />

        <g clipPath={`url(#${clipId})`}>
          {paths.map((p, i) => {
            const on = lit(hits, selected, p.id);
            const sel = selected === p.id;
            const first = !primary.has(p.id);
            if (first) primary.add(p.id);
            return (
              <path
                key={`${p.id}-${i}`}
                d={p.d}
                className={cn(
                  "muscle-plate transition-[fill,filter,stroke] duration-200",
                  on && "muscle-plate-hit",
                  sel && "muscle-plate-selected",
                  interactive && "cursor-pointer",
                )}
                strokeLinejoin="round"
                style={
                  on
                    ? { fill: `url(#${hitId})`, filter: `url(#${glowId})` }
                    : undefined
                }
                onClick={
                  interactive
                    ? (e) => {
                        e.stopPropagation();
                        onSelect?.(p.id);
                      }
                    : undefined
                }
                role={interactive && first ? "button" : undefined}
                tabIndex={interactive && first ? 0 : undefined}
                aria-label={interactive && first ? p.id : undefined}
                aria-pressed={interactive && first ? selected === p.id : undefined}
                onKeyDown={
                  interactive && first
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
        </g>

        <path
          d={BODY}
          className="pointer-events-none fill-none stroke-skin-deep"
          strokeWidth="2.15"
          strokeLinejoin="round"
        />

        <path d={THUMB_L} className="pointer-events-none fill-skin" />
        <path d={THUMB_R} className="pointer-events-none fill-skin" />
        <path
          d="M50 200 C57 195 64 204 61 213 C58 220 51 217"
          className="pointer-events-none fill-none stroke-skin-deep"
          strokeWidth="2.15"
          strokeLinecap="round"
        />
        <path
          d="M150 200 C143 195 136 204 139 213 C142 220 149 217"
          className="pointer-events-none fill-none stroke-skin-deep"
          strokeWidth="2.15"
          strokeLinecap="round"
        />

        {view === "front" ? (
          <>
            <path
              d="M74 50 C72 30 82 14 100 12 C118 14 128 30 126 50 C122 42 116 54 110 56 C106 44 100 40 92 46 C86 52 80 48 74 50Z"
              className="pointer-events-none fill-[#241833]"
            />
            <path
              d="M86 22 C94 16 106 16 114 24"
              className="pointer-events-none fill-none stroke-candy-3"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.85"
            />
            <path
              d="M84 44 C88 40 94 41 96 46"
              className="pointer-events-none fill-none stroke-[#3a2418]"
              strokeWidth="2.1"
              strokeLinecap="round"
            />
            <path
              d="M106 46 C108 41 114 40 118 44"
              className="pointer-events-none fill-none stroke-[#3a2418]"
              strokeWidth="2.1"
              strokeLinecap="round"
            />
            <ellipse cx="90" cy="52" rx="4.6" ry="5" className="pointer-events-none fill-[#fffaf6]" />
            <ellipse cx="112" cy="52" rx="4.6" ry="5" className="pointer-events-none fill-[#fffaf6]" />
            <ellipse cx="91.1" cy="52.4" rx="2.5" ry="2.9" className="pointer-events-none fill-[#1a1420]" />
            <ellipse cx="113.1" cy="52.4" rx="2.5" ry="2.9" className="pointer-events-none fill-[#1a1420]" />
            <circle cx="92.2" cy="51.2" r="0.9" className="pointer-events-none fill-white" />
            <circle cx="114.2" cy="51.2" r="0.9" className="pointer-events-none fill-white" />
            <path
              d="M98 60 c1.2 2 3.2 2 4.2 0"
              className="pointer-events-none fill-none stroke-skin-deep"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path
              d="M92 66 C98 72 108 72 114 66"
              className="pointer-events-none fill-none stroke-[#a8643e]"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M78 108 C88 114 96 114 100 110 C104 114 112 114 122 108"
              className="pointer-events-none fill-none stroke-skin-deep/80"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            <path
              d="M72 52 C70 32 80 14 100 12 C120 14 130 32 128 52 C126 44 120 40 114 46 C118 58 116 72 108 80 C100 86 92 80 86 72 C82 58 80 48 86 42 C78 40 74 46 72 52Z"
              className="pointer-events-none fill-[#241833]"
            />
            <path
              d="M88 24 C96 16 110 18 116 28"
              className="pointer-events-none fill-none stroke-candy-3"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d="M100 124 V166"
              className="pointer-events-none fill-none stroke-skin-deep/55"
              strokeWidth="1.35"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
    </div>
  );
}

export function MuscleMap({ hits = {}, selected = null, onSelect, className, compact }: Props) {
  const pair = (
    <div
      className={cn(
        "grid grid-cols-2 items-end overflow-hidden rounded-2xl bg-surface-2/90",
        compact ? "gap-1.5 px-1.5 py-1.5" : "gap-3 px-3 pt-3 pb-2",
      )}
    >
      <Plate view="front" label="Front muscles" hits={hits} selected={selected} onSelect={onSelect} />
      <Plate view="back" label="Back muscles" hits={hits} selected={selected} onSelect={onSelect} />
    </div>
  );

  if (compact) {
    return <div className={cn("w-[8.5rem] max-w-full shrink-0", className)}>{pair}</div>;
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

export const MUSCLE_IDS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "core",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "cardio",
] as const;

export type MuscleId = (typeof MUSCLE_IDS)[number];

export type MuscleMeta = {
  id: MuscleId;
  label: string;
  short: string;
  group: "upper" | "core" | "lower" | "full";
  views: Array<"front" | "back">;
};

export const MUSCLES: MuscleMeta[] = [
  { id: "chest", label: "Chest", short: "CHST", group: "upper", views: ["front"] },
  { id: "back", label: "Back", short: "BACK", group: "upper", views: ["back"] },
  { id: "shoulders", label: "Shoulders", short: "DLTS", group: "upper", views: ["front", "back"] },
  { id: "biceps", label: "Biceps", short: "BICP", group: "upper", views: ["front"] },
  { id: "triceps", label: "Triceps", short: "TRCP", group: "upper", views: ["back"] },
  { id: "core", label: "Core", short: "CORE", group: "core", views: ["front"] },
  { id: "quads", label: "Quads", short: "QUAD", group: "lower", views: ["front"] },
  { id: "hamstrings", label: "Hamstrings", short: "HAMS", group: "lower", views: ["back"] },
  { id: "glutes", label: "Glutes", short: "GLUT", group: "lower", views: ["back"] },
  { id: "calves", label: "Calves", short: "CLVS", group: "lower", views: ["front", "back"] },
  { id: "cardio", label: "Cardio", short: "CRDO", group: "full", views: [] },
];

export const MUSCLE_MAP: Record<MuscleId, MuscleMeta> = Object.fromEntries(
  MUSCLES.map((m) => [m.id, m]),
) as Record<MuscleId, MuscleMeta>;

export type WeightUnit = "lb" | "kg";

export type ThemeId = "steel" | "ember" | "ion";

export type ColorMode = "dark" | "light";

/** Self-reported effort level used to pick a MET multiplier for the
 * MyFitnessPal calorie estimate. Always presented as a rough guess, never
 * as a measured number. */
export type Intensity = "light" | "moderate" | "hard";

export type SetEntry = {
  id: string;
  reps: number | null;
  weight: number | null;
  completed: boolean;
  warmup?: boolean;
  durationMin?: number | null;
  distance?: number | null;
  rir?: number | null;
};

export type ExerciseLog = {
  id: string;
  libraryId: string | null;
  name: string;
  muscles: MuscleId[];
  notes: string;
  photos: string[];
  sets: SetEntry[];
  restSec?: number | null;
};

export type Session = {
  id: string;
  name: string;
  startedAt: number;
  liveAt?: number | null;
  finishedAt: number | null;
  notes: string;
  photo: string | null;
  exercises: ExerciseLog[];
  estimatedKcal?: number | null;
  /** Full lift list so 15/25/40/Full can switch both ways. */
  planExercises?: ExerciseLog[];
  targetMin?: number | null;
};

export type WeighIn = {
  id: string;
  at: number;
  lb: number;
};

export type StepLog = {
  id: string;
  at: number;
  steps: number;
};

export type ProgressPhoto = {
  id: string;
  at: number;
  src: string;
  note: string;
};

export type PhysiquePose = "front" | "back" | "left" | "right";

export type PhysiqueCheckin = {
  id: string;
  at: number;
  photos: Partial<Record<PhysiquePose, string>>;
  note: string;
  focus: string[];
  strong: string[];
  score: number | null;
  angles?: Partial<Record<string, string>>;
};

export type DayPlan = {
  rest: boolean;
  templateId: string | null;
  programId: string | null;
};

export type TrainGoal = "muscle" | "strength" | "fat" | "fitness" | "recomp";

export type ReadinessLog = {
  id: string;
  at: number;
  sleepHrs: number;
  energy: number;
  soreness: number;
  stress: number;
  score: number;
};

export type Settings = {
  unit: WeightUnit;
  defaultRestSec: number;
  autoStartRest: boolean;
  hapticRest: boolean;
  bodyWeightLb: number | null;
  heightCm: number | null;
  calorieGoal: number | null;
  proteinGoal: number | null;
  exerciseRest: Record<string, number>;
  defaultIntensity: Intensity;
  weekPlan: DayPlan[];
  theme: ThemeId;
  colorMode?: ColorMode;
  onboarded?: boolean;
  setupDone?: boolean;
  goal?: TrainGoal | null;
  trainDays?: number | null;
  place?: "home" | "gym" | "both" | null;
  morningGate?: boolean;
  voiceName?: string | null;
};

export type RestTimer = {
  running: boolean;
  duration: number;
  endsAt: number | null;
  completedAt: number | null;
};

export type ProgramExercise = {
  libraryId: string | null;
  name: string;
  muscles: MuscleId[];
  notes?: string;
  restSec?: number | null;
  sets: Array<{
    weight: number | null;
    reps: number | null;
    warmup?: boolean;
    durationMin?: number | null;
    distance?: number | null;
  }>;
};

export type Program = {
  id: string;
  name: string;
  exercises: ProgramExercise[];
  packId?: string | null;
  packName?: string | null;
  dayLabel?: string | null;
  source?: string | null;
};

export type GearId = "barbell" | "dumbbell" | "cable" | "machine" | "bodyweight" | "band" | "cardio";

export type LibraryExercise = {
  id: string;
  name: string;
  muscles: MuscleId[];
  gear: GearId;
  aliases?: string[];
};

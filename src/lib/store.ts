import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { LIBRARY, LIBRARY_MAP, TEMPLATES, resolveMuscles } from "./exercises";
import { idbStorage } from "./idb-storage";
import { estimateSessionKcal } from "./mfp";
import { applySessionLength, coachWorkoutPlan, nextPrescription, readinessScore } from "./coach-engine";
import type { QuickLog } from "./parse-quick-log";
import type {
  ExerciseLog,
  Intensity,
  MuscleId,
  PhysiqueCheckin,
  PhysiquePose,
  Program,
  ProgramExercise,
  Session,
  SetEntry,
  Settings,
  RestTimer,
  ReadinessLog,
  WeightUnit,
  WeighIn,
  StepLog,
  ProgressPhoto,
  DayPlan,
  TrainGoal,
  ThemeId,
  ColorMode,
} from "./types";
import { uid } from "./utils";
import type { ForgeBackup } from "./backup";

const REST_DEFAULT = 90;

const emptyWeek: DayPlan[] = Array.from({ length: 7 }, () => ({
  rest: false,
  templateId: null,
  programId: null,
}));

const defaultSettings: Settings = {
  unit: "lb",
  defaultRestSec: REST_DEFAULT,
  autoStartRest: true,
  hapticRest: true,
  bodyWeightLb: null,
  heightCm: null,
  calorieGoal: null,
  proteinGoal: null,
  exerciseRest: {},
  defaultIntensity: "moderate",
  weekPlan: emptyWeek,
  theme: "steel",
  colorMode: "dark",
  onboarded: false,
  setupDone: true,
  goal: null,
  morningGate: true,
  voiceName: null,
};

const idleTimer: RestTimer = {
  running: false,
  duration: REST_DEFAULT,
  endsAt: null,
  completedAt: null,
};

type GymState = {
  hydrated: boolean;
  sessions: Session[];
  weighIns: WeighIn[];
  stepLogs: StepLog[];
  progressPhotos: ProgressPhoto[];
  physiqueCheckins: PhysiqueCheckin[];
  programs: Program[];
  readinessLogs: ReadinessLog[];
  activeSessionId: string | null;
  settings: Settings;
  timer: RestTimer;
  lastBackupAt: number | null;
  sessionsAtLastBackup: number;
  setHydrated: (v: boolean) => void;
  startSession: (opts: { name?: string; templateId?: string; programId?: string }) => string;
  startCoachSession: () => string;
  goLive: (id: string) => void;
  trimActiveSession: (minutes: number) => void;
  repeatSession: (id: string) => string | null;
  importScannedSession: (input: {
    name: string;
    startedAt: number;
    photo: string | null;
    live: boolean;
    exercises: ExerciseLog[];
  }) => string;
  importHistorySessions: (incoming: Session[]) => { added: number };
  finishSession: (id: string) => void;
  discardSession: (id: string) => void;
  sweepStaleSetups: () => number;
  renameSession: (id: string, name: string) => void;
  setSessionNotes: (id: string, notes: string) => void;
  setSessionPhoto: (id: string, photo: string | null) => void;
  addExercise: (
    sessionId: string,
    input: {
      name: string;
      muscles: MuscleId[];
      libraryId?: string | null;
      photos?: string[];
    },
  ) => string;
  removeExercise: (sessionId: string, exerciseId: string) => void;
  patchExercise: (sessionId: string, exerciseId: string, patch: Partial<ExerciseLog>) => void;
  moveExercise: (sessionId: string, exerciseId: string, dir: -1 | 1) => void;
  addSet: (sessionId: string, exerciseId: string) => void;
  removeSet: (sessionId: string, exerciseId: string, setId: string) => void;
  patchSet: (
    sessionId: string,
    exerciseId: string,
    setId: string,
    patch: Partial<SetEntry>,
  ) => void;
  toggleSet: (sessionId: string, exerciseId: string, setId: string) => void;
  quickLogSet: (sessionId: string, exerciseId: string, log: QuickLog) => boolean;
  applyLiftRx: (sessionId: string, exerciseId: string, mode: "accept" | "keep" | "down") => void;
  addPhoto: (sessionId: string, exerciseId: string, dataUrl: string) => void;
  removePhoto: (sessionId: string, exerciseId: string, index: number) => void;
  startTimer: (seconds?: number) => void;
  stopTimer: () => void;
  skipTimer: () => void;
  adjustTimer: (deltaSec: number) => void;
  markTimerDone: () => void;
  setUnit: (unit: WeightUnit) => void;
  setDefaultRest: (sec: number) => void;
  setAutoStartRest: (v: boolean) => void;
  setHapticRest: (v: boolean) => void;
  setTheme: (theme: ThemeId) => void;
  setColorMode: (mode: ColorMode) => void;
  setMorningGate: (v: boolean) => void;
  setDayPlan: (day: number, plan: DayPlan) => void;
  slideWeekPlan: () => void;
  setOnboarding: (input: { goal: TrainGoal; trainDays: number; place: "home" | "gym" | "both" }) => void;
  setBodyWeightLb: (lb: number | null) => void;
  setHeightCm: (cm: number | null) => void;
  setCalorieGoal: (n: number | null) => void;
  setProteinGoal: (n: number | null) => void;
  setExerciseRest: (name: string, sec: number) => void;
  setDefaultIntensity: (intensity: Intensity) => void;
  markBackedUp: () => void;
  logWeighIn: (lb: number) => void;
  logSteps: (steps: number) => void;
  discardStepLog: (id: string) => void;
  logReadiness: (input: { sleepHrs: number; energy: number; soreness: number; stress: number }) => void;
  addProgressPhoto: (src: string, note?: string) => string | null;
  removeProgressPhoto: (id: string) => void;
  patchProgressPhoto: (id: string, note: string) => void;
  savePhysiqueCheckin: (input: {
    photos: Partial<Record<PhysiquePose, string>>;
    note: string;
    focus: string[];
    strong: string[];
    score: number | null;
    angles?: Partial<Record<string, string>>;
  }) => void;
  addWarmup: (sessionId: string, exerciseId: string) => void;
  toggleWarmup: (sessionId: string, exerciseId: string, setId: string) => void;
  addAccessoryForMuscle: (muscle: MuscleId) => void;
  saveProgram: (sessionId: string, name?: string) => string | null;
  deleteProgram: (id: string) => void;
  deleteProgramPack: (packId: string) => void;
  importProgramPack: (input: {
    name: string;
    source?: string;
    mapWeek?: boolean;
    days: Array<{ label: string; exercises: ProgramExercise[] }>;
  }) => string;
  importBackup: (backup: ForgeBackup) => { added: number };
};

function cloneExercises(exercises: ExerciseLog[]): ExerciseLog[] {
  return exercises.map((ex) => ({
    ...ex,
    muscles: [...ex.muscles],
    photos: [...(ex.photos ?? [])],
    sets: ex.sets.map((s) => ({ ...s })),
  }));
}

function emptySet(warmup = false): SetEntry {
  return {
    id: uid(),
    reps: null,
    weight: null,
    completed: false,
    warmup,
    durationMin: null,
    distance: null,
  };
}

function exerciseFromLibrary(libraryId: string, restMap: Record<string, number>): ExerciseLog {
  const lib = LIBRARY_MAP[libraryId];
  const name = lib?.name ?? "Exercise";
  return {
    id: uid(),
    libraryId,
    name,
    muscles: lib?.muscles ?? [],
    notes: "",
    photos: [],
    restSec: restMap[name.toLowerCase()] ?? null,
    sets: lib?.gear === "cardio" ? [emptySet()] : [emptySet(), emptySet(), emptySet()],
  };
}

function seedSessions(): Session[] {
  const now = Date.now();
  const day = 86_400_000;
  let n = 0;
  const mkSet = (weight: number, reps: number, warmup = false): SetEntry => ({
    id: `seed-set-${n++}`,
    weight,
    reps,
    completed: true,
    warmup,
  });
  const mkEx = (
    libraryId: string,
    sets: Array<[number, number] | [number, number, number]>,
    key: string,
  ): ExerciseLog => {
    const lib = LIBRARY_MAP[libraryId];
    return {
      id: `seed-ex-${key}`,
      libraryId,
      name: lib.name,
      muscles: [...lib.muscles],
      notes: "",
      photos: [],
      restSec: libraryId === "bench-press" ? 120 : libraryId === "back-squat" ? 150 : 90,
      sets: sets.map((row) => mkSet(row[0], row[1], row[2] === 1)),
    };
  };
  const push: Session = {
    id: "seed-push",
    name: "Push",
    startedAt: now - 2 * day - 3_600_000,
    finishedAt: now - 2 * day,
    notes: "",
    photo: null,
    exercises: [
      mkEx("bench-press", [
        [135, 10, 1],
        [185, 6],
        [185, 6],
        [175, 8],
      ], "bench"),
      mkEx("ohp", [
        [95, 8],
        [95, 8],
        [95, 7],
      ], "ohp"),
      mkEx("incline-db", [
        [50, 10],
        [50, 10],
        [50, 9],
      ], "incline"),
      mkEx("lateral-raise", [
        [20, 12],
        [20, 12],
        [20, 12],
      ], "lat"),
      mkEx("tricep-pushdown", [
        [50, 12],
        [50, 12],
        [45, 14],
      ], "pushdown"),
    ],
  };
  const legs: Session = {
    id: "seed-legs",
    name: "Legs",
    startedAt: now - day - 4_200_000,
    finishedAt: now - day,
    notes: "",
    photo: null,
    exercises: [
      mkEx("back-squat", [
        [135, 8],
        [185, 5],
        [185, 5],
        [185, 5],
      ], "squat"),
      mkEx("rdl", [
        [135, 8],
        [155, 8],
        [155, 8],
      ], "rdl"),
      mkEx("walking-lunge", [
        [40, 10],
        [40, 10],
        [40, 10],
      ], "lunge"),
      mkEx("hip-thrust", [
        [135, 10],
        [155, 8],
        [155, 8],
      ], "thrust"),
      mkEx("calf-raise", [
        [180, 15],
        [180, 15],
        [180, 12],
      ], "calf"),
    ],
  };
  return [legs, push];
}

function mutateSession(
  sessions: Session[],
  id: string,
  fn: (s: Session) => Session,
): Session[] {
  return sessions.map((s) => (s.id === id ? fn(s) : s));
}

function sessionHasWork(sess: Session): boolean {
  return sess.exercises.some((e) => e.sets.some((st) => st.completed));
}

function parkOpenSession(sessions: Session[], activeId: string | null, keepId?: string): Session[] {
  if (!activeId || activeId === keepId) return sessions;
  return sessions.flatMap((sess) => {
    if (sess.id !== activeId || sess.finishedAt) return [sess];
    if (!sessionHasWork(sess) && sess.liveAt == null) return [];
    return [{ ...sess, finishedAt: Date.now() }];
  });
}

export const useGym = create<GymState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      sessions: seedSessions(),
      weighIns: [],
      stepLogs: [],
      progressPhotos: [],
      physiqueCheckins: [],
      programs: [],
      readinessLogs: [],
      activeSessionId: null,
      settings: defaultSettings,
      timer: idleTimer,
      lastBackupAt: null,
      sessionsAtLastBackup: 0,
      setHydrated: (v) => set({ hydrated: v }),
      startSession: ({ name, templateId, programId }) => {
        const program = get().programs.find((p) => p.id === programId);
        const tpl = TEMPLATES.find((t) => t.id === templateId);
        const id = uid();
        const restMap = get().settings.exerciseRest;
        const fromProgram = program
          ? program.exercises.map((ex) => ({
              id: uid(),
              libraryId: ex.libraryId,
              name: ex.name,
              muscles: [...ex.muscles],
              notes: ex.notes ?? "",
              photos: [],
              restSec: ex.restSec ?? restMap[ex.name.toLowerCase()] ?? null,
              sets: (ex.sets.length ? ex.sets : [{ weight: null, reps: null }]).map((s) => ({
                ...emptySet(Boolean(s.warmup)),
                weight: s.weight,
                reps: s.reps,
                durationMin: s.durationMin ?? null,
                distance: s.distance ?? null,
              })),
            }))
          : (tpl?.exerciseIds ?? []).map((libId) => exerciseFromLibrary(libId, restMap));
        const session: Session = {
          id,
          name: name?.trim() || program?.name || tpl?.name || "Session",
          startedAt: Date.now(),
          liveAt: null,
          finishedAt: null,
          notes: "",
          photo: null,
          exercises: fromProgram,
          planExercises: cloneExercises(fromProgram),
          targetMin: 90,
        };
        set((s) => ({
          sessions: [session, ...parkOpenSession(s.sessions, s.activeSessionId)],
          activeSessionId: id,
        }));
        return id;
      },
      startCoachSession: () => {
        const plan = coachWorkoutPlan(get().sessions, get().readinessLogs, get().settings);
        const restMap = get().settings.exerciseRest;
        const id = uid();
        const exercises = plan.exerciseIds.map((libId) => {
          const ex = exerciseFromLibrary(libId, restMap);
          const working = Array.from({ length: plan.sets }, () => emptySet());
          const rx = nextPrescription(get().sessions, ex);
          for (const set of working) {
            set.weight = rx?.weight ?? null;
            set.reps = rx?.reps ?? 8;
          }
          return { ...ex, notes: plan.why, sets: working };
        });
        const session: Session = {
          id,
          name: plan.name,
          startedAt: Date.now(),
          liveAt: null,
          finishedAt: null,
          notes: plan.why,
          photo: null,
          exercises,
          planExercises: cloneExercises(exercises),
          targetMin: 90,
        };
        set((s) => ({
          sessions: [session, ...parkOpenSession(s.sessions, s.activeSessionId)],
          activeSessionId: id,
        }));
        return id;
      },
      repeatSession: (id) => {
        const src = get().sessions.find((s) => s.id === id);
        if (!src) return null;
        const restMap = get().settings.exerciseRest;
        const nextId = uid();
        const session: Session = {
          id: nextId,
          name: src.name,
          startedAt: Date.now(),
          liveAt: null,
          finishedAt: null,
          notes: "",
          photo: null,
          exercises: src.exercises.map((ex) => ({
            id: uid(),
            libraryId: ex.libraryId,
            name: ex.name,
            muscles: [...ex.muscles],
            notes: "",
            photos: [],
            restSec: ex.restSec ?? restMap[ex.name.toLowerCase()] ?? null,
            sets: ex.sets.map((s) => ({
              id: uid(),
              weight: s.weight,
              reps: s.reps,
              completed: false,
              warmup: Boolean(s.warmup),
            })),
          })),
        };
        session.planExercises = cloneExercises(session.exercises);
        session.targetMin = 90;
        set((s) => ({
          sessions: [session, ...parkOpenSession(s.sessions, s.activeSessionId)],
          activeSessionId: nextId,
        }));
        return nextId;
      },
      importScannedSession: ({ name, startedAt, photo, live, exercises }) => {
        const id = uid();
        const ended = live ? null : startedAt + Math.max(20, exercises.reduce((n, e) => n + e.sets.length, 0) * 2) * 60_000;
        const session: Session = {
          id,
          name: name.trim() || "Session",
          startedAt,
          liveAt: live ? Date.now() : startedAt,
          finishedAt: ended,
          notes: "Scanned from paper log",
          photo,
          exercises,
        };
        if (!live && ended) {
          session.estimatedKcal = estimateSessionKcal(
            session,
            ended,
            get().settings.bodyWeightLb,
            get().settings.defaultIntensity,
          );
        }
        set((s) => ({
          sessions: [session, ...parkOpenSession(s.sessions, live ? s.activeSessionId : null)],
          activeSessionId: live ? id : s.activeSessionId,
        }));
        return id;
      },
      importHistorySessions: (incoming) => {
        const existing = get().sessions;
        const keys = new Set(
          existing.map((s) => {
            const d = new Date(s.startedAt);
            return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}|${s.name.trim().toLowerCase()}`;
          }),
        );
        const added = incoming.filter((s) => {
          const d = new Date(s.startedAt);
          const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}|${s.name.trim().toLowerCase()}`;
          if (keys.has(key)) return false;
          keys.add(key);
          return Boolean(s.exercises?.length);
        });
        if (!added.length) return { added: 0 };
        set((s) => ({
          sessions: [...added, ...s.sessions].sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0)),
        }));
        return { added: added.length };
      },
      goLive: (id) =>
        set((s) => ({
          sessions: mutateSession(s.sessions, id, (sess) =>
            sess.liveAt ? sess : { ...sess, liveAt: Date.now() },
          ),
        })),
      trimActiveSession: (minutes) => {
        const id = get().activeSessionId;
        if (!id) return;
        const cap = minutes >= 90 ? 90 : minutes;
        set((s) => ({
          sessions: mutateSession(s.sessions, id, (sess) => {
            let blueprint =
              sess.planExercises && sess.planExercises.length > 0
                ? sess.planExercises
                : cloneExercises(sess.exercises);
            if (sess.name.startsWith("Forge ·")) {
              const plan = coachWorkoutPlan(s.sessions, s.readinessLogs, s.settings);
              const restMap = s.settings.exerciseRest;
              const have = new Set(
                blueprint.map((e) => e.libraryId || e.name.trim().toLowerCase()),
              );
              for (const libId of plan.exerciseIds) {
                if (have.has(libId)) continue;
                const fresh = exerciseFromLibrary(libId, restMap);
                const working = Array.from({ length: plan.sets }, () => emptySet());
                const rx = nextPrescription(s.sessions, fresh);
                for (const row of working) {
                  row.weight = rx?.weight ?? null;
                  row.reps = rx?.reps ?? 8;
                }
                blueprint = [...blueprint, { ...fresh, notes: plan.why, sets: working }];
                have.add(libId);
              }
            }
            const extras = sess.exercises.filter(
              (e) =>
                !blueprint.some(
                  (p) =>
                    p.id === e.id ||
                    (p.libraryId && p.libraryId === e.libraryId) ||
                    p.name.trim().toLowerCase() === e.name.trim().toLowerCase(),
                ),
            );
            const visible = applySessionLength(blueprint, sess.exercises, cap);
            return {
              ...sess,
              planExercises: blueprint,
              targetMin: cap,
              exercises: cap >= 90 ? [...visible, ...extras] : visible,
            };
          }),
        }));
      },
      finishSession: (id) =>
        set((s) => ({
          sessions: mutateSession(s.sessions, id, (sess) => {
            const ended = Date.now();
            return {
              ...sess,
              finishedAt: ended,
              estimatedKcal: estimateSessionKcal(
                sess,
                ended,
                s.settings.bodyWeightLb,
                s.settings.defaultIntensity,
              ),
            };
          }),
          activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
          timer: s.activeSessionId === id ? { ...idleTimer, duration: s.settings.defaultRestSec } : s.timer,
        })),
      discardSession: (id) =>
        set((s) => ({
          sessions: s.sessions.filter((sess) => sess.id !== id),
          activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
          timer: s.activeSessionId === id ? { ...idleTimer, duration: s.settings.defaultRestSec } : s.timer,
        })),
      sweepStaleSetups: () => {
        const now = Date.now();
        const stale = get().sessions.filter((sess) => {
          if (sess.finishedAt) return false;
          if (sess.liveAt != null) return false;
          if (now - sess.startedAt < 18 * 3600_000) return false;
          return !sess.exercises.some((ex) => ex.sets.some((st) => st.completed));
        });
        if (!stale.length) return 0;
        const ids = new Set(stale.map((s) => s.id));
        set((s) => ({
          sessions: s.sessions.filter((sess) => !ids.has(sess.id)),
          activeSessionId: s.activeSessionId && ids.has(s.activeSessionId) ? null : s.activeSessionId,
          timer:
            s.activeSessionId && ids.has(s.activeSessionId)
              ? { ...idleTimer, duration: s.settings.defaultRestSec }
              : s.timer,
        }));
        return stale.length;
      },
      renameSession: (id, name) =>
        set((s) => ({
          sessions: mutateSession(s.sessions, id, (sess) => ({ ...sess, name })),
        })),
      setSessionNotes: (id, notes) =>
        set((s) => ({
          sessions: mutateSession(s.sessions, id, (sess) => ({ ...sess, notes })),
        })),
      setSessionPhoto: (id, photo) =>
        set((s) => ({
          sessions: mutateSession(s.sessions, id, (sess) => ({ ...sess, photo })),
        })),
      addExercise: (sessionId, input) => {
        const exId = uid();
        const last = get()
          .sessions.filter((s) => s.id !== sessionId && s.finishedAt)
          .flatMap((s) => s.exercises)
          .find((e) => e.name.toLowerCase() === input.name.toLowerCase());
        const first = emptySet();
        const second = emptySet();
        const third = emptySet();
        const working = last?.sets.filter((x) => !x.warmup && x.completed) ?? [];
        const sample = [...working].reverse()[0];
        if (sample) {
          for (const row of [first, second, third]) {
            row.weight = sample.weight;
            row.reps = sample.reps;
            row.durationMin = sample.durationMin ?? null;
            row.distance = sample.distance ?? null;
          }
        }
        const muscles = resolveMuscles({
          name: input.name,
          muscles: input.muscles,
          libraryId: input.libraryId,
        });
        const cardio =
          (input.libraryId && LIBRARY_MAP[input.libraryId]?.gear === "cardio") ||
          (muscles.length === 1 && muscles[0] === "cardio");
        const rest =
          get().settings.exerciseRest[input.name.toLowerCase()] ?? last?.restSec ?? null;
        const ex: ExerciseLog = {
          id: exId,
          libraryId: input.libraryId ?? null,
          name: input.name,
          muscles,
          notes: "",
          photos: input.photos ?? [],
          restSec: rest,
          sets: cardio ? [first] : [first, second, third],
        };
        set((s) => ({
          sessions: mutateSession(s.sessions, sessionId, (sess) => ({
            ...sess,
            exercises: [...sess.exercises, ex],
          })),
        }));
        return exId;
      },
      removeExercise: (sessionId, exerciseId) =>
        set((s) => ({
          sessions: mutateSession(s.sessions, sessionId, (sess) => ({
            ...sess,
            exercises: sess.exercises.filter((e) => e.id !== exerciseId),
          })),
        })),
      patchExercise: (sessionId, exerciseId, patch) =>
        set((s) => ({
          sessions: mutateSession(s.sessions, sessionId, (sess) => ({
            ...sess,
            exercises: sess.exercises.map((e) =>
              e.id === exerciseId ? { ...e, ...patch } : e,
            ),
          })),
        })),
      moveExercise: (sessionId, exerciseId, dir) =>
        set((s) => ({
          sessions: mutateSession(s.sessions, sessionId, (sess) => {
            const i = sess.exercises.findIndex((e) => e.id === exerciseId);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= sess.exercises.length) return sess;
            const exercises = [...sess.exercises];
            const [row] = exercises.splice(i, 1);
            exercises.splice(j, 0, row);
            return { ...sess, exercises };
          }),
        })),
      addSet: (sessionId, exerciseId) =>
        set((s) => ({
          sessions: mutateSession(s.sessions, sessionId, (sess) => ({
            ...sess,
            exercises: sess.exercises.map((e) => {
              if (e.id !== exerciseId) return e;
              const prev = e.sets[e.sets.length - 1];
              const next = emptySet();
              if (prev) {
                next.weight = prev.weight;
                next.reps = prev.reps;
                next.durationMin = prev.durationMin ?? null;
                next.distance = prev.distance ?? null;
              }
              return { ...e, sets: [...e.sets, next] };
            }),
          })),
        })),
      removeSet: (sessionId, exerciseId, setId) =>
        set((s) => ({
          sessions: mutateSession(s.sessions, sessionId, (sess) => ({
            ...sess,
            exercises: sess.exercises.map((e) =>
              e.id === exerciseId
                ? { ...e, sets: e.sets.filter((x) => x.id !== setId) }
                : e,
            ),
          })),
        })),
      patchSet: (sessionId, exerciseId, setId, patch) =>
        set((s) => ({
          sessions: mutateSession(s.sessions, sessionId, (sess) => ({
            ...sess,
            exercises: sess.exercises.map((e) =>
              e.id === exerciseId
                ? {
                    ...e,
                    sets: e.sets.map((x) => (x.id === setId ? { ...x, ...patch } : x)),
                  }
                : e,
            ),
          })),
        })),
      toggleSet: (sessionId, exerciseId, setId) => {
        const { settings } = get();
        let becameComplete = false;
        let restSec = settings.defaultRestSec;
        set((s) => ({
          sessions: mutateSession(s.sessions, sessionId, (sess) => ({
            ...sess,
            exercises: sess.exercises.map((e) => {
              if (e.id !== exerciseId) return e;
              return {
                ...e,
                sets: e.sets.map((x) => {
                  if (x.id !== setId) return x;
                  const completed = !x.completed;
                  if (completed) {
                    becameComplete = true;
                    restSec = x.warmup
                      ? Math.min(45, settings.defaultRestSec)
                      : (e.restSec ?? settings.defaultRestSec);
                  }
                  return { ...x, completed };
                }),
              };
            }),
          })),
        }));
        if (becameComplete && settings.autoStartRest) {
          const sess = get().sessions.find((x) => x.id === sessionId);
          if (sess?.liveAt != null) get().startTimer(restSec);
        }
      },
      quickLogSet: (sessionId, exerciseId, log) => {
        const sess = get().sessions.find((s) => s.id === sessionId);
        const ex = sess?.exercises?.find((e) => e.id === exerciseId);
        if (!sess || !ex) return false;
        let target = ex.sets?.find((s) => !s.completed && !s.warmup);
        if (!target) {
          get().addSet(sessionId, exerciseId);
          const next = get().sessions.find((s) => s.id === sessionId)?.exercises?.find((e) => e.id === exerciseId);
          target = next?.sets?.filter((s) => !s.warmup).at(-1);
        }
        if (!target) return false;
        const patch: Partial<SetEntry> = { completed: true };
        if (log.durationMin != null) patch.durationMin = log.durationMin;
        if (log.weight != null) patch.weight = log.weight;
        if (log.reps != null) patch.reps = log.reps;
        get().patchSet(sessionId, exerciseId, target.id, patch);
        return true;
      },
      applyLiftRx: (sessionId, exerciseId, mode) => {
        const sess = get().sessions.find((s) => s.id === sessionId);
        const ex = sess?.exercises?.find((e) => e.id === exerciseId);
        if (!sess || !ex) return;
        const rx = nextPrescription(
          get().sessions.filter((s) => s.id !== sessionId || Boolean(s.finishedAt)),
          ex,
        );
        if (!rx) return;
        const lastW = rx.lastWeight;
        const lastR = rx.lastReps;
        const step = (lastW ?? rx.weight ?? 0) >= 100 ? 5 : 2.5;
        let weight = rx.weight;
        let reps = rx.reps;
        if (mode === "keep") {
          weight = lastW;
          reps = lastR;
        } else if (mode === "down") {
          const base = lastW ?? rx.weight;
          weight = base != null ? Math.max(0, Math.round((base - step) * 4) / 4) : null;
          reps = lastR ?? rx.reps;
        }
        set((s) => ({
          sessions: mutateSession(s.sessions, sessionId, (cur) => ({
            ...cur,
            exercises: cur.exercises.map((e) =>
              e.id === exerciseId
                ? {
                    ...e,
                    sets: e.sets.map((row) =>
                      row.warmup || row.completed ? row : { ...row, weight, reps },
                    ),
                  }
                : e,
            ),
          })),
        }));
      },
      addPhoto: (sessionId, exerciseId, dataUrl) =>
        set((s) => ({
          sessions: mutateSession(s.sessions, sessionId, (sess) => ({
            ...sess,
            exercises: sess.exercises.map((e) =>
              e.id === exerciseId && e.photos.length < 4
                ? { ...e, photos: [...e.photos, dataUrl] }
                : e,
            ),
          })),
        })),
      removePhoto: (sessionId, exerciseId, index) =>
        set((s) => ({
          sessions: mutateSession(s.sessions, sessionId, (sess) => ({
            ...sess,
            exercises: sess.exercises.map((e) =>
              e.id === exerciseId
                ? { ...e, photos: e.photos.filter((_, i) => i !== index) }
                : e,
            ),
          })),
        })),
      startTimer: (seconds) => {
        const duration = seconds ?? get().settings.defaultRestSec;
        set({
          timer: {
            running: true,
            duration,
            endsAt: Date.now() + duration * 1000,
            completedAt: null,
          },
        });
      },
      stopTimer: () =>
        set({
          timer: { ...idleTimer, duration: get().settings.defaultRestSec },
        }),
      skipTimer: () =>
        set({
          timer: {
            running: false,
            duration: get().settings.defaultRestSec,
            endsAt: null,
            completedAt: Date.now(),
          },
        }),
      adjustTimer: (deltaSec) => {
        const t = get().timer;
        if (!t.running || !t.endsAt) return;
        const nextEnds = t.endsAt + deltaSec * 1000;
        const remaining = nextEnds - Date.now();
        if (remaining <= 0) {
          get().markTimerDone();
          return;
        }
        set({
          timer: {
            ...t,
            endsAt: nextEnds,
            duration: Math.max(t.duration, Math.ceil(remaining / 1000)),
          },
        });
      },
      markTimerDone: () =>
        set({
          timer: {
            running: false,
            duration: get().settings.defaultRestSec,
            endsAt: null,
            completedAt: Date.now(),
          },
        }),
      setUnit: (unit) => set((s) => ({ settings: { ...s.settings, unit } })),
      setDefaultRest: (sec) =>
        set((s) => ({ settings: { ...s.settings, defaultRestSec: sec } })),
      setAutoStartRest: (v) =>
        set((s) => ({ settings: { ...s.settings, autoStartRest: v } })),
      setHapticRest: (v) =>
        set((s) => ({ settings: { ...s.settings, hapticRest: v } })),
      setTheme: (theme) =>
        set((s) => ({ settings: { ...s.settings, theme } })),
      setColorMode: (mode) =>
        set((s) => ({ settings: { ...s.settings, colorMode: mode } })),
      setMorningGate: (v) =>
        set((s) => ({ settings: { ...s.settings, morningGate: v } })),
      setDayPlan: (day, plan) =>
        set((s) => {
          const weekPlan = [...s.settings.weekPlan];
          if (day < 0 || day > 6) return s;
          weekPlan[day] = plan;
          return { settings: { ...s.settings, weekPlan } };
        }),
      slideWeekPlan: () =>
        set((s) => {
          const plan = s.settings.weekPlan;
          if (!Array.isArray(plan) || plan.length !== 7) return s;
          const rotated = [plan[6], ...plan.slice(0, 6)];
          return { settings: { ...s.settings, weekPlan: rotated } };
        }),
      setOnboarding: ({ goal, trainDays, place }) =>
        set((s) => ({
          settings: { ...s.settings, goal, trainDays, place, setupDone: true, onboarded: true },
        })),
      setBodyWeightLb: (lb) =>
        set((s) => ({ settings: { ...s.settings, bodyWeightLb: lb } })),
      setHeightCm: (cm) =>
        set((s) => ({ settings: { ...s.settings, heightCm: cm } })),
      setCalorieGoal: (n) =>
        set((s) => ({ settings: { ...s.settings, calorieGoal: n } })),
      setProteinGoal: (n) =>
        set((s) => ({ settings: { ...s.settings, proteinGoal: n } })),
      setExerciseRest: (name, sec) =>
        set((s) => ({
          settings: {
            ...s.settings,
            exerciseRest: { ...s.settings.exerciseRest, [name.toLowerCase()]: sec },
          },
        })),
      setDefaultIntensity: (intensity) =>
        set((s) => ({ settings: { ...s.settings, defaultIntensity: intensity } })),
      markBackedUp: () =>
        set((s) => ({ lastBackupAt: Date.now(), sessionsAtLastBackup: s.sessions.length })),
      logWeighIn: (lb) => {
        if (!Number.isFinite(lb) || lb <= 0) return;
        const entry: WeighIn = { id: uid(), at: Date.now(), lb };
        const day = new Date();
        day.setHours(0, 0, 0, 0);
        set((s) => ({
          weighIns: [
            ...s.weighIns.filter((w) => w.at < day.getTime()),
            entry,
          ].sort((a, b) => a.at - b.at),
          settings: { ...s.settings, bodyWeightLb: lb },
        }));
      },
      logSteps: (steps) => {
        if (!Number.isFinite(steps) || steps < 0) return;
        const entry: StepLog = { id: uid(), at: Date.now(), steps: Math.round(steps) };
        const day = new Date();
        day.setHours(0, 0, 0, 0);
        set((s) => ({
          stepLogs: [...s.stepLogs.filter((w) => w.at < day.getTime()), entry].sort((a, b) => a.at - b.at),
        }));
      },
      discardStepLog: (id) =>
        set((s) => ({ stepLogs: s.stepLogs.filter((w) => w.id !== id) })),
      logReadiness: ({ sleepHrs, energy, soreness, stress }) => {
        const entry: ReadinessLog = {
          id: uid(),
          at: Date.now(),
          sleepHrs,
          energy,
          soreness,
          stress,
          score: readinessScore(sleepHrs, energy, soreness, stress),
        };
        set((s) => ({ readinessLogs: [...s.readinessLogs, entry].slice(-60) }));
      },
      addProgressPhoto: (src, note = "") => {
        if (!src.startsWith("data:image/")) return null;
        if (get().progressPhotos.length >= 24) return null;
        const shot: ProgressPhoto = { id: uid(), at: Date.now(), src, note };
        set((s) => ({ progressPhotos: [shot, ...s.progressPhotos] }));
        return shot.id;
      },
      removeProgressPhoto: (id) =>
        set((s) => ({ progressPhotos: s.progressPhotos.filter((p) => p.id !== id) })),
      patchProgressPhoto: (id, note) =>
        set((s) => ({
          progressPhotos: s.progressPhotos.map((p) => (p.id === id ? { ...p, note } : p)),
        })),
      savePhysiqueCheckin: ({ photos, note, focus, strong, score, angles }) => {
        const row: PhysiqueCheckin = {
          id: uid(),
          at: Date.now(),
          photos,
          note,
          focus: focus ?? [],
          strong: strong ?? [],
          score,
          angles,
        };
        set((s) => ({ physiqueCheckins: [row, ...s.physiqueCheckins].slice(0, 24) }));
      },
      addWarmup: (sessionId, exerciseId) =>
        set((s) => ({
          sessions: mutateSession(s.sessions, sessionId, (sess) => ({
            ...sess,
            exercises: sess.exercises.map((e) => {
              if (e.id !== exerciseId) return e;
              const firstWorking = e.sets.find((x) => !x.warmup);
              const w = emptySet(true);
              if (firstWorking) {
                w.weight = firstWorking.weight;
                w.reps = firstWorking.reps;
              }
              return { ...e, sets: [w, ...e.sets] };
            }),
          })),
        })),
      toggleWarmup: (sessionId, exerciseId, setId) =>
        set((s) => ({
          sessions: mutateSession(s.sessions, sessionId, (sess) => ({
            ...sess,
            exercises: sess.exercises.map((e) =>
              e.id === exerciseId
                ? {
                    ...e,
                    sets: e.sets.map((x) =>
                      x.id === setId ? { ...x, warmup: !x.warmup } : x,
                    ),
                  }
                : e,
            ),
          })),
        })),
      addAccessoryForMuscle: (muscle) => {
        const lib = LIBRARY.find((l) => l.muscles.includes(muscle) && l.gear !== "cardio");
        if (!lib) return;
        let id = get().activeSessionId;
        if (!id || get().sessions.find((s) => s.id === id)?.finishedAt) {
          id = get().startSession({ name: `${lib.name} extra` });
        }
        get().addExercise(id, { name: lib.name, muscles: lib.muscles, libraryId: lib.id });
      },
      saveProgram: (sessionId, name) => {
        const src = get().sessions.find((s) => s.id === sessionId);
        if (!src?.exercises.length) return null;
        const id = uid();
        const program: Program = {
          id,
          name: name?.trim() || src.name,
          exercises: src.exercises.map((ex) => ({
            libraryId: ex.libraryId,
            name: ex.name,
            muscles: [...ex.muscles],
            notes: ex.notes,
            restSec: ex.restSec ?? null,
            sets: ex.sets.map((s) => ({
              weight: s.weight,
              reps: s.reps,
              warmup: s.warmup,
              durationMin: s.durationMin ?? null,
              distance: s.distance ?? null,
            })),
          })),
        };
        set((s) => ({ programs: [program, ...s.programs].slice(0, 24) }));
        return id;
      },
      deleteProgram: (id) =>
        set((s) => ({ programs: s.programs.filter((p) => p.id !== id) })),
      deleteProgramPack: (packId) =>
        set((s) => ({ programs: s.programs.filter((p) => p.packId !== packId) })),
      importProgramPack: ({ name, source, mapWeek, days }) => {
        const packId = uid();
        const programs: Program[] = days.map((d, i) => ({
          id: uid(),
          name: `${name} · ${d.label}`,
          exercises: d.exercises,
          packId,
          packName: name,
          dayLabel: d.label,
          source: source ?? null,
        }));
        set((s) => {
          let weekPlan = s.settings.weekPlan;
          if (mapWeek && programs.length) {
            weekPlan = emptyWeek.map((slot, i) => {
              const p = programs[i % programs.length];
              return p ? { rest: false, templateId: null, programId: p.id } : slot;
            });
          }
          return {
            programs: [...programs, ...s.programs].slice(0, 24),
            settings: { ...s.settings, weekPlan },
          };
        });
        return packId;
      },
      importBackup: (backup) => {
        const existing = new Set(get().sessions.map((s) => s.id));
        const incoming = (backup.sessions ?? []).filter((s) => s?.id && !existing.has(s.id));
        const weighExisting = new Set(get().weighIns.map((w) => w.id));
        const weighIncoming = (backup.weighIns ?? []).filter(
          (w) => w?.id && !weighExisting.has(w.id),
        );
        const stepExisting = new Set(get().stepLogs.map((w) => w.id));
        const stepIncoming = (backup.stepLogs ?? []).filter(
          (w) => w?.id && !stepExisting.has(w.id),
        );
        const photoExisting = new Set(get().progressPhotos.map((p) => p.id));
        const photoIncoming = (backup.progressPhotos ?? []).filter(
          (p) => p?.id && p.src && !photoExisting.has(p.id),
        );
        const programExisting = new Set(get().programs.map((p) => p.id));
        const programIncoming = (backup.programs ?? []).filter(
          (p) => p?.id && p.name && !programExisting.has(p.id),
        );
        set((s) => ({
          sessions: [...incoming, ...s.sessions].sort(
            (a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0),
          ),
          weighIns: [...s.weighIns, ...weighIncoming].sort((a, b) => a.at - b.at),
          stepLogs: [...s.stepLogs, ...stepIncoming].sort((a, b) => a.at - b.at),
          progressPhotos: [...photoIncoming, ...s.progressPhotos].sort((a, b) => b.at - a.at).slice(0, 24),
          programs: [...programIncoming, ...s.programs].slice(0, 24),
          settings: backup.settings
            ? {
                ...s.settings,
                ...backup.settings,
                exerciseRest: {
                  ...s.settings.exerciseRest,
                  ...(backup.settings.exerciseRest ?? {}),
                },
              }
            : s.settings,
        }));
        return { added: incoming.length };
      },
    }),
    {
      name: "forge-log-v1",
      storage: createJSONStorage(() => idbStorage),
      skipHydration: true,
      partialize: (s) => ({
        sessions: s.sessions,
        weighIns: s.weighIns,
        stepLogs: s.stepLogs,
        progressPhotos: s.progressPhotos,
        physiqueCheckins: s.physiqueCheckins,
        programs: s.programs,
        readinessLogs: s.readinessLogs,
        activeSessionId: s.activeSessionId,
        settings: s.settings,
        timer: s.timer,
        lastBackupAt: s.lastBackupAt,
        sessionsAtLastBackup: s.sessionsAtLastBackup,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GymState>;
        const sessions = Array.isArray(p.sessions) ? p.sessions : current.sessions;
        const live = sessions.find((s) => s.id === p.activeSessionId && !s.finishedAt);
        const liveId = live ? live.id : null;
        return {
          ...current,
          ...p,
          sessions,
          weighIns: Array.isArray(p.weighIns) ? p.weighIns : current.weighIns,
          stepLogs: Array.isArray(p.stepLogs) ? p.stepLogs : current.stepLogs,
          progressPhotos: Array.isArray(p.progressPhotos) ? p.progressPhotos : current.progressPhotos,
          physiqueCheckins: Array.isArray(p.physiqueCheckins) ? p.physiqueCheckins : current.physiqueCheckins,
          programs: Array.isArray(p.programs) ? p.programs : current.programs,
          readinessLogs: Array.isArray(p.readinessLogs) ? p.readinessLogs : current.readinessLogs,
          activeSessionId: liveId,
          settings: {
            ...current.settings,
            ...(p.settings ?? {}),
            exerciseRest: { ...current.settings.exerciseRest, ...(p.settings?.exerciseRest ?? {}) },
            weekPlan:
              Array.isArray(p.settings?.weekPlan) && p.settings.weekPlan.length === 7
                ? p.settings.weekPlan
                : current.settings.weekPlan,
            hapticRest: p.settings?.hapticRest ?? current.settings.hapticRest,
            theme:
              p.settings?.theme === "ember" || p.settings?.theme === "ion" || p.settings?.theme === "steel"
                ? p.settings.theme
                : current.settings.theme,
            colorMode: p.settings?.colorMode === "light" || p.settings?.colorMode === "dark"
              ? p.settings.colorMode
              : current.settings.colorMode,
            morningGate: p.settings?.morningGate ?? current.settings.morningGate,
          },
          timer: live && live.liveAt != null ? { ...current.timer, ...(p.timer ?? {}) } : { ...idleTimer, duration: current.settings.defaultRestSec },
          lastBackupAt: p.lastBackupAt ?? current.lastBackupAt,
          sessionsAtLastBackup: p.sessionsAtLastBackup ?? current.sessionsAtLastBackup,
        };
      },
    },
  ),
);

export function activeSession(): Session | undefined {
  const { sessions, activeSessionId } = useGym.getState();
  return sessions.find((s) => s.id === activeSessionId && !s.finishedAt);
}

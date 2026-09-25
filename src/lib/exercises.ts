import type { GearId, LibraryExercise, MuscleId } from "./types";

export type KitFilter = "all" | "home" | "band" | "cardio";

export const LIBRARY: LibraryExercise[] = [
  {
    id: "bench-press",
    name: "Barbell Bench Press",
    muscles: ["chest", "triceps", "shoulders"],
    gear: "barbell"
  },
  {
    id: "incline-bench",
    name: "Incline Barbell Bench",
    muscles: ["chest", "shoulders", "triceps"],
    gear: "barbell"
  },
  {
    id: "incline-db",
    name: "Incline Dumbbell Press",
    muscles: ["chest", "shoulders", "triceps"],
    gear: "dumbbell"
  },
  {
    id: "db-press",
    name: "Dumbbell Bench Press",
    muscles: ["chest", "triceps", "shoulders"],
    gear: "dumbbell"
  },
  {
    id: "chest-fly",
    name: "Dumbbell Fly",
    muscles: ["chest"],
    gear: "dumbbell"
  },
  {
    id: "cable-fly",
    name: "Cable Fly",
    muscles: ["chest"],
    gear: "cable"
  },
  {
    id: "push-up",
    name: "Push-Up",
    muscles: ["chest", "triceps", "shoulders", "core"],
    gear: "bodyweight",
    aliases: ["home"]
  },
  {
    id: "dips",
    name: "Dips",
    muscles: ["chest", "triceps", "shoulders"],
    gear: "bodyweight"
  },
  {
    id: "ohp",
    name: "Overhead Press",
    muscles: ["shoulders", "triceps", "core"],
    gear: "barbell"
  },
  {
    id: "db-ohp",
    name: "Dumbbell Shoulder Press",
    muscles: ["shoulders", "triceps"],
    gear: "dumbbell"
  },
  {
    id: "lateral-raise",
    name: "Lateral Raise",
    muscles: ["shoulders"],
    gear: "dumbbell"
  },
  {
    id: "front-raise",
    name: "Front Raise",
    muscles: ["shoulders"],
    gear: "dumbbell"
  },
  {
    id: "rear-delt-fly",
    name: "Rear Delt Fly",
    muscles: ["shoulders", "back"],
    gear: "dumbbell"
  },
  {
    id: "face-pull",
    name: "Face Pull",
    muscles: ["shoulders", "back"],
    gear: "cable"
  },
  {
    id: "upright-row",
    name: "Upright Row",
    muscles: ["shoulders", "back"],
    gear: "barbell"
  },
  {
    id: "deadlift",
    name: "Conventional Deadlift",
    muscles: ["back", "hamstrings", "glutes", "core"],
    gear: "barbell"
  },
  {
    id: "rdl",
    name: "Romanian Deadlift",
    muscles: ["hamstrings", "glutes", "back"],
    gear: "barbell"
  },
  {
    id: "sumo-deadlift",
    name: "Sumo Deadlift",
    muscles: ["glutes", "quads", "back", "hamstrings"],
    gear: "barbell"
  },
  {
    id: "pull-up",
    name: "Pull-Up",
    muscles: ["back", "biceps"],
    gear: "bodyweight",
    aliases: ["home"]
  },
  {
    id: "chin-up",
    name: "Chin-Up",
    muscles: ["back", "biceps"],
    gear: "bodyweight",
    aliases: ["home"]
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    muscles: ["back", "biceps"],
    gear: "cable"
  },
  {
    id: "barbell-row",
    name: "Barbell Row",
    muscles: ["back", "biceps"],
    gear: "barbell"
  },
  {
    id: "db-row",
    name: "One-Arm Dumbbell Row",
    muscles: ["back", "biceps"],
    gear: "dumbbell"
  },
  {
    id: "seated-row",
    name: "Seated Cable Row",
    muscles: ["back", "biceps"],
    gear: "cable"
  },
  {
    id: "shrug",
    name: "Barbell Shrug",
    muscles: ["back", "shoulders"],
    gear: "barbell"
  },
  {
    id: "barbell-curl",
    name: "Barbell Curl",
    muscles: ["biceps"],
    gear: "barbell"
  },
  {
    id: "db-curl",
    name: "Dumbbell Curl",
    muscles: ["biceps"],
    gear: "dumbbell"
  },
  {
    id: "hammer-curl",
    name: "Hammer Curl",
    muscles: ["biceps"],
    gear: "dumbbell"
  },
  {
    id: "preacher-curl",
    name: "Preacher Curl",
    muscles: ["biceps"],
    gear: "dumbbell"
  },
  {
    id: "tricep-pushdown",
    name: "Tricep Pushdown",
    muscles: ["triceps"],
    gear: "cable"
  },
  {
    id: "skull-crusher",
    name: "Skull Crusher",
    muscles: ["triceps"],
    gear: "barbell"
  },
  {
    id: "oh-extension",
    name: "Overhead Tricep Extension",
    muscles: ["triceps"],
    gear: "dumbbell"
  },
  {
    id: "close-grip-bench",
    name: "Close-Grip Bench",
    muscles: ["triceps", "chest"],
    gear: "barbell"
  },
  {
    id: "back-squat",
    name: "Back Squat",
    muscles: ["quads", "glutes", "core"],
    gear: "barbell"
  },
  {
    id: "front-squat",
    name: "Front Squat",
    muscles: ["quads", "core", "glutes"],
    gear: "barbell"
  },
  {
    id: "goblet-squat",
    name: "Goblet Squat",
    muscles: ["quads", "glutes", "core"],
    gear: "dumbbell"
  },
  {
    id: "leg-press",
    name: "Leg Press",
    muscles: ["quads", "glutes"],
    gear: "machine"
  },
  {
    id: "leg-extension",
    name: "Leg Extension",
    muscles: ["quads"],
    gear: "machine"
  },
  {
    id: "leg-curl",
    name: "Lying Leg Curl",
    muscles: ["hamstrings"],
    gear: "machine"
  },
  {
    id: "walking-lunge",
    name: "Walking Lunge",
    muscles: ["quads", "glutes"],
    gear: "dumbbell"
  },
  {
    id: "bulgarian-split",
    name: "Bulgarian Split Squat",
    muscles: ["quads", "glutes"],
    gear: "dumbbell"
  },
  {
    id: "hip-thrust",
    name: "Hip Thrust",
    muscles: ["glutes", "hamstrings"],
    gear: "barbell"
  },
  {
    id: "glute-bridge",
    name: "Glute Bridge",
    muscles: ["glutes", "hamstrings"],
    gear: "bodyweight",
    aliases: ["home"]
  },
  {
    id: "calf-raise",
    name: "Standing Calf Raise",
    muscles: ["calves"],
    gear: "bodyweight",
    aliases: ["home"]
  },
  {
    id: "seated-calf",
    name: "Seated Calf Raise",
    muscles: ["calves"],
    gear: "machine"
  },
  {
    id: "plank",
    name: "Plank",
    muscles: ["core"],
    gear: "bodyweight",
    aliases: ["home"]
  },
  {
    id: "hanging-raise",
    name: "Hanging Leg Raise",
    muscles: ["core"],
    gear: "bodyweight"
  },
  {
    id: "cable-crunch",
    name: "Cable Crunch",
    muscles: ["core"],
    gear: "cable"
  },
  {
    id: "ab-wheel",
    name: "Ab Wheel",
    muscles: ["core"],
    gear: "bodyweight"
  },
  {
    id: "farmer-carry",
    name: "Farmer Carry",
    muscles: ["core", "back", "shoulders"],
    gear: "dumbbell"
  },
  {
    id: "run",
    name: "Run",
    muscles: ["cardio", "quads", "calves"],
    gear: "cardio"
  },
  {
    id: "bike",
    name: "Bike",
    muscles: ["cardio", "quads"],
    gear: "cardio"
  },
  {
    id: "row-erg",
    name: "Row Erg",
    muscles: ["cardio", "back", "core"],
    gear: "cardio",
    aliases: ["rower", "concept2"]
  },
  {
    id: "treadmill",
    name: "Treadmill",
    muscles: ["cardio", "quads", "calves"],
    gear: "cardio"
  },
  {
    id: "elliptical",
    name: "Elliptical",
    muscles: ["cardio", "quads", "glutes"],
    gear: "cardio"
  },
  {
    id: "stair-climber",
    name: "Stair Climber",
    muscles: ["cardio", "quads", "glutes"],
    gear: "cardio",
    aliases: ["stairmaster", "stepmill"]
  },
  {
    id: "recumbent-bike",
    name: "Recumbent Bike",
    muscles: ["cardio", "quads"],
    gear: "cardio"
  },
  {
    id: "spin-bike",
    name: "Spin Bike",
    muscles: ["cardio", "quads"],
    gear: "cardio",
    aliases: ["indoor cycle"]
  },
  {
    id: "assault-bike",
    name: "Assault Bike",
    muscles: ["cardio", "quads", "shoulders"],
    gear: "cardio",
    aliases: ["air bike", "fan bike"]
  },
  {
    id: "skierg",
    name: "SkiErg",
    muscles: ["cardio", "back", "shoulders", "core"],
    gear: "cardio"
  },
  {
    id: "walk",
    name: "Walk",
    muscles: ["cardio", "calves"],
    gear: "cardio",
    aliases: ["incline walk"]
  },
  {
    id: "jump-rope",
    name: "Jump Rope",
    muscles: ["cardio", "calves"],
    gear: "bodyweight",
    aliases: ["home"]
  },
  {
    id: "bw-squat",
    name: "Bodyweight Squat",
    muscles: ["quads", "glutes", "core"],
    gear: "bodyweight",
    aliases: ["home", "air squat"]
  },
  {
    id: "reverse-lunge",
    name: "Reverse Lunge",
    muscles: ["quads", "glutes"],
    gear: "bodyweight",
    aliases: ["home"]
  },
  {
    id: "wall-sit",
    name: "Wall Sit",
    muscles: ["quads", "glutes"],
    gear: "bodyweight",
    aliases: ["home"]
  },
  {
    id: "pike-push-up",
    name: "Pike Push-Up",
    muscles: ["shoulders", "triceps", "chest"],
    gear: "bodyweight",
    aliases: ["home"]
  },
  {
    id: "diamond-push-up",
    name: "Diamond Push-Up",
    muscles: ["triceps", "chest"],
    gear: "bodyweight",
    aliases: ["home"]
  },
  {
    id: "superman",
    name: "Superman",
    muscles: ["back", "glutes"],
    gear: "bodyweight",
    aliases: ["home"]
  },
  {
    id: "bird-dog",
    name: "Bird Dog",
    muscles: ["core", "back", "glutes"],
    gear: "bodyweight",
    aliases: ["home"]
  },
  {
    id: "dead-bug",
    name: "Dead Bug",
    muscles: ["core"],
    gear: "bodyweight",
    aliases: ["home"]
  },
  {
    id: "mountain-climber",
    name: "Mountain Climber",
    muscles: ["core", "cardio", "shoulders"],
    gear: "bodyweight",
    aliases: ["home"]
  },
  {
    id: "burpee",
    name: "Burpee",
    muscles: ["cardio", "chest", "quads", "core"],
    gear: "bodyweight",
    aliases: ["home"]
  },
  {
    id: "bicycle-crunch",
    name: "Bicycle Crunch",
    muscles: ["core"],
    gear: "bodyweight",
    aliases: ["home"]
  },
  {
    id: "side-plank",
    name: "Side Plank",
    muscles: ["core"],
    gear: "bodyweight",
    aliases: ["home"]
  },
  {
    id: "hollow-hold",
    name: "Hollow Hold",
    muscles: ["core"],
    gear: "bodyweight",
    aliases: ["home"]
  },
  {
    id: "jumping-jack",
    name: "Jumping Jack",
    muscles: ["cardio", "calves", "shoulders"],
    gear: "bodyweight",
    aliases: ["home"]
  },
  {
    id: "band-chest-press",
    name: "Band Chest Press",
    muscles: ["chest", "triceps", "shoulders"],
    gear: "band",
    aliases: ["bands", "resistance band"]
  },
  {
    id: "band-fly",
    name: "Band Fly",
    muscles: ["chest"],
    gear: "band",
    aliases: ["bands"]
  },
  {
    id: "band-row",
    name: "Band Row",
    muscles: ["back", "biceps"],
    gear: "band",
    aliases: ["bands"]
  },
  {
    id: "band-lat-pulldown",
    name: "Band Lat Pulldown",
    muscles: ["back", "biceps"],
    gear: "band",
    aliases: ["bands"]
  },
  {
    id: "band-face-pull",
    name: "Band Face Pull",
    muscles: ["shoulders", "back"],
    gear: "band",
    aliases: ["bands"]
  },
  {
    id: "band-pull-apart",
    name: "Band Pull-Apart",
    muscles: ["shoulders", "back"],
    gear: "band",
    aliases: ["bands"]
  },
  {
    id: "band-ohp",
    name: "Band Overhead Press",
    muscles: ["shoulders", "triceps"],
    gear: "band",
    aliases: ["bands"]
  },
  {
    id: "band-lateral-raise",
    name: "Band Lateral Raise",
    muscles: ["shoulders"],
    gear: "band",
    aliases: ["bands"]
  },
  {
    id: "band-curl",
    name: "Band Curl",
    muscles: ["biceps"],
    gear: "band",
    aliases: ["bands"]
  },
  {
    id: "band-pushdown",
    name: "Band Tricep Pushdown",
    muscles: ["triceps"],
    gear: "band",
    aliases: ["bands"]
  },
  {
    id: "band-kickback",
    name: "Band Tricep Kickback",
    muscles: ["triceps"],
    gear: "band",
    aliases: ["bands"]
  },
  {
    id: "band-squat",
    name: "Band Squat",
    muscles: ["quads", "glutes", "core"],
    gear: "band",
    aliases: ["bands"]
  },
  {
    id: "band-rdl",
    name: "Band Romanian Deadlift",
    muscles: ["hamstrings", "glutes", "back"],
    gear: "band",
    aliases: ["bands"]
  },
  {
    id: "band-glute-kickback",
    name: "Band Glute Kickback",
    muscles: ["glutes", "hamstrings"],
    gear: "band",
    aliases: ["bands"]
  },
  {
    id: "band-hip-thrust",
    name: "Band Hip Thrust",
    muscles: ["glutes", "hamstrings"],
    gear: "band",
    aliases: ["bands"]
  },
  {
    id: "band-lateral-walk",
    name: "Band Lateral Walk",
    muscles: ["glutes"],
    gear: "band",
    aliases: ["bands", "monster walk"]
  },
  {
    id: "band-pallof",
    name: "Band Pallof Press",
    muscles: ["core"],
    gear: "band",
    aliases: ["bands"]
  },
  {
    id: "band-good-morning",
    name: "Band Good Morning",
    muscles: ["hamstrings", "glutes", "back"],
    gear: "band",
    aliases: ["bands"]
  },
  {
    id: "band-pull-through",
    name: "Band Pull-Through",
    muscles: ["glutes", "hamstrings"],
    gear: "band",
    aliases: ["bands"]
  },
  {
    id: "band-punch",
    name: "Band Punch",
    muscles: ["shoulders", "chest", "core", "cardio"],
    gear: "band",
    aliases: ["bands"]
  },
  {
    id: "band-woodchop",
    name: "Band Woodchop",
    muscles: ["core", "shoulders"],
    gear: "band",
    aliases: ["bands"]
  },
  {
    id: "band-front-kick",
    name: "Band Front Kick",
    muscles: ["quads", "glutes", "core"],
    gear: "band",
    aliases: ["bands"]
  },
  {
    id: "band-seated-row",
    name: "Band Seated Row",
    muscles: ["back", "biceps"],
    gear: "band",
    aliases: ["bands"]
  },
  { id: "decline-bench", name: "Decline Barbell Bench", muscles: ["chest", "triceps"], gear: "barbell" },
  { id: "decline-db-press", name: "Decline Dumbbell Press", muscles: ["chest", "triceps"], gear: "dumbbell" },
  { id: "floor-press", name: "Floor Press", muscles: ["chest", "triceps"], gear: "barbell" },
  { id: "db-floor-press", name: "Dumbbell Floor Press", muscles: ["chest", "triceps"], gear: "dumbbell", aliases: ["home"] },
  { id: "machine-chest-press", name: "Machine Chest Press", muscles: ["chest", "triceps", "shoulders"], gear: "machine" },
  { id: "pec-deck", name: "Pec Deck", muscles: ["chest"], gear: "machine" },
  { id: "cable-crossover", name: "Cable Crossover", muscles: ["chest"], gear: "cable" },
  { id: "low-cable-fly", name: "Low Cable Fly", muscles: ["chest"], gear: "cable" },
  { id: "high-cable-fly", name: "High Cable Fly", muscles: ["chest"], gear: "cable" },
  { id: "incline-cable-fly", name: "Incline Cable Fly", muscles: ["chest"], gear: "cable" },
  { id: "squeeze-press", name: "Dumbbell Squeeze Press", muscles: ["chest", "triceps"], gear: "dumbbell" },
  { id: "hex-press", name: "Hex Press", muscles: ["chest", "triceps"], gear: "dumbbell" },
  { id: "smith-bench", name: "Smith Machine Bench", muscles: ["chest", "triceps", "shoulders"], gear: "machine" },
  { id: "smith-incline", name: "Smith Incline Press", muscles: ["chest", "shoulders", "triceps"], gear: "machine" },
  { id: "plate-press", name: "Plate Press", muscles: ["chest", "triceps"], gear: "bodyweight", aliases: ["home"] },
  { id: "wide-push-up", name: "Wide Push-Up", muscles: ["chest", "shoulders", "triceps"], gear: "bodyweight", aliases: ["home"] },
  { id: "decline-push-up", name: "Decline Push-Up", muscles: ["chest", "shoulders", "triceps"], gear: "bodyweight", aliases: ["home"] },
  { id: "incline-push-up", name: "Incline Push-Up", muscles: ["chest", "triceps"], gear: "bodyweight", aliases: ["home"] },
  { id: "chest-dip", name: "Chest Dip", muscles: ["chest", "triceps", "shoulders"], gear: "bodyweight" },
  { id: "svend-press", name: "Svend Press", muscles: ["chest"], gear: "dumbbell" },

  { id: "pendlay-row", name: "Pendlay Row", muscles: ["back", "biceps"], gear: "barbell" },
  { id: "yates-row", name: "Yates Row", muscles: ["back", "biceps"], gear: "barbell" },
  { id: "t-bar-row", name: "T-Bar Row", muscles: ["back", "biceps"], gear: "barbell" },
  { id: "chest-supported-row", name: "Chest-Supported Row", muscles: ["back", "biceps"], gear: "dumbbell" },
  { id: "meadows-row", name: "Meadows Row", muscles: ["back", "biceps"], gear: "barbell" },
  { id: "seal-row", name: "Seal Row", muscles: ["back", "biceps"], gear: "barbell" },
  { id: "helms-row", name: "Helms Row", muscles: ["back", "biceps"], gear: "dumbbell" },
  { id: "inverted-row", name: "Inverted Row", muscles: ["back", "biceps"], gear: "bodyweight", aliases: ["home"] },
  { id: "straight-arm-pulldown", name: "Straight-Arm Pulldown", muscles: ["back"], gear: "cable" },
  { id: "close-grip-pulldown", name: "Close-Grip Pulldown", muscles: ["back", "biceps"], gear: "cable" },
  { id: "wide-grip-pulldown", name: "Wide-Grip Pulldown", muscles: ["back", "biceps"], gear: "cable" },
  { id: "neutral-pulldown", name: "Neutral-Grip Pulldown", muscles: ["back", "biceps"], gear: "cable" },
  { id: "machine-row", name: "Machine Row", muscles: ["back", "biceps"], gear: "machine" },
  { id: "lat-prayer", name: "Lat Prayer", muscles: ["back"], gear: "cable" },
  { id: "rack-pull", name: "Rack Pull", muscles: ["back", "glutes", "hamstrings"], gear: "barbell" },
  { id: "good-morning", name: "Good Morning", muscles: ["hamstrings", "back", "glutes"], gear: "barbell" },
  { id: "back-extension", name: "Back Extension", muscles: ["back", "glutes", "hamstrings"], gear: "machine", aliases: ["hyperextension"] },
  { id: "reverse-hyperextension", name: "Reverse Hyperextension", muscles: ["glutes", "hamstrings", "back"], gear: "machine" },
  { id: "db-shrug", name: "Dumbbell Shrug", muscles: ["back", "shoulders"], gear: "dumbbell" },
  { id: "cable-shrug", name: "Cable Shrug", muscles: ["back", "shoulders"], gear: "cable" },
  { id: "farmer-shrug", name: "Farmer Shrug", muscles: ["back", "shoulders"], gear: "dumbbell" },
  { id: "wide-pull-up", name: "Wide-Grip Pull-Up", muscles: ["back", "biceps"], gear: "bodyweight" },
  { id: "neutral-pull-up", name: "Neutral-Grip Pull-Up", muscles: ["back", "biceps"], gear: "bodyweight" },
  { id: "assisted-pull-up", name: "Assisted Pull-Up", muscles: ["back", "biceps"], gear: "machine" },

  { id: "arnold-press", name: "Arnold Press", muscles: ["shoulders", "triceps"], gear: "dumbbell" },
  { id: "seated-ohp", name: "Seated Barbell Press", muscles: ["shoulders", "triceps"], gear: "barbell" },
  { id: "push-press", name: "Push Press", muscles: ["shoulders", "triceps", "quads"], gear: "barbell" },
  { id: "landmine-press", name: "Landmine Press", muscles: ["shoulders", "chest", "triceps"], gear: "barbell" },
  { id: "machine-shoulder-press", name: "Machine Shoulder Press", muscles: ["shoulders", "triceps"], gear: "machine" },
  { id: "smith-ohp", name: "Smith Overhead Press", muscles: ["shoulders", "triceps"], gear: "machine" },
  { id: "cable-lateral-raise", name: "Cable Lateral Raise", muscles: ["shoulders"], gear: "cable" },
  { id: "leaning-lateral-raise", name: "Leaning Lateral Raise", muscles: ["shoulders"], gear: "dumbbell" },
  { id: "machine-lateral-raise", name: "Machine Lateral Raise", muscles: ["shoulders"], gear: "machine" },
  { id: "cable-front-raise", name: "Cable Front Raise", muscles: ["shoulders"], gear: "cable" },
  { id: "plate-front-raise", name: "Plate Front Raise", muscles: ["shoulders"], gear: "bodyweight" },
  { id: "cable-rear-delt", name: "Cable Rear Delt Fly", muscles: ["shoulders", "back"], gear: "cable" },
  { id: "machine-rear-delt", name: "Machine Rear Delt Fly", muscles: ["shoulders", "back"], gear: "machine" },
  { id: "bent-over-lateral", name: "Bent-Over Lateral Raise", muscles: ["shoulders", "back"], gear: "dumbbell" },
  { id: "lu-raise", name: "Lu Raise", muscles: ["shoulders"], gear: "dumbbell" },
  { id: "bradford-press", name: "Bradford Press", muscles: ["shoulders", "triceps"], gear: "barbell" },
  { id: "cuban-press", name: "Cuban Press", muscles: ["shoulders"], gear: "dumbbell" },
  { id: "bus-drivers", name: "Bus Drivers", muscles: ["shoulders"], gear: "bodyweight" },

  { id: "ez-curl", name: "EZ-Bar Curl", muscles: ["biceps"], gear: "barbell" },
  { id: "incline-curl", name: "Incline Dumbbell Curl", muscles: ["biceps"], gear: "dumbbell" },
  { id: "concentration-curl", name: "Concentration Curl", muscles: ["biceps"], gear: "dumbbell" },
  { id: "cable-curl", name: "Cable Curl", muscles: ["biceps"], gear: "cable" },
  { id: "bayesian-curl", name: "Bayesian Cable Curl", muscles: ["biceps"], gear: "cable" },
  { id: "spider-curl", name: "Spider Curl", muscles: ["biceps"], gear: "dumbbell" },
  { id: "drag-curl", name: "Drag Curl", muscles: ["biceps"], gear: "barbell" },
  { id: "reverse-curl", name: "Reverse Curl", muscles: ["biceps"], gear: "barbell" },
  { id: "zottman-curl", name: "Zottman Curl", muscles: ["biceps"], gear: "dumbbell" },
  { id: "machine-curl", name: "Machine Curl", muscles: ["biceps"], gear: "machine" },
  { id: "preacher-ez", name: "EZ-Bar Preacher Curl", muscles: ["biceps"], gear: "barbell" },
  { id: "21s-curl", name: "21s Curl", muscles: ["biceps"], gear: "barbell" },
  { id: "cross-body-hammer", name: "Cross-Body Hammer Curl", muscles: ["biceps"], gear: "dumbbell" },
  { id: "cable-hammer", name: "Cable Hammer Curl", muscles: ["biceps"], gear: "cable" },

  { id: "overhead-cable-extension", name: "Overhead Cable Extension", muscles: ["triceps"], gear: "cable" },
  { id: "rope-pushdown", name: "Rope Pushdown", muscles: ["triceps"], gear: "cable" },
  { id: "single-arm-pushdown", name: "Single-Arm Pushdown", muscles: ["triceps"], gear: "cable" },
  { id: "kickback", name: "Tricep Kickback", muscles: ["triceps"], gear: "dumbbell" },
  { id: "jm-press", name: "JM Press", muscles: ["triceps", "chest"], gear: "barbell" },
  { id: "tate-press", name: "Tate Press", muscles: ["triceps"], gear: "dumbbell" },
  { id: "bench-dip", name: "Bench Dip", muscles: ["triceps", "chest"], gear: "bodyweight", aliases: ["home"] },
  { id: "machine-dip", name: "Machine Dip", muscles: ["triceps", "chest"], gear: "machine" },
  { id: "french-press", name: "French Press", muscles: ["triceps"], gear: "barbell" },
  { id: "lying-db-extension", name: "Lying Dumbbell Extension", muscles: ["triceps"], gear: "dumbbell" },
  { id: "cable-overhead-rope", name: "Cable Overhead Rope Extension", muscles: ["triceps"], gear: "cable" },

  { id: "hack-squat", name: "Hack Squat", muscles: ["quads", "glutes"], gear: "machine" },
  { id: "pendulum-squat", name: "Pendulum Squat", muscles: ["quads", "glutes"], gear: "machine" },
  { id: "v-squat", name: "V-Squat", muscles: ["quads", "glutes"], gear: "machine" },
  { id: "belt-squat", name: "Belt Squat", muscles: ["quads", "glutes"], gear: "machine" },
  { id: "smith-squat", name: "Smith Squat", muscles: ["quads", "glutes"], gear: "machine" },
  { id: "pause-squat", name: "Pause Squat", muscles: ["quads", "glutes", "core"], gear: "barbell" },
  { id: "box-squat", name: "Box Squat", muscles: ["quads", "glutes", "hamstrings"], gear: "barbell" },
  { id: "zercher-squat", name: "Zercher Squat", muscles: ["quads", "core", "glutes"], gear: "barbell" },
  { id: "sissy-squat", name: "Sissy Squat", muscles: ["quads"], gear: "bodyweight" },
  { id: "step-up", name: "Step-Up", muscles: ["quads", "glutes"], gear: "dumbbell" },
  { id: "reverse-lunge-db", name: "Dumbbell Reverse Lunge", muscles: ["quads", "glutes"], gear: "dumbbell" },
  { id: "walking-lunge-bb", name: "Barbell Walking Lunge", muscles: ["quads", "glutes"], gear: "barbell" },
  { id: "lateral-lunge", name: "Lateral Lunge", muscles: ["quads", "glutes"], gear: "dumbbell" },
  { id: "curtsy-lunge", name: "Curtsy Lunge", muscles: ["glutes", "quads"], gear: "dumbbell" },
  { id: "leg-press-narrow", name: "Narrow Stance Leg Press", muscles: ["quads"], gear: "machine" },
  { id: "leg-press-wide", name: "Wide Stance Leg Press", muscles: ["glutes", "quads"], gear: "machine" },
  { id: "single-leg-press", name: "Single-Leg Press", muscles: ["quads", "glutes"], gear: "machine" },
  { id: "single-leg-extension", name: "Single-Leg Extension", muscles: ["quads"], gear: "machine" },
  { id: "spanish-squat", name: "Spanish Squat", muscles: ["quads"], gear: "band" },
  { id: "cyclist-squat", name: "Cyclist Squat", muscles: ["quads"], gear: "dumbbell" },

  { id: "seated-leg-curl", name: "Seated Leg Curl", muscles: ["hamstrings"], gear: "machine" },
  { id: "standing-leg-curl", name: "Standing Leg Curl", muscles: ["hamstrings"], gear: "machine" },
  { id: "single-leg-curl", name: "Single-Leg Curl", muscles: ["hamstrings"], gear: "machine" },
  { id: "db-rdl", name: "Dumbbell RDL", muscles: ["hamstrings", "glutes", "back"], gear: "dumbbell" },
  { id: "single-leg-rdl", name: "Single-Leg RDL", muscles: ["hamstrings", "glutes"], gear: "dumbbell" },
  { id: "stiff-leg-deadlift", name: "Stiff-Leg Deadlift", muscles: ["hamstrings", "glutes", "back"], gear: "barbell" },
  { id: "deficit-deadlift", name: "Deficit Deadlift", muscles: ["hamstrings", "back", "glutes"], gear: "barbell" },
  { id: "trap-bar-deadlift", name: "Trap-Bar Deadlift", muscles: ["quads", "glutes", "back", "hamstrings"], gear: "barbell", aliases: ["hex bar"] },
  { id: "nordic-curl", name: "Nordic Curl", muscles: ["hamstrings"], gear: "bodyweight" },
  { id: "glute-ham-raise", name: "Glute-Ham Raise", muscles: ["hamstrings", "glutes"], gear: "machine" },
  { id: "slider-leg-curl", name: "Slider Leg Curl", muscles: ["hamstrings"], gear: "bodyweight", aliases: ["home"] },
  { id: "stability-ball-curl", name: "Stability Ball Leg Curl", muscles: ["hamstrings", "glutes"], gear: "bodyweight", aliases: ["home"] },

  { id: "hip-thrust-machine", name: "Machine Hip Thrust", muscles: ["glutes", "hamstrings"], gear: "machine" },
  { id: "single-leg-hip-thrust", name: "Single-Leg Hip Thrust", muscles: ["glutes", "hamstrings"], gear: "bodyweight", aliases: ["home"] },
  { id: "cable-kickback", name: "Cable Glute Kickback", muscles: ["glutes"], gear: "cable" },
  { id: "cable-pull-through", name: "Cable Pull-Through", muscles: ["glutes", "hamstrings"], gear: "cable" },
  { id: "frog-pump", name: "Frog Pump", muscles: ["glutes"], gear: "bodyweight", aliases: ["home"] },
  { id: "clamshell", name: "Clamshell", muscles: ["glutes"], gear: "band", aliases: ["home"] },
  { id: "fire-hydrant", name: "Fire Hydrant", muscles: ["glutes"], gear: "bodyweight", aliases: ["home"] },
  { id: "donkey-kick", name: "Donkey Kick", muscles: ["glutes"], gear: "bodyweight", aliases: ["home"] },
  { id: "cable-abduction", name: "Cable Hip Abduction", muscles: ["glutes"], gear: "cable" },
  { id: "machine-abduction", name: "Hip Abduction Machine", muscles: ["glutes"], gear: "machine" },
  { id: "machine-adduction", name: "Hip Adduction Machine", muscles: ["glutes"], gear: "machine" },
  { id: "smith-hip-thrust", name: "Smith Hip Thrust", muscles: ["glutes", "hamstrings"], gear: "machine" },
  { id: "sumo-squat", name: "Sumo Squat", muscles: ["glutes", "quads"], gear: "dumbbell" },
  { id: "b-stance-rdl", name: "B-Stance RDL", muscles: ["hamstrings", "glutes"], gear: "dumbbell" },

  { id: "donkey-calf", name: "Donkey Calf Raise", muscles: ["calves"], gear: "machine" },
  { id: "leg-press-calf", name: "Leg Press Calf Raise", muscles: ["calves"], gear: "machine" },
  { id: "single-leg-calf", name: "Single-Leg Calf Raise", muscles: ["calves"], gear: "bodyweight", aliases: ["home"] },
  { id: "smith-calf", name: "Smith Calf Raise", muscles: ["calves"], gear: "machine" },
  { id: "seated-db-calf", name: "Seated Dumbbell Calf Raise", muscles: ["calves"], gear: "dumbbell", aliases: ["home"] },
  { id: "tibialis-raise", name: "Tibialis Raise", muscles: ["calves"], gear: "bodyweight", aliases: ["home"] },

  { id: "decline-situp", name: "Decline Sit-Up", muscles: ["core"], gear: "bodyweight" },
  { id: "sit-up", name: "Sit-Up", muscles: ["core"], gear: "bodyweight", aliases: ["home"] },
  { id: "crunch", name: "Crunch", muscles: ["core"], gear: "bodyweight", aliases: ["home"] },
  { id: "reverse-crunch", name: "Reverse Crunch", muscles: ["core"], gear: "bodyweight", aliases: ["home"] },
  { id: "toes-to-bar", name: "Toes-to-Bar", muscles: ["core"], gear: "bodyweight" },
  { id: "knee-raise", name: "Captain Chair Knee Raise", muscles: ["core"], gear: "machine" },
  { id: "hanging-knee-raise", name: "Hanging Knee Raise", muscles: ["core"], gear: "bodyweight" },
  { id: "pallof-press", name: "Pallof Press", muscles: ["core"], gear: "cable" },
  { id: "woodchop", name: "Cable Woodchop", muscles: ["core", "shoulders"], gear: "cable" },
  { id: "russian-twist", name: "Russian Twist", muscles: ["core"], gear: "bodyweight", aliases: ["home"] },
  { id: "ab-mat-situp", name: "Ab-Mat Sit-Up", muscles: ["core"], gear: "bodyweight" },
  { id: "dragon-flag", name: "Dragon Flag", muscles: ["core"], gear: "bodyweight" },
  { id: "l-sit", name: "L-Sit", muscles: ["core"], gear: "bodyweight" },
  { id: "suitcase-carry", name: "Suitcase Carry", muscles: ["core", "back"], gear: "dumbbell" },
  { id: "overhead-carry", name: "Overhead Carry", muscles: ["core", "shoulders"], gear: "dumbbell" },
  { id: "dead-bug-press", name: "Dead Bug Press", muscles: ["core"], gear: "dumbbell", aliases: ["home"] },
  { id: "machine-crunch", name: "Machine Crunch", muscles: ["core"], gear: "machine" },
  { id: "landmine-rotation", name: "Landmine Rotation", muscles: ["core", "shoulders"], gear: "barbell" },

  { id: "row-machine", name: "Rowing Machine", muscles: ["cardio", "back", "core"], gear: "cardio" },
  { id: "versa-climber", name: "VersaClimber", muscles: ["cardio", "quads", "back"], gear: "cardio" },
  { id: "echo-bike", name: "Echo Bike", muscles: ["cardio", "quads", "shoulders"], gear: "cardio" },
  { id: "swim", name: "Swim", muscles: ["cardio", "back", "shoulders"], gear: "cardio" },
  { id: "hike", name: "Hike", muscles: ["cardio", "quads", "calves"], gear: "cardio" },
  { id: "sled-push", name: "Sled Push", muscles: ["quads", "glutes", "cardio"], gear: "machine" },
  { id: "sled-pull", name: "Sled Pull", muscles: ["back", "hamstrings", "cardio"], gear: "machine" },
  { id: "battle-rope", name: "Battle Ropes", muscles: ["cardio", "shoulders", "core"], gear: "cardio" },
  { id: "box-jump", name: "Box Jump", muscles: ["quads", "glutes", "cardio"], gear: "bodyweight" },
  { id: "kb-swing", name: "Kettlebell Swing", muscles: ["glutes", "hamstrings", "core"], gear: "dumbbell", aliases: ["kb"] },
  { id: "kb-goblet", name: "Kettlebell Goblet Squat", muscles: ["quads", "glutes", "core"], gear: "dumbbell", aliases: ["kb"] },
  { id: "kb-clean", name: "Kettlebell Clean", muscles: ["glutes", "back", "shoulders"], gear: "dumbbell", aliases: ["kb"] },
  { id: "kb-snatch", name: "Kettlebell Snatch", muscles: ["shoulders", "glutes", "core"], gear: "dumbbell", aliases: ["kb"] },
  { id: "kb-press", name: "Kettlebell Press", muscles: ["shoulders", "triceps"], gear: "dumbbell", aliases: ["kb"] },
  { id: "farmer-hold", name: "Farmer Hold", muscles: ["core", "back"], gear: "dumbbell" }
];

export const LIBRARY_MAP: Record<string, LibraryExercise> = Object.fromEntries(
  LIBRARY.map((e) => [e.id, e]),
);

export type Template = {
  id: string;
  name: string;
  blurb: string;
  exerciseIds: string[];
};

export const TEMPLATES: Template[] = [
  {
    id: "home",
    name: "Home",
    blurb: "Floor, bands, no gym",
    exerciseIds: ["push-up", "bw-squat", "reverse-lunge", "glute-bridge", "band-row", "plank"]
  },
  {
    id: "bands",
    name: "Bands",
    blurb: "Full body with a loop or tube",
    exerciseIds: ["band-chest-press", "band-row", "band-ohp", "band-squat", "band-glute-kickback", "band-pallof"]
  },
  {
    id: "cardio",
    name: "Cardio",
    blurb: "Machines, walk, row, bike",
    exerciseIds: ["treadmill", "elliptical", "stair-climber", "bike", "row-erg", "assault-bike"]
  },
  {
    id: "push",
    name: "Push",
    blurb: "Chest, shoulders, triceps",
    exerciseIds: ["bench-press", "ohp", "incline-db", "lateral-raise", "tricep-pushdown"]
  },
  {
    id: "pull",
    name: "Pull",
    blurb: "Back and biceps",
    exerciseIds: ["deadlift", "pull-up", "barbell-row", "face-pull", "barbell-curl"]
  },
  {
    id: "legs",
    name: "Legs",
    blurb: "Quads, hams, glutes",
    exerciseIds: ["back-squat", "rdl", "leg-press", "walking-lunge", "calf-raise"]
  },
  {
    id: "upper",
    name: "Upper",
    blurb: "Push and pull",
    exerciseIds: ["bench-press", "barbell-row", "ohp", "lat-pulldown", "lateral-raise"]
  },
  {
    id: "full",
    name: "Full body",
    blurb: "One of each pattern",
    exerciseIds: ["back-squat", "bench-press", "barbell-row", "ohp", "rdl"]
  },
  {
    id: "empty",
    name: "Blank session",
    blurb: "Start empty and add as you go",
    exerciseIds: []
  }
];

export const GEAR_LABEL: Record<GearId, string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  cable: "Cable",
  machine: "Machine",
  bodyweight: "Home",
  band: "Band",
  cardio: "Cardio"
};

function matchesKit(ex: LibraryExercise, kit: KitFilter): boolean {
  if (kit === "all") return true;
  if (kit === "band") return ex.gear === "band";
  if (kit === "cardio") return ex.gear === "cardio";
  return ex.gear === "bodyweight" || ex.gear === "band";
}

export function searchLibrary(
  query: string,
  muscle?: MuscleId | "all",
  kit: KitFilter = "all",
): LibraryExercise[] {
  const q = query.trim().toLowerCase();
  return LIBRARY.filter((ex) => {
    if (!matchesKit(ex, kit)) return false;
    if (muscle && muscle !== "all" && !ex.muscles.includes(muscle)) return false;
    if (!q) return true;
    if (q === "home") return ex.gear === "bodyweight" || ex.gear === "band";
    if (q === "band" || q === "bands") return ex.gear === "band";
    if (q === "cardio") return ex.gear === "cardio";
    return (
      ex.name.toLowerCase().includes(q) ||
      ex.gear.includes(q) ||
      ex.muscles.some((m) => m.includes(q)) ||
      (ex.aliases ?? []).some((a) => a.toLowerCase().includes(q))
    );
  });
}

export function matchLibrary(name: string): LibraryExercise | undefined {
  const q = name.trim().toLowerCase();
  if (!q) return undefined;
  const exact = LIBRARY.find((e) => e.name.toLowerCase() === q);
  if (exact) return exact;
  const compact = q.replace(/[^a-z0-9]+/g, "");
  const byCompact = LIBRARY.find(
    (e) => e.name.toLowerCase().replace(/[^a-z0-9]+/g, "") === compact,
  );
  if (byCompact) return byCompact;
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  const scored = LIBRARY.map((e) => {
    const n = e.name.toLowerCase();
    const hits = words.filter((w) => n.includes(w)).length;
    return { e, hits };
  })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits);
  return scored[0]?.e ?? searchLibrary(q)[0];
}

export function guessMusclesFromName(name: string): MuscleId[] {
  const n = name.trim().toLowerCase();
  if (!n) return [];
  const hits = new Set<MuscleId>();
  const rules: Array<[RegExp, MuscleId[]]> = [
    [/incline|decline|bench|chest|pec|flye?s?|cable fly/, ["chest"]],
    [/push.?up|dip(?!s?.*tricep)/, ["chest", "triceps", "shoulders"]],
    [/overhead|ohp|military press|shoulder press|lateral raise|front raise|upright row|delt/, ["shoulders"]],
    [/face.?pull|rear.?delt|reverse fly/, ["shoulders", "back"]],
    [/bicep|curl(?!.*leg)(?!.*ham)/, ["biceps"]],
    [/tricep|pushdown|skull|close.?grip|jm press|kickback/, ["triceps"]],
    [/deadlift|row|pulldown|pull.?up|chin.?up|\blat\b|shrug|farmer/, ["back"]],
    [/squat|lunge|leg.?press|leg.?ext|hack|pendulum|\bquad/, ["quads"]],
    [/rdl|romanian|hamstring|leg.?curl|good.?morning|nordic|stiff.?leg/, ["hamstrings"]],
    [/glute|hip.?thrust|kickback|bridge|hip.?abduct/, ["glutes"]],
    [/calf|soleus|tibialis/, ["calves"]],
    [/plank|crunch|\bab\b|abs|core|pallof|sit.?up|hanging (leg|knee)|woodchop/, ["core"]],
    [/run|jog|walk|bike|cycle|cardio|treadmill|elliptical|stair|assault|erg|swim/, ["cardio"]],
  ];
  for (const [re, ms] of rules) {
    if (re.test(n)) for (const m of ms) hits.add(m);
  }
  return [...hits];
}

export function resolveMuscles(ex: {
  name: string;
  muscles?: MuscleId[] | null;
  libraryId?: string | null;
}): MuscleId[] {
  const owned = (ex.muscles ?? []).filter(Boolean);
  if (owned.length) return [...new Set(owned)];
  if (ex.libraryId && LIBRARY_MAP[ex.libraryId]) return [...LIBRARY_MAP[ex.libraryId].muscles];
  const lib = matchLibrary(ex.name);
  if (lib?.muscles.length) return [...lib.muscles];
  return guessMusclesFromName(ex.name);
}

export function isDurationLog(ex: { libraryId?: string | null; muscles: MuscleId[] }): boolean {
  const lib = ex.libraryId ? LIBRARY_MAP[ex.libraryId] : undefined;
  if (lib?.gear === "cardio") return true;
  return !ex.libraryId && ex.muscles.length === 1 && ex.muscles[0] === "cardio";
}


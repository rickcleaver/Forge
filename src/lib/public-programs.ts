export type PublicProgram = {
  id: string;
  name: string;
  source: string;
  blurb: string;
  days: string;
  text: string;
};

export const PUBLIC_PROGRAMS: PublicProgram[] = [
  {
    id: "wiki-ppl",
    name: "Wiki PPL",
    source: "r/Fitness community PPL",
    blurb: "6-day push / pull / legs. The free template most people actually run.",
    days: "6 days",
    text: `Wiki PPL

Day 1 — Push
Barbell Bench Press 4x5-8
Overhead Press 3x8-12
Incline Dumbbell Press 3x8-12
Lateral Raise 3x12-15
Tricep Pushdown 3x8-12
Overhead Tricep Extension 3x8-12

Day 2 — Pull
Conventional Deadlift 3x5
Pull-Up 3x6-12
Barbell Row 3x5-8
Face Pull 5x15-20
Dumbbell Curl 3x8-12
Hammer Curl 3x8-12

Day 3 — Legs
Back Squat 4x5-8
Romanian Deadlift 3x8-12
Leg Press 3x8-12
Lying Leg Curl 3x8-12
Standing Calf Raise 3x8-12

Day 4 — Push
Overhead Press 4x5-8
Barbell Bench Press 3x8-12
Incline Dumbbell Press 3x8-12
Lateral Raise 3x12-15
Tricep Pushdown 3x8-12
Overhead Tricep Extension 3x8-12

Day 5 — Pull
Barbell Row 4x5-8
Lat Pulldown 3x8-12
Seated Cable Row 3x8-12
Face Pull 5x15-20
Barbell Curl 3x8-12
Hammer Curl 3x8-12

Day 6 — Legs
Front Squat 4x5-8
Romanian Deadlift 3x8-12
Walking Lunge 3x8-12
Leg Extension 3x8-12
Standing Calf Raise 3x8-12`,
  },
  {
    id: "upper-lower",
    name: "Upper / Lower",
    source: "Public 4-day split",
    blurb: "Four days. Heavy then hypertrophy. Fits a work week.",
    days: "4 days",
    text: `Upper Lower

Day 1 — Upper strength
Barbell Bench Press 4x5
Barbell Row 4x5
Overhead Press 3x6-8
Lat Pulldown 3x8
Barbell Curl 3x8-10
Tricep Pushdown 3x8-10

Day 2 — Lower strength
Back Squat 4x5
Romanian Deadlift 3x6-8
Leg Press 3x8
Lying Leg Curl 3x8-10
Standing Calf Raise 4x8-12

Day 3 — Upper pump
Incline Dumbbell Press 4x8-12
Seated Cable Row 4x8-12
Lateral Raise 4x12-15
Face Pull 3x15-20
Dumbbell Curl 3x10-12
Overhead Tricep Extension 3x10-12

Day 4 — Lower pump
Front Squat 3x8-10
Hip Thrust 3x8-12
Walking Lunge 3x10
Leg Extension 3x12-15
Standing Calf Raise 4x10-15`,
  },
  {
    id: "five-by-five",
    name: "5x5 A/B",
    source: "Classic novice 5x5",
    blurb: "Three days. Add 5 lb when you hit all 25 reps. Simple on purpose.",
    days: "2 workouts",
    text: `Five by five A/B

Day 1 — Workout A
Back Squat 5x5
Barbell Bench Press 5x5
Barbell Row 5x5

Day 2 — Workout B
Back Squat 5x5
Overhead Press 5x5
Conventional Deadlift 1x5`,
  },
  {
    id: "full-body",
    name: "Full body 3-day",
    source: "Novice linear template",
    blurb: "Squat, press, pull three times a week. Best first barbell block.",
    days: "3 days",
    text: `Full body 3-day

Day 1 — A
Back Squat 3x5
Barbell Bench Press 3x5
Barbell Row 3x5
Plank 3x30

Day 2 — B
Back Squat 3x5
Overhead Press 3x5
Conventional Deadlift 1x5
Hanging Leg Raise 3x8-12

Day 3 — A
Back Squat 3x5
Barbell Bench Press 3x5
Pull-Up 3x6-10
Dumbbell Curl 3x10`,
  },
  {
    id: "gzclp",
    name: "GZCLP-style",
    source: "Cody Lefever GZCLP (free)",
    blurb: "T1 heavy, T2 volume, T3 pump. Add reps, then weight.",
    days: "4 days",
    text: `GZCLP-style

Day 1 — Squat / bench
Back Squat 5x3
Barbell Bench Press 3x10
Lat Pulldown 3x15
Dumbbell Curl 3x15

Day 2 — Deadlift / press
Conventional Deadlift 5x3
Overhead Press 3x10
Seated Cable Row 3x15
Tricep Pushdown 3x15

Day 3 — Bench / squat
Barbell Bench Press 5x3
Back Squat 3x10
Pull-Up 3x10
Lateral Raise 3x15

Day 4 — Press / deadlift
Overhead Press 5x3
Romanian Deadlift 3x10
Barbell Row 3x10
Face Pull 3x15`,
  },
  {
    id: "home-bands",
    name: "Home + bands",
    source: "Forge home template",
    blurb: "No gym. Push, pull, legs with bands and bodyweight.",
    days: "3 days",
    text: `Home + bands

Day 1 — Push
Push-Up 4x10-15
Pike Push-Up 3x8-12
Band Chest Press 3x12-15
Diamond Push-Up 3x8-12
Plank 3x30

Day 2 — Pull
Band Row 4x12-15
Superman 3x12
Band Fly 3x15
Hammer Curl 3x12
Face Pull 3x15

Day 3 — Legs
Bodyweight Squat 4x15-20
Reverse Lunge 3x10
Glute Bridge 3x12-15
Wall Sit 3x30
Standing Calf Raise 4x15`,
  },
];

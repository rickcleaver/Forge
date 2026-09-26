import { useMemo, useState } from "react";
import { useGym } from "@/lib/store";
import type { TrainGoal } from "@/lib/types";
import {
  isPlayerProfileComplete,
  normalizeAgeYears,
  normalizeDisplayName,
} from "@/lib/player-profile";
import { cmToDisplay, displayToCm } from "@/lib/calories";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ForgeCharacter } from "./forge-character";

const GOALS: Array<{ id: TrainGoal; label: string; blurb: string }> = [
  { id: "muscle", label: "Build muscle", blurb: "Look strong, feel strong" },
  { id: "strength", label: "Get stronger", blurb: "Hit heavier lifts over time" },
  { id: "fat", label: "Lose fat", blurb: "Lift hard, move more" },
  { id: "fitness", label: "Get fitter", blurb: "Engine + strength combo" },
  { id: "recomp", label: "Recomp", blurb: "Add muscle, drop fat" },
];

const AGE_CHIPS = [13, 14, 15, 16, 17, 18, 19];
const LB_TO_KG = 0.453592;
const PROFILE_SKIP_KEY = "forge-profile-skip";

function readProfileSkip(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(PROFILE_SKIP_KEY) === "1";
  } catch {
    return false;
  }
}

function markProfileSkipped(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PROFILE_SKIP_KEY, "1");
  } catch {
    /* ignore */
  }
}

type Step = "name" | "age" | "body" | "goal" | "days" | "place";

export function Onboarding() {
  const settings = useGym((s) => s.settings);
  const setupDone = Boolean(settings.setupDone);
  const profileDone = isPlayerProfileComplete(settings);
  const setOnboarding = useGym((s) => s.setOnboarding);
  const setPlayerProfile = useGym((s) => s.setPlayerProfile);

  const [profileSkip, setProfileSkip] = useState(readProfileSkip);
  const [skipProfileSteps, setSkipProfileSteps] = useState(false);
  const needSetup = !setupDone;
  const needProfile = !profileDone && !profileSkip && !skipProfileSteps;

  const steps = useMemo(() => {
    const list: Step[] = [];
    if (needProfile) list.push("name", "age", "body");
    if (needSetup) list.push("goal", "days", "place");
    return list;
  }, [needProfile, needSetup]);

  const [stepIdx, setStepIdx] = useState(0);
  const [displayName, setDisplayName] = useState(settings.displayName ?? "");
  const [ageYears, setAgeYears] = useState<number | null>(settings.ageYears ?? null);
  const [goal, setGoal] = useState<TrainGoal>(settings.goal ?? "strength");
  const [days, setDays] = useState(settings.trainDays ?? 4);
  const [place, setPlace] = useState<"home" | "gym" | "both">(settings.place ?? "gym");

  const unit = settings.unit ?? "lb";
  const heightUnit = unit === "kg" ? "cm" : "in";
  const [heightRaw, setHeightRaw] = useState(() => {
    if (settings.heightCm == null) return "";
    return String(cmToDisplay(settings.heightCm, unit));
  });
  const [weightRaw, setWeightRaw] = useState(() => {
    if (settings.bodyWeightLb == null) return "";
    return unit === "kg"
      ? String(Math.round(settings.bodyWeightLb * LB_TO_KG * 10) / 10)
      : String(Math.round(settings.bodyWeightLb * 10) / 10);
  });

  if (!needProfile && !needSetup) return null;
  if (steps.length === 0) return null;

  const step = steps[Math.min(stepIdx, steps.length - 1)]!;

  function parsePositive(raw: string): number | null {
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }

  function profilePayload() {
    const h = parsePositive(heightRaw);
    const w = parsePositive(weightRaw);
    return {
      displayName: normalizeDisplayName(displayName),
      ageYears: normalizeAgeYears(ageYears),
      heightCm: h == null ? null : displayToCm(h, unit),
      bodyWeightLb: w == null ? null : unit === "kg" ? w / LB_TO_KG : w,
    };
  }

  function finishAll() {
    const profile = profilePayload();
    if (needSetup) {
      setOnboarding({ goal, trainDays: days, place, ...profile });
    } else {
      setPlayerProfile(profile);
    }
  }

  function canAdvance(): boolean {
    if (step === "name") return Boolean(normalizeDisplayName(displayName));
    if (step === "age") return normalizeAgeYears(ageYears) != null;
    if (step === "body") {
      const p = profilePayload();
      return p.heightCm != null && p.bodyWeightLb != null;
    }
    return true;
  }

  function next() {
    if (!canAdvance()) return;
    if (stepIdx >= steps.length - 1) {
      finishAll();
      return;
    }
    setStepIdx((i) => i + 1);
  }

  function skip() {
    if (needSetup && needProfile) {
      setSkipProfileSteps(true);
      setStepIdx(0);
      return;
    }
    if (needSetup && !needProfile) {
      setOnboarding({ goal, trainDays: days, place });
      return;
    }
    markProfileSkipped();
    setProfileSkip(true);
  }

  const titles: Record<Step, string> = {
    name: "What should we call you?",
    age: "How old are you?",
    body: "Quick size check",
    goal: "What are we chasing?",
    days: "How many days can you show up?",
    place: "Where do you train?",
  };
  const blurbs: Record<Step, string> = {
    name: "Nickname, first name, gym alias — Coach will use it. No last names needed.",
    age: "Keeps tips teen-friendly. Not shared. Not a medical form.",
    body: "Helps calorie guesses and Coach tips. You can edit anytime in Settings.",
    goal: "No lecture — just pick a vibe. We’ll shape this week’s Next Move from it.",
    days: "Be real. You can edit the week anytime.",
    place: "Home, gym, or both. Forge keeps the log either way.",
  };

  const onPlayerCard = step === "name" || step === "age" || step === "body";

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-bg/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4 pt-6 pb-[max(2.5rem,22dvh)]">
      <section className="hero-glow forge-neon-frame forge-card-play forge-bounce-in relative w-full overflow-hidden rounded-[2rem] bg-surface p-5 shadow-[var(--shadow-lift)]">
        <span className="forge-blob forge-blob--a" />
        <span className="forge-blob forge-blob--b" />
        <div className="relative z-[1] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">
              Forge · {onPlayerCard ? "Join the crew" : "Let’s go"}
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">{titles[step]}</h2>
            <p className="mt-1 text-sm text-muted">{blurbs[step]}</p>
          </div>
          <ForgeCharacter kind="mascot" size="sm" motion="wiggle" className="-mt-1 -mr-1 shrink-0" />
        </div>

        {step === "name" ? (
          <div className="relative z-[1] mt-5">
            <Input
              autoFocus
              value={displayName}
              maxLength={24}
              placeholder="e.g. Neo, Zara, LiftKid"
              className="h-14 rounded-2xl border-0 bg-well text-lg font-semibold"
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") next();
              }}
            />
            <p className="mt-2 font-mono text-[10px] tracking-wider text-muted uppercase">
              Shown to Coach · stays on this device
            </p>
          </div>
        ) : null}

        {step === "age" ? (
          <div className="relative z-[1] mt-5 flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {AGE_CHIPS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAgeYears(n)}
                  className={`size-12 rounded-2xl font-display text-lg font-bold tabular-nums transition-transform ${
                    ageYears === n ? "scale-105 bg-accent text-accent-fg shadow-[var(--shadow-glow)]" : "bg-well text-fg"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAgeYears(20)}
                className={`min-h-12 rounded-2xl px-4 font-display text-lg font-bold transition-transform ${
                  ageYears != null && ageYears >= 20
                    ? "scale-105 bg-accent text-accent-fg shadow-[var(--shadow-glow)]"
                    : "bg-well text-fg"
                }`}
              >
                20+
              </button>
            </div>
            <Input
              type="number"
              inputMode="numeric"
              min={10}
              max={99}
              placeholder="Or type it"
              className="h-12 rounded-2xl border-0 bg-well"
              value={ageYears ?? ""}
              onChange={(e) => {
                const n = Number(e.target.value);
                setAgeYears(Number.isFinite(n) ? n : null);
              }}
            />
          </div>
        ) : null}

        {step === "body" ? (
          <div className="relative z-[1] mt-5 grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] tracking-wider text-accent uppercase">
                Height ({heightUnit})
              </span>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.1"
                placeholder={unit === "kg" ? "178" : "70"}
                className="h-14 rounded-2xl border-0 bg-well text-lg font-semibold"
                value={heightRaw}
                onChange={(e) => setHeightRaw(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] tracking-wider text-candy-2 uppercase">
                Weight ({unit})
              </span>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.1"
                placeholder={unit === "kg" ? "70" : "155"}
                className="h-14 rounded-2xl border-0 bg-well text-lg font-semibold"
                value={weightRaw}
                onChange={(e) => setWeightRaw(e.target.value)}
              />
            </label>
            <p className="col-span-2 text-xs text-muted">
              Candy vibes only — used for rough calorie math and smarter Coach tips, not a weigh-in lecture.
            </p>
          </div>
        ) : null}

        {step === "goal" ? (
          <div className="relative z-[1] mt-5 flex flex-col gap-2">
            {GOALS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGoal(g.id)}
                className={`flex min-h-14 items-center justify-between rounded-2xl px-4 text-left transition-[transform,background-color] duration-150 ${
                  goal === g.id ? "scale-[1.01] bg-accent text-accent-fg shadow-[var(--shadow-glow)]" : "bg-well text-fg"
                }`}
              >
                <span>
                  <span className="block font-semibold">{g.label}</span>
                  <span className={`block text-xs ${goal === g.id ? "opacity-80" : "text-muted"}`}>{g.blurb}</span>
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {step === "days" ? (
          <div className="relative z-[1] mt-5 flex flex-wrap gap-2">
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setDays(n)}
                className={`size-14 rounded-2xl font-display text-xl font-bold tabular-nums transition-transform ${
                  days === n ? "scale-105 bg-accent text-accent-fg shadow-[var(--shadow-glow)]" : "bg-well text-fg"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        ) : null}

        {step === "place" ? (
          <div className="relative z-[1] mt-5 flex flex-col gap-2">
            {(
              [
                ["gym", "Gym", "Barbells, machines, cables — go wild"],
                ["home", "Home", "Floor, bands, bodyweight — still counts"],
                ["both", "Both", "Mix templates whenever you want"],
              ] as const
            ).map(([id, label, blurb]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPlace(id)}
                className={`flex min-h-14 flex-col justify-center rounded-2xl px-4 text-left transition-transform ${
                  place === id ? "scale-[1.01] bg-accent text-accent-fg shadow-[var(--shadow-glow)]" : "bg-well text-fg"
                }`}
              >
                <span className="font-semibold">{label}</span>
                <span className={`text-xs ${place === id ? "opacity-80" : "text-muted"}`}>{blurb}</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="relative z-[1] mt-6 flex gap-2">
          {stepIdx > 0 ? (
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setStepIdx((s) => s - 1)}>
              Back
            </Button>
          ) : (
            <Button type="button" variant="ghost" className="flex-1 text-muted" onClick={skip}>
              {needProfile && !needSetup ? "Later" : "Skip for now"}
            </Button>
          )}
          <Button
            type="button"
            className="flex-[2] rounded-full"
            disabled={!canAdvance()}
            onClick={next}
          >
            {stepIdx >= steps.length - 1 ? (needSetup ? "Build my week" : "Save my card") : "Next"}
          </Button>
        </div>
      </section>
      </div>
    </div>
  );
}

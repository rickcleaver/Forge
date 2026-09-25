import { useState } from "react";
import { useGym } from "@/lib/store";
import type { TrainGoal } from "@/lib/types";
import { Button } from "./ui/button";

const GOALS: Array<{ id: TrainGoal; label: string; blurb: string }> = [
  { id: "muscle", label: "Build muscle", blurb: "Hypertrophy-first weeks" },
  { id: "strength", label: "Get stronger", blurb: "Heavy compounds" },
  { id: "fat", label: "Lose fat", blurb: "Lift + move more" },
  { id: "fitness", label: "Get fitter", blurb: "Engine + strength" },
  { id: "recomp", label: "Recomp", blurb: "Add muscle, drop fat" },
];

export function Onboarding() {
  const done = useGym((s) => Boolean(s.settings.setupDone));
  const setOnboarding = useGym((s) => s.setOnboarding);
  const [goal, setGoal] = useState<TrainGoal>("strength");
  const [days, setDays] = useState(4);
  const [place, setPlace] = useState<"home" | "gym" | "both">("gym");
  const [step, setStep] = useState(0);
  if (done) return null;

  function finish() {
    setOnboarding({ goal, trainDays: days, place });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-bg/95 px-4 pb-10 pt-16 backdrop-blur-md sm:items-center">
      <section className="hero-glow w-full max-w-lg rounded-3xl bg-surface p-5 shadow-[var(--shadow-lift)]">
        <p className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">Forge · First run</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
          {step === 0 ? "What are you training for?" : step === 1 ? "How many days?" : "Where do you lift?"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {step === 0
            ? "One choice. We shape this week’s Next Move from it."
            : step === 1
              ? "We’ll map a simple week you can edit anytime."
              : "Home kits and gym templates both live in Train."}
        </p>

        {step === 0 ? (
          <div className="mt-5 flex flex-col gap-2">
            {GOALS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGoal(g.id)}
                className={`flex min-h-14 items-center justify-between rounded-2xl px-4 text-left transition-[transform,background-color] duration-150 ${
                  goal === g.id ? "bg-accent text-accent-fg shadow-[var(--shadow-glow)]" : "bg-well text-fg"
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

        {step === 1 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setDays(n)}
                className={`size-14 rounded-2xl font-display text-xl font-bold tabular-nums transition-colors ${
                  days === n ? "bg-accent text-accent-fg shadow-[var(--shadow-glow)]" : "bg-well text-fg"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-5 flex flex-col gap-2">
            {([
              ["gym", "Gym", "Barbells, machines, cables"],
              ["home", "Home", "Floor, bands, bodyweight"],
              ["both", "Both", "Mix templates freely"],
            ] as const).map(([id, label, blurb]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPlace(id)}
                className={`flex min-h-14 flex-col justify-center rounded-2xl px-4 text-left ${
                  place === id ? "bg-accent text-accent-fg shadow-[var(--shadow-glow)]" : "bg-well text-fg"
                }`}
              >
                <span className="font-semibold">{label}</span>
                <span className={`text-xs ${place === id ? "opacity-80" : "text-muted"}`}>{blurb}</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-6 flex gap-2">
          {step > 0 ? (
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          ) : (
            <Button type="button" variant="ghost" className="flex-1 text-muted" onClick={finish}>
              Skip
            </Button>
          )}
          {step < 2 ? (
            <Button type="button" className="flex-[2]" onClick={() => setStep((s) => s + 1)}>
              Continue
            </Button>
          ) : (
            <Button type="button" className="flex-[2]" onClick={finish}>
              Build my week
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

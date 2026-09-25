import { useState } from "react";
import { useGym } from "@/lib/store";
import type { TrainGoal } from "@/lib/types";
import { Button } from "./ui/button";
import { ForgeCharacter } from "./forge-character";

const GOALS: Array<{ id: TrainGoal; label: string; blurb: string }> = [
  { id: "muscle", label: "Build muscle", blurb: "Look strong, feel strong" },
  { id: "strength", label: "Get stronger", blurb: "Hit heavier lifts over time" },
  { id: "fat", label: "Lose fat", blurb: "Lift hard, move more" },
  { id: "fitness", label: "Get fitter", blurb: "Engine + strength combo" },
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

  const titles = [
    "What are we chasing?",
    "How many days can you show up?",
    "Where do you train?",
  ];
  const blurbs = [
    "No lecture — just pick a vibe. We’ll shape this week’s Next Move from it.",
    "Be real. You can edit the week anytime.",
    "Home, gym, or both. Forge keeps the log either way.",
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-bg/95 px-4 pb-10 pt-10 backdrop-blur-md sm:items-center">
      <section className="hero-glow forge-neon-frame forge-card-play forge-neon-frame forge-bounce-in relative w-full max-w-lg overflow-hidden rounded-[2rem] bg-surface p-5 shadow-[var(--shadow-lift)]">
        <span className="forge-blob forge-blob--a" />
        <span className="forge-blob forge-blob--b" />
        <div className="relative z-[1] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">Forge · Let’s go</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">{titles[step]}</h2>
            <p className="mt-1 text-sm text-muted">{blurbs[step]}</p>
          </div>
          <ForgeCharacter kind="mascot" size="sm" motion="wiggle" className="shrink-0 -mr-1 -mt-1" />
        </div>

        {step === 0 ? (
          <div className="relative z-[1] mt-5 flex flex-col gap-2">
            {GOALS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGoal(g.id)}
                className={`flex min-h-14 items-center justify-between rounded-2xl px-4 text-left transition-[transform,background-color] duration-150 ${
                  goal === g.id ? "bg-accent text-accent-fg shadow-[var(--shadow-glow)] scale-[1.01]" : "bg-well text-fg"
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
          <div className="relative z-[1] mt-5 flex flex-wrap gap-2">
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setDays(n)}
                className={`size-14 rounded-2xl font-display text-xl font-bold tabular-nums transition-transform ${
                  days === n ? "bg-accent text-accent-fg shadow-[var(--shadow-glow)] scale-105" : "bg-well text-fg"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        ) : null}

        {step === 2 ? (
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
                  place === id ? "bg-accent text-accent-fg shadow-[var(--shadow-glow)] scale-[1.01]" : "bg-well text-fg"
                }`}
              >
                <span className="font-semibold">{label}</span>
                <span className={`text-xs ${place === id ? "opacity-80" : "text-muted"}`}>{blurb}</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="relative z-[1] mt-6 flex gap-2">
          {step > 0 ? (
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          ) : (
            <Button type="button" variant="ghost" className="flex-1 text-muted" onClick={finish}>
              Skip for now
            </Button>
          )}
          {step < 2 ? (
            <Button type="button" className="flex-[2] rounded-full" onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          ) : (
            <Button type="button" className="flex-[2] rounded-full" onClick={finish}>
              Build my week
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

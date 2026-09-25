import { useState } from "react";
import { useGym } from "@/lib/store";
import type { TrainGoal } from "@/lib/types";
import { Button } from "./ui/button";

const GOALS: Array<{ id: TrainGoal; label: string }> = [
  { id: "muscle", label: "Build muscle" },
  { id: "strength", label: "Get stronger" },
  { id: "fat", label: "Lose fat" },
  { id: "fitness", label: "Get fitter" },
  { id: "recomp", label: "Recomp" },
];

export function Onboarding() {
  const done = useGym((s) => Boolean(s.settings.setupDone));
  const setOnboarding = useGym((s) => s.setOnboarding);
  const [goal, setGoal] = useState<TrainGoal>("strength");
  const [days, setDays] = useState(4);
  const [place, setPlace] = useState<"home" | "gym" | "both">("gym");
  if (done) return null;

  return (
    <section className="relative z-10 mt-6 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Welcome</p>
      <h2 className="mt-1 font-display text-xl font-semibold">How do you train?</h2>
      <p className="mt-1 text-sm text-muted">Optional. Skip if you just want to lift.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {GOALS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGoal(g.id)}
            className={`min-h-11 rounded-full px-4 text-sm ${
              goal === g.id ? "bg-accent text-accent-fg" : "bg-well text-fg"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>
      <p className="mt-4 font-mono text-[10px] tracking-wider text-muted uppercase">Days a week</p>
      <div className="mt-2 flex gap-2">
        {[2, 3, 4, 5, 6].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setDays(n)}
            className={`size-12 rounded-md font-mono text-sm ${
              days === n ? "bg-accent text-accent-fg" : "bg-well text-fg"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="mt-4 font-mono text-[10px] tracking-wider text-muted uppercase">Where</p>
      <div className="mt-2 flex gap-2">
        {(["gym", "home", "both"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPlace(p)}
            className={`min-h-11 rounded-full px-4 text-sm capitalize ${
              place === p ? "bg-accent text-accent-fg" : "bg-well text-fg"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <Button type="button" className="mt-4 w-full" onClick={() => setOnboarding({ goal, trainDays: days, place })}>
        Save
      </Button>
      <button
        type="button"
        className="mt-2 w-full py-2 text-sm text-muted"
        onClick={() => setOnboarding({ goal, trainDays: days, place })}
      >
        Skip
      </button>
    </section>
  );
}

import { useState } from "react";
import { useGym } from "@/lib/store";
import { Button } from "./ui/button";
import { ForgeCharacter } from "./forge-character";

function Chip({
  label,
  value,
  onChange,
  max = 10,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  max?: number;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="font-semibold text-fg">{label}</span>
      <input
        type="range"
        min={max === 12 ? 0 : 1}
        max={max}
        step={max === 12 ? 0.5 : 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="max-w-[55%]"
      />
      <span className="w-8 text-right font-mono text-xs tabular-nums">{value}</span>
    </label>
  );
}

export function ReadinessCard() {
  const logReadiness = useGym((s) => s.logReadiness);
  const logs = useGym((s) => s.readinessLogs);
  const last = logs.at(-1);
  const today = last && Date.now() - last.at < 20 * 3600_000;
  const [sleepHrs, setSleep] = useState(7);
  const [energy, setEnergy] = useState(6);
  const [soreness, setSore] = useState(4);
  const [stress, setStress] = useState(4);

  return (
    <section className="forge-neon-frame forge-card-play relative mt-6 overflow-hidden rounded-[1.75rem] bg-surface p-4 shadow-[var(--shadow-lift)]">
      <span className="forge-blob forge-blob--a opacity-30" />
      <div className="relative z-[1] flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-wider text-accent uppercase">Vibe check</p>
          {today ? (
            <p className="mt-1 font-display text-4xl font-semibold tabular-nums">
              {last.score}
              <span className="text-lg text-muted"> / 100</span>
            </p>
          ) : (
            <h2 className="mt-1 font-display text-xl font-semibold">How charged are you?</h2>
          )}
          <p className="mt-1 text-sm text-muted">
            {today
              ? "Locked in for today. Forge will ease up or push based on this."
              : "Sleep, energy, sore, stress — 10 seconds. No clinic vibes."}
          </p>
        </div>
        <ForgeCharacter kind="mascot" size="xs" motion={today ? "none" : "float"} />
      </div>
      {!today ? (
        <div className="relative z-[1] mt-3 flex flex-col gap-2">
          <Chip label="Sleep hrs" value={sleepHrs} onChange={setSleep} max={12} />
          <Chip label="Energy" value={energy} onChange={setEnergy} />
          <Chip label="Sore" value={soreness} onChange={setSore} />
          <Chip label="Stress" value={stress} onChange={setStress} />
          <Button
            className="mt-2 rounded-full"
            onClick={() => logReadiness({ sleepHrs, energy, soreness, stress })}
          >
            Save vibe
          </Button>
        </div>
      ) : null}
    </section>
  );
}

import { useState } from "react";
import { useGym } from "@/lib/store";
import { Button } from "./ui/button";

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
      <span className="text-muted">{label}</span>
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
    <section className="mt-6 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Readiness</p>
      {today ? (
        <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
          {last.score}
          <span className="text-lg text-muted"> / 100</span>
        </p>
      ) : (
        <p className="mt-1 text-sm text-muted">How you feel this morning. Forge uses it to hold or push loads.</p>
      )}
      {!today ? (
        <div className="mt-3 flex flex-col gap-2">
          <Chip label="Sleep hrs" value={sleepHrs} onChange={setSleep} max={12} />
          <Chip label="Energy" value={energy} onChange={setEnergy} />
          <Chip label="Soreness" value={soreness} onChange={setSore} />
          <Chip label="Stress" value={stress} onChange={setStress} />
          <Button
            className="mt-2"
            variant="secondary"
            onClick={() => logReadiness({ sleepHrs, energy, soreness, stress })}
          >
            Save check-in
          </Button>
        </div>
      ) : null}
    </section>
  );
}

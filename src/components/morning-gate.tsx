import { useState } from "react";
import { format } from "date-fns";
import { readinessScore } from "@/lib/coach-engine";
import { markCheckinDone } from "@/lib/checkin";
import { useGym } from "@/lib/store";
import { SettingsDrawer } from "./settings-drawer";

export function MorningGate({
  onContinue,
  onSkip,
}: {
  onContinue: () => void;
  onSkip: () => void;
}) {
  const logReadiness = useGym((s) => s.logReadiness);
  const [sleepHrs, setSleep] = useState(7);
  const [energy, setEnergy] = useState(6);
  const [soreness, setSore] = useState(4);
  const [stress, setStress] = useState(4);
  const preview = readinessScore(sleepHrs, energy, soreness, stress);
  const now = new Date();

  function bump(setter: (n: number) => void, value: number, delta: number, min: number, max: number) {
    setter(Math.min(max, Math.max(min, Math.round((value + delta) * 10) / 10)));
  }

  return (
    <div className="fixed inset-0 z-50 flex min-h-dvh flex-col overflow-y-auto bg-bg px-5 pt-10 pb-28">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted">{format(now, "EEEE, MMM d")}</p>
        <SettingsDrawer />
      </div>
      <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight">How you feeling?</h1>
      <p className="mt-2 text-sm text-muted">Quick check. Then we pick the right session.</p>

      <Stepper label="Sleep (hrs)" value={sleepHrs} onMinus={() => bump(setSleep, sleepHrs, -0.5, 0, 12)} onPlus={() => bump(setSleep, sleepHrs, 0.5, 0, 12)} />
      <Stepper label="Energy" value={energy} onMinus={() => bump(setEnergy, energy, -1, 1, 10)} onPlus={() => bump(setEnergy, energy, 1, 1, 10)} />
      <Stepper label="Sore" value={soreness} onMinus={() => bump(setSore, soreness, -1, 0, 10)} onPlus={() => bump(setSore, soreness, 1, 0, 10)} />
      <Stepper label="Stress" value={stress} onMinus={() => bump(setStress, stress, -1, 0, 10)} onPlus={() => bump(setStress, stress, 1, 0, 10)} />

      <div className="mt-6 rounded-2xl bg-surface px-4 py-4 shadow-[var(--shadow-border)]">
        <p className="text-sm text-muted">Readiness</p>
        <p className="font-display text-4xl font-extrabold tabular-nums">{preview}</p>
      </div>

      <div className="mt-auto pt-10">
      <button
        type="button"
        className="min-h-14 w-full rounded-full bg-accent text-base font-bold text-accent-fg shadow-[var(--shadow-glow)]"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          logReadiness({ sleepHrs, energy, soreness, stress });
          markCheckinDone();
          onContinue();
        }}
      >
        Let’s go
      </button>
      <button
        type="button"
        className="mt-3 min-h-12 w-full text-sm font-medium text-muted"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          markCheckinDone();
          onSkip();
        }}
      >
        Skip today
      </button>
      </div>
    </div>
  );
}

function Stepper({
  label,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" className="size-12 rounded-full bg-surface-2 text-xl font-bold" onPointerDown={(e) => { e.stopPropagation(); onMinus(); }}>
          –
        </button>
        <span className="w-10 text-center text-lg font-bold tabular-nums">{value}</span>
        <button type="button" className="size-12 rounded-full bg-surface-2 text-xl font-bold" onPointerDown={(e) => { e.stopPropagation(); onPlus(); }}>
          +
        </button>
      </div>
    </div>
  );
}

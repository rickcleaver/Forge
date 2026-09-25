import { useState } from "react";
import { format } from "date-fns";
import { useGym } from "@/lib/store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const LB_TO_KG = 0.453592;

export function WeightLogCard() {
  const unit = useGym((s) => s.settings.unit);
  const weighIns = useGym((s) => s.weighIns);
  const current = useGym((s) => s.settings.bodyWeightLb);
  const logWeighIn = useGym((s) => s.logWeighIn);
  const [draft, setDraft] = useState("");

  const last = weighIns.length ? weighIns[weighIns.length - 1] : null;
  const display = (lb: number) =>
    unit === "kg" ? Math.round(lb * LB_TO_KG * 10) / 10 : Math.round(lb * 10) / 10;
  const shown = last ? display(last.lb) : current ? display(current) : null;

  function submit() {
    const n = Number(draft);
    if (!Number.isFinite(n) || n <= 0) return;
    const lb = unit === "kg" ? n / LB_TO_KG : n;
    logWeighIn(lb);
    setDraft("");
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold">Body weight</h2>
      <div className="mt-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-muted">Latest</p>
            <p className="mt-1 font-display text-3xl font-extrabold tabular-nums">
              {shown ?? "—"}
              <span className="text-lg text-muted"> {unit}</span>
            </p>
            {last ? (
              <p className="mt-1 font-mono text-[11px] text-muted">
                {format(last.at, "EEE d MMM")}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted">Log a weigh-in to start the chart.</p>
            )}
          </div>
          <WeightSpark points={weighIns} unit={unit} />
        </div>
        <div className="mt-4 flex gap-2">
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            placeholder={unit === "kg" ? "82.0" : "195.0"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label={`Body weight in ${unit}`}
          />
          <Button type="button" variant="secondary" onClick={submit}>
            Log
          </Button>
        </div>
      </div>
    </section>
  );
}

function WeightSpark({
  points,
  unit,
}: {
  points: Array<{ at: number; lb: number }>;
  unit: "lb" | "kg";
}) {
  if (points.length < 2) return <div className="h-12 w-36" />;
  const vals = points.map((p) => (unit === "kg" ? p.lb * LB_TO_KG : p.lb));
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = Math.max(0.5, max - min);
  const w = 144;
  const h = 48;
  const d = vals
    .map((v, i) => {
      const x = (i / (vals.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 6) - 3;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-36 text-fg" aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

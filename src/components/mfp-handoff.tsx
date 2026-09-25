import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { estimateSessionKcal, INTENSITY_LABEL, sendSessionToMfp } from "@/lib/mfp";
import { useGym } from "@/lib/store";
import type { Intensity, Session } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const INTENSITY_OPTIONS: Intensity[] = ["light", "moderate", "hard"];

export function MfpHandoff({
  session,
  endedAt,
}: {
  session: Session;
  endedAt?: number;
}) {
  const bodyWeightLb = useGym((s) => s.settings.bodyWeightLb);
  const defaultIntensity = useGym((s) => s.settings.defaultIntensity);
  const [intensity, setIntensity] = useState<Intensity>(defaultIntensity);
  const kcal = estimateSessionKcal(
    session,
    endedAt ?? session.finishedAt ?? Date.now(),
    bodyWeightLb,
    intensity,
  );

  return (
    <div className="rounded-lg bg-surface-2 px-3 py-3">
      <p className="font-mono text-[10px] tracking-wider text-muted uppercase">MyFitnessPal</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">~{kcal} kcal</p>
      <p className="mt-0.5 text-xs text-muted">
        {bodyWeightLb
          ? "Rough estimate from duration, body weight, and effort — not a measurement."
          : "Set body weight in Settings for a tighter estimate."}
      </p>
      <div className="mt-3 flex rounded-md bg-bg p-1">
        {INTENSITY_OPTIONS.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIntensity(i)}
            className={cn(
              "h-8 flex-1 rounded-sm font-mono text-xs",
              intensity === i ? "bg-accent text-accent-fg" : "text-muted",
            )}
          >
            {INTENSITY_LABEL[i]}
          </button>
        ))}
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="mt-3 w-full"
        onClick={() => void sendSessionToMfp(session, kcal)}
      >
        <ExternalLink className="size-4" />
        Copy & open MyFitnessPal
      </Button>
    </div>
  );
}

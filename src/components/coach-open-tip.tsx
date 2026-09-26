import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { coachTipForOpen, markCoachTipShown, type CoachOpenTip } from "@/lib/coach-tip";
import { useGym } from "@/lib/store";
import { ForgeCharacter } from "./forge-character";

/**
 * Optional Coach tip on app open — only when grounded in streak / last session /
 * sleep·readiness / next program day. Once per calendar day max.
 */
export function CoachOpenTipBanner({ ready }: { ready: boolean }) {
  const sessions = useGym((s) => s.sessions);
  const readiness = useGym((s) => s.readinessLogs);
  const settings = useGym((s) => s.settings);
  const programs = useGym((s) => s.programs);
  const [tip, setTip] = useState<CoachOpenTip | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const candidate = useMemo(() => {
    if (!ready) return null;
    return coachTipForOpen({ sessions, readiness, settings, programs });
  }, [ready, sessions, readiness, settings, programs]);

  useEffect(() => {
    if (!candidate || dismissed) return;
    setTip(candidate);
    markCoachTipShown(candidate.id);
  }, [candidate, dismissed]);

  if (!tip || dismissed) return null;

  return (
    <div
      className="forge-bounce-in fixed inset-x-0 z-[55] flex justify-center px-3"
      style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
      role="status"
    >
      <div className="forge-neon-frame relative flex w-full max-w-lg items-start gap-3 overflow-hidden rounded-3xl bg-surface/95 px-4 py-3 shadow-[var(--shadow-lift)] backdrop-blur-xl">
        <span className="forge-blob forge-blob--a opacity-40" />
        <ForgeCharacter kind="mascot" size="xs" motion="none" className="relative z-[1] shrink-0" />
        <div className="relative z-[1] min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">Coach tip</p>
          <p className="mt-1 text-sm leading-snug text-fg">{tip.text}</p>
        </div>
        <button
          type="button"
          aria-label="Dismiss coach tip"
          className="relative z-[1] rounded-full p-1.5 text-muted hover:bg-well hover:text-fg"
          onClick={() => setDismissed(true)}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { isAndroid, openGarminConnect, openHealthConnect, healthFromBridge } from "@/lib/health-connect";
import { useGym } from "@/lib/store";
import { Button } from "./ui/button";

export function HealthConnectCard() {
  const logSteps = useGym((s) => s.logSteps);
  const [bridge, setBridge] = useState<{ steps?: number; sleepHrs?: number; readiness?: number } | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const snap = healthFromBridge(e.data);
      if (!snap) return;
      setBridge(snap);
      if (snap.steps != null) logSteps(snap.steps);
      if (snap.sleepHrs != null && snap.readiness == null) {
        setHint(`Sleep from bridge: ${snap.sleepHrs}h. Add energy in Morning Gate for a full score.`);
      } else if (snap.readiness != null) {
        setHint(`Recovery signal ${snap.readiness}/100 from bridge. Confirm in Morning Gate if it feels off.`);
      } else if (snap.steps != null) {
        setHint("Steps updated from Health Connect bridge.");
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [logSteps]);

  return (
    <section className="flex flex-col gap-2">
      <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Health Connect</p>
      <p className="text-sm text-muted">
        Forge is a PWA — it cannot read Health Connect directly. A tiny Android bridge can post steps, sleep hours, and recovery.
        Until then, open the system sheets and log readiness in Morning Gate.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => openHealthConnect()}>
          {isAndroid() ? "Open Health Connect" : "Get Health Connect"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => openGarminConnect()}>
          Garmin Connect
        </Button>
      </div>
      {bridge ? (
        <p className="text-xs text-muted">
          Last bridge: {bridge.steps != null ? `${bridge.steps} steps` : "—"}
          {bridge.sleepHrs != null ? ` · ${bridge.sleepHrs}h sleep` : ""}
          {bridge.readiness != null ? ` · ready ${bridge.readiness}` : ""}
        </p>
      ) : (
        <p className="text-xs text-muted">No bridge payload yet. Waiting for postMessage type forge-health.</p>
      )}
      {hint ? <p className="text-xs text-accent">{hint}</p> : null}
    </section>
  );
}

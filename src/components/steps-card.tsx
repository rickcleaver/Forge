import { useEffect, useRef, useState } from "react";
import { format, isSameDay } from "date-fns";
import { Footprints } from "lucide-react";
import { stepsKcal } from "@/lib/calories";
import { healthFromBridge, isAndroid, openGarminConnect, openHealthConnect, stepsFromBridge, stepsFromQuery } from "@/lib/health-connect";
import { useGym } from "@/lib/store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const GOAL = 10_000;

export function StepsCard() {
  const stepLogs = useGym((s) => s.stepLogs);
  const logSteps = useGym((s) => s.logSteps);
  const applyHealthSnapshot = useGym((s) => s.applyHealthSnapshot);
  const weightLb = useGym((s) => s.settings.bodyWeightLb);
  const heightCm = useGym((s) => s.settings.heightCm);
  const healthSync = useGym((s) => s.healthSync);
  const [draft, setDraft] = useState("");
  const [live, setLive] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const liveRef = useRef(0);
  const lastMag = useRef(0);
  const lastStepAt = useRef(0);

  const today = stepLogs.filter((s) => isSameDay(s.at, Date.now())).at(-1);
  const shown = (today?.steps ?? 0) + (running ? live : 0);
  const kcal = stepsKcal(shown, weightLb, heightCm);
  const pct = Math.min(100, Math.round((shown / GOAL) * 100));

  useEffect(() => {
    const fromUrl = stepsFromQuery(window.location.search);
    if (fromUrl != null) {
      applyHealthSnapshot({ steps: fromUrl, source: "query" }, "query");
      setHint("Pulled from Health Connect.");
      const url = new URL(window.location.href);
      url.searchParams.delete("healthSteps");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
    function onMsg(e: MessageEvent) {
      const snap = healthFromBridge(e.data);
      if (snap) {
        applyHealthSnapshot(snap, "bridge");
        setHint("Pulled from Health Connect.");
        return;
      }
      const n = stepsFromBridge(e.data);
      if (n == null) return;
      applyHealthSnapshot({ steps: n, source: "bridge" }, "bridge");
      setHint("Pulled from Health Connect.");
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [applyHealthSnapshot]);

  useEffect(() => {
    if (!running) return;
    let handle: ((e: DeviceMotionEvent) => void) | null = null;

    function onMotion(e: DeviceMotionEvent) {
      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x == null || acc.y == null || acc.z == null) return;
      const mag = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
      const now = Date.now();
      const delta = mag - lastMag.current;
      lastMag.current = mag;
      if (delta > 1.6 && now - lastStepAt.current > 280) {
        lastStepAt.current = now;
        liveRef.current += 1;
        setLive(liveRef.current);
      }
    }

    async function start() {
      setError(null);
      const DM = DeviceMotionEvent as typeof DeviceMotionEvent & {
        requestPermission?: () => Promise<string>;
      };
      try {
        if (typeof DM.requestPermission === "function") {
          const perm = await DM.requestPermission();
          if (perm !== "granted") {
            setError("Motion permission denied. Type the number instead.");
            setRunning(false);
            return;
          }
        }
      } catch {
        setError("This browser cannot count steps. Type the number from Health Connect.");
        setRunning(false);
        return;
      }
      handle = onMotion;
      window.addEventListener("devicemotion", onMotion);
    }

    void start();
    return () => {
      if (handle) window.removeEventListener("devicemotion", handle);
    };
  }, [running]);

  function submit(total: number) {
    if (!Number.isFinite(total) || total < 0) return;
    logSteps(total);
    setDraft("");
    liveRef.current = 0;
    setLive(0);
    setRunning(false);
  }

  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-semibold">Steps</h2>
      <p className="mt-1 text-sm text-muted">
        {isAndroid()
          ? "Garmin / Pixel / Samsung → Health Connect → Forge. Sync from Settings when the bridge posts data."
          : "Type today’s steps, import a file in Settings, or count while this screen stays open."}
      </p>
      {healthSync.linked && healthSync.lastSyncedAt ? (
        <p className="mt-1 text-xs text-success">
          Health synced · {new Date(healthSync.lastSyncedAt).toLocaleString()}
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted">Not synced from Health Connect yet — manual still counts.</p>
      )}
      <div className="forge-neon-frame mt-3 rounded-[1.75rem] bg-surface p-4 shadow-[var(--shadow-border)]">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-muted">Today</p>
            <p className="mt-1 font-display text-3xl font-extrabold tabular-nums">
              {shown.toLocaleString()}
            </p>
            {kcal != null ? (
              <p className="mt-1 text-xs text-muted">~{kcal} kcal</p>
            ) : shown > 0 ? (
              <p className="mt-1 text-xs text-muted">Add weight and height in Settings for calories.</p>
            ) : today ? (
              <p className="mt-1 text-xs text-muted">{format(today.at, "EEE d MMM")}</p>
            ) : (
              <p className="mt-1 text-sm text-muted">No steps yet.</p>
            )}
          </div>
          <Footprints className="size-8 text-accent" />
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-muted">{pct}% of 10,000</p>
        {hint ? <p className="mt-2 text-xs text-accent">{hint}</p> : null}
        <div className="mt-4 flex gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            step="1"
            placeholder="8432"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Steps today"
          />
          <Button type="button" variant="secondary" onClick={() => submit(Number(draft) || shown)}>
            Log
          </Button>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {isAndroid() ? (
            <>
              <Button type="button" className="w-full" onClick={() => openGarminConnect()}>
                Open Garmin Connect
              </Button>
              <Button type="button" variant="secondary" className="w-full" onClick={() => openHealthConnect()}>
                Open Health Connect
              </Button>
              <p className="text-xs leading-relaxed text-muted">
                In Garmin: More → Settings → Health Connect → turn on Write for steps (and sleep if you want).
                Then log the number here until the native wrapper can pull it automatically.
              </p>
            </>
          ) : null}
          <Button
            type="button"
            variant={running ? "default" : "secondary"}
            className="w-full"
            onClick={() => {
              if (running) {
                submit((today?.steps ?? 0) + liveRef.current);
                return;
              }
              liveRef.current = 0;
              setLive(0);
              setRunning(true);
            }}
          >
            {running ? `Stop · ${live} live` : "Count on this phone"}
          </Button>
        </div>
        {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
      </div>
    </section>
  );
}

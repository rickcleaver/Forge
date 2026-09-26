import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import {
  describeHealthCapability,
  getNativeHealthStatus,
  healthFromBridge,
  isAndroid,
  openGarminConnect,
  openHealthConnect,
  parseHealthImport,
  syncHealthConnectNative,
} from "@/lib/health-connect";
import { isCapacitorNative, type ForgeHealthNativeInfo } from "@/lib/forge-health-plugin";
import { useGym } from "@/lib/store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function HealthConnectCard() {
  const healthSync = useGym((s) => s.healthSync);
  const applyHealthSnapshot = useGym((s) => s.applyHealthSnapshot);
  const setHealthSyncError = useGym((s) => s.setHealthSyncError);
  const stepLogs = useGym((s) => s.stepLogs);
  const weighIns = useGym((s) => s.weighIns);
  const fileRef = useRef<HTMLInputElement>(null);
  const [draftSteps, setDraftSteps] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nativeInfo, setNativeInfo] = useState<ForgeHealthNativeInfo | null>(null);
  const nativeShell = isCapacitorNative();

  const todaySteps = [...stepLogs].reverse().find((s) => {
    const d = new Date(s.at);
    const n = new Date();
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  });
  const latestWeight = [...weighIns].sort((a, b) => b.at - a.at)[0];

  useEffect(() => {
    function ingest(data: unknown, label: string) {
      const snap = healthFromBridge(data);
      if (!snap) return;
      const res = applyHealthSnapshot(snap, "bridge");
      if (res.ok) setHint(`${label}: metrics saved to Forge.`);
    }
    function onMsg(e: MessageEvent) {
      ingest(e.data, "Bridge");
    }
    (window as Window & { forgeApplyHealth?: (data: unknown) => void }).forgeApplyHealth = (data) =>
      ingest(data, "Native");
    window.addEventListener("message", onMsg);
    return () => {
      window.removeEventListener("message", onMsg);
      delete (window as Window & { forgeApplyHealth?: (data: unknown) => void }).forgeApplyHealth;
    };
  }, [applyHealthSnapshot]);

  useEffect(() => {
    if (!nativeShell) return;
    let cancelled = false;
    void getNativeHealthStatus().then((info) => {
      if (!cancelled) setNativeInfo(info);
    });
    return () => {
      cancelled = true;
    };
  }, [nativeShell]);

  async function onFile(file: File | null) {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseHealthImport(text);
      if (!parsed.ok) {
        setHealthSyncError(parsed.error);
        setHint(parsed.error);
        return;
      }
      const res = applyHealthSnapshot(parsed.snap, "import");
      setHint(res.ok ? `Imported from ${file.name}.` : res.error ?? "Import failed.");
    } catch {
      setHealthSyncError("Could not read that file.");
      setHint("Could not read that file.");
    }
  }

  function syncManual() {
    const steps = Number(draftSteps);
    if (!Number.isFinite(steps) || steps < 0) {
      setHint("Type today’s steps from Health Connect or Garmin.");
      return;
    }
    const res = applyHealthSnapshot({ steps: Math.round(steps), source: "manual" }, "manual");
    if (res.ok) {
      setDraftSteps("");
      setHint("Steps saved. That’s a real sync — not a fake connected badge.");
    }
  }

  async function syncNativeHc() {
    setBusy(true);
    setHint(null);
    try {
      const result = await syncHealthConnectNative();
      if (!result.ok) {
        setHealthSyncError(result.error);
        setHint(result.error);
        const status = await getNativeHealthStatus();
        setNativeInfo(status);
        return;
      }
      setNativeInfo(result.status);
      // Apply from the returned snapshot so linked flips only on real ingest.
      // Native also posts forgeApplyHealth; store replace-same-day is idempotent.
      const res = applyHealthSnapshot(result.snap, "bridge");
      if (res.ok) {
        const parts: string[] = [];
        if (result.snap.steps != null) parts.push(`${result.snap.steps.toLocaleString()} steps`);
        if (result.snap.weightLb != null) parts.push(`${result.snap.weightLb} lb`);
        if (result.snap.sleepHrs != null) parts.push(`${result.snap.sleepHrs}h sleep`);
        setHint(`Health Connect: ${parts.join(" · ") || "metrics"} saved.`);
      } else {
        setHint(res.error ?? "Could not save Health Connect metrics.");
      }
    } finally {
      setBusy(false);
    }
  }

  // Honest: only after successful ingest into the store — never from permission grant alone.
  const linked = healthSync.linked && healthSync.lastSyncedAt != null;

  return (
    <section className="forge-neon-frame relative overflow-hidden rounded-3xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <span className="forge-blob forge-blob--c opacity-30" />
      <div className="relative z-[1]">
        <p className="font-mono text-[10px] tracking-wider text-accent uppercase">Health sync</p>
        <h3 className="mt-1 font-display text-lg font-semibold">Steps · weight · sleep</h3>
        <p className="mt-1 text-sm text-muted">{describeHealthCapability(nativeInfo)}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 font-mono text-[10px] font-bold tracking-wider uppercase ${
              linked ? "bg-success/20 text-success" : "bg-well text-muted"
            }`}
          >
            {linked ? "Synced" : "Not synced yet"}
          </span>
          {nativeShell ? (
            <span className="rounded-full bg-well px-3 py-1 font-mono text-[10px] tracking-wider text-muted uppercase">
              {nativeInfo?.permissionsGranted
                ? "HC permitted"
                : nativeInfo?.available
                  ? "HC installed"
                  : nativeInfo?.sdkStatus === "update_required"
                    ? "HC update needed"
                    : "Native shell"}
            </span>
          ) : null}
          {healthSync.lastSyncedAt ? (
            <span className="text-xs text-muted">
              Last {format(healthSync.lastSyncedAt, "MMM d · h:mm a")}
              {healthSync.lastSource ? ` · ${healthSync.lastSource}` : ""}
            </span>
          ) : null}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-bg/60 px-3 py-3">
            <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Today steps</p>
            <p className="font-display text-2xl font-bold tabular-nums">
              {(todaySteps?.steps ?? healthSync.lastSteps ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl bg-bg/60 px-3 py-3">
            <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Weight</p>
            <p className="font-display text-2xl font-bold tabular-nums">
              {latestWeight?.lb != null
                ? Math.round(latestWeight.lb)
                : healthSync.lastWeightLb != null
                  ? Math.round(healthSync.lastWeightLb)
                  : "—"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {nativeShell ? (
            <Button type="button" disabled={busy} onClick={() => void syncNativeHc()}>
              {busy
                ? "Syncing…"
                : nativeInfo?.permissionsGranted
                  ? "Sync from HC"
                  : "Connect & sync"}
            </Button>
          ) : null}
          <Button type="button" variant="secondary" onClick={() => openHealthConnect()}>
            {isAndroid() || nativeShell ? "Open Health Connect" : "Get Health Connect"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => openGarminConnect()}>
            Garmin
          </Button>
          <Button type="button" onClick={() => fileRef.current?.click()}>
            Import file
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.csv,text/csv,application/json"
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="mt-3 flex gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Paste steps from HC"
            value={draftSteps}
            onChange={(e) => setDraftSteps(e.target.value)}
            aria-label="Steps from Health Connect"
          />
          <Button type="button" onClick={syncManual}>
            Sync
          </Button>
        </div>

        {healthSync.lastError ? <p className="mt-2 text-xs text-danger">{healthSync.lastError}</p> : null}
        {hint ? <p className="mt-2 text-xs text-accent">{hint}</p> : null}
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          Tip: JSON like {"{"}"steps":8432,"weightLb":165{"}"} or CSV with steps/weight columns. Native apps post{" "}
          <span className="font-mono">forgeApplyHealth</span>. “Synced” only after real metrics land in your log.
        </p>
      </div>
    </section>
  );
}

import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, ExternalLink, Moon, Settings, Sun, Upload } from "lucide-react";
import { useGym } from "@/lib/store";
import { INTENSITY_LABEL, openMyFitnessPal } from "@/lib/mfp";
import { cmToDisplay, displayToCm } from "@/lib/calories";
import { backupStatus, buildBackup, downloadBackup, parseBackup } from "@/lib/backup";
import { ForgeSyncCard } from "@/components/forge-sync-card";
import { HealthConnectCard } from "@/components/health-connect-card";
import { downloadSessionsCsv } from "@/lib/export-csv";
import { parseWorkoutCsv } from "@/lib/import-csv";
import type { Intensity } from "@/lib/types";
import { THEMES } from "@/lib/themes";
import { TEMPLATES } from "@/lib/exercises";
import { WEEK_DAYS_MON_FIRST } from "@/lib/week-plan";
import { Button } from "./ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "./ui/drawer";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";

const REST_OPTIONS = [30, 45, 60, 90, 120, 150, 180];
const INTENSITY_OPTIONS: Intensity[] = ["light", "moderate", "hard"];
const LB_TO_KG = 0.453592;

function parseNum(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function SettingsDrawer() {
  const settings = useGym((s) => s.settings);
  const sessions = useGym((s) => s.sessions);
  const weighIns = useGym((s) => s.weighIns);
  const stepLogs = useGym((s) => s.stepLogs);
  const progressPhotos = useGym((s) => s.progressPhotos);
  const programs = useGym((s) => s.programs);
  const lastBackupAt = useGym((s) => s.lastBackupAt);
  const sessionsAtLastBackup = useGym((s) => s.sessionsAtLastBackup);
  const markBackedUp = useGym((s) => s.markBackedUp);
  const setUnit = useGym((s) => s.setUnit);
  const setDefaultRest = useGym((s) => s.setDefaultRest);
  const setAutoStartRest = useGym((s) => s.setAutoStartRest);
  const setHapticRest = useGym((s) => s.setHapticRest);
  const setDayPlan = useGym((s) => s.setDayPlan);
  const setBodyWeightLb = useGym((s) => s.setBodyWeightLb);
  const setHeightCm = useGym((s) => s.setHeightCm);
  const setCalorieGoal = useGym((s) => s.setCalorieGoal);
  const setProteinGoal = useGym((s) => s.setProteinGoal);
  const setDefaultIntensity = useGym((s) => s.setDefaultIntensity);
  const setTheme = useGym((s) => s.setTheme);
  const setColorMode = useGym((s) => s.setColorMode);
  const setMorningGate = useGym((s) => s.setMorningGate);
  const importBackup = useGym((s) => s.importBackup);
  const importHistorySessions = useGym((s) => s.importHistorySessions);
  const fileRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const { stale: backupIsStale, daysSince: daysSinceBackup, newSessions: newSessionsSinceBackup } =
    backupStatus(sessions.length, lastBackupAt, sessionsAtLastBackup);

  const weightDisplay =
    settings.bodyWeightLb == null
      ? ""
      : settings.unit === "kg"
        ? String(Math.round(settings.bodyWeightLb * LB_TO_KG * 10) / 10)
        : String(Math.round(settings.bodyWeightLb * 10) / 10);
  const heightDisplay =
    settings.heightCm == null
      ? ""
      : String(cmToDisplay(settings.heightCm, settings.unit));
  const heightUnit = settings.unit === "kg" ? "cm" : "in";

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Settings"
        className="relative z-20"
        onClick={() => setOpen(true)}
      >
        <Settings className="size-5" />
      </Button>
      {open ? (
        <Drawer open onOpenChange={setOpen}>
          <DrawerContent>
        <div className="flex max-h-[80dvh] flex-col gap-6 overflow-y-auto px-5 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div>
            <DrawerTitle>Settings</DrawerTitle>
            <DrawerDescription>Backup, look, units, rest, MyFitnessPal.</DrawerDescription>
          </div>
          <button
            type="button"
            className="rounded-xl bg-surface px-4 py-3 text-left text-sm shadow-[var(--shadow-border)]"
            onClick={() => {
              try {
                window.localStorage.removeItem("forge-tour-done");
              } catch {
                /* ignore */
              }
              setOpen(false);
              window.location.assign("/");
            }}
          >
            Replay tutorial
          </button>
          <p className="rounded-xl bg-surface px-4 py-3 text-sm text-muted shadow-[var(--shadow-border)]">
            Offline: open Forge once on wifi. After that, log sets with no service — they stay on this phone. Coach AI and Spotter need a signal.
          </p>

          <section className="flex flex-col gap-2">
            <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Look</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: "dark" as const, label: "Dark", blurb: "Arcade night", Icon: Moon },
                { id: "light" as const, label: "Light", blurb: "Daylight clear", Icon: Sun },
              ]).map((m) => {
                const on = (settings.colorMode ?? "dark") === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setColorMode(m.id)}
                    className="flex items-center gap-3 rounded-xl bg-surface px-3 py-3 text-left shadow-[var(--shadow-border)]"
                    style={on ? { boxShadow: "0 0 0 2px var(--color-accent)" } : undefined}
                    aria-pressed={on}
                  >
                    <m.Icon className="size-5 shrink-0 text-accent" />
                    <span>
                      <span className="block text-sm font-medium">{m.label}</span>
                      <span className="block text-[11px] text-muted">{m.blurb}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((t) => {
                const on = (settings.theme ?? "neon") === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className="rounded-xl bg-surface px-3 py-3 text-left shadow-[var(--shadow-border)]"
                    style={on ? { boxShadow: `0 0 0 2px ${t.swatch}` } : undefined}
                    aria-pressed={on}
                  >
                    <span
                      className="mb-2 block size-5 rounded-full"
                      style={{ background: t.swatch }}
                    />
                    <span className="block text-sm font-medium">{t.name}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted">{t.blurb}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Backup</p>
            <p className="text-sm text-muted">
              Your log lives on this phone. Export a file, keep it somewhere safe, import to restore.
            </p>
            {backupIsStale ? (
              <p className="rounded-md bg-accent/15 px-3 py-2 text-xs text-accent">
                {lastBackupAt == null
                  ? "You haven't exported a backup yet."
                  : `It's been ${daysSinceBackup} day${daysSinceBackup === 1 ? "" : "s"} and ${newSessionsSinceBackup} session${newSessionsSinceBackup === 1 ? "" : "s"} since your last backup.`}{" "}
                Worth exporting now.
              </p>
            ) : null}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  downloadBackup(buildBackup({ sessions, settings, weighIns, stepLogs, progressPhotos, programs }));
                  markBackedUp();
                  setBackupMsg("Backup downloaded.");
                }}
              >
                <Download className="size-4" />
                Export
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  downloadSessionsCsv(sessions);
                  setBackupMsg("CSV downloaded.");
                }}
              >
                <Download className="size-4" />
                CSV
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-4" />
                Import
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                try {
                  const text = await file.text();
                  const { added } = importBackup(parseBackup(text));
                  setBackupMsg(added ? `Imported ${added} session${added === 1 ? "" : "s"}.` : "Nothing new to import.");
                } catch {
                  setBackupMsg("Could not read that file.");
                }
              }}
            />
            {backupMsg ? <p className="text-xs text-muted">{backupMsg}</p> : null}
          </section>

                    <section className="flex flex-col gap-2">
            <ForgeSyncCard />
          </section>

          <section className="flex flex-col gap-2">
            <HealthConnectCard />
          </section>

<section className="flex flex-col gap-2">
            <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Switch from Strong / Hevy</p>
            <p className="text-sm text-muted">
              Export a workout CSV in that app, then pick it here. Forge skips days you already have.
            </p>
            <Button type="button" variant="secondary" onClick={() => csvRef.current?.click()}>
              <Upload className="size-4" />
              Import CSV
            </Button>
            <input
              ref={csvRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                try {
                  const text = await file.text();
                  const sessions = parseWorkoutCsv(text);
                  const { added } = importHistorySessions(sessions);
                  setBackupMsg(
                    added
                      ? `Imported ${added} workout${added === 1 ? "" : "s"} from ${file.name}.`
                      : "Nothing new in that CSV.",
                  );
                } catch {
                  setBackupMsg("Could not read that CSV. Use Strong or Hevy workout export.");
                }
              }}
            />
          </section>

          <section className="flex flex-col gap-2">
            <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Weight unit</p>
            <div className="flex rounded-md bg-bg p-1">
              {(["lb", "kg"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={
                    settings.unit === u
                      ? "h-10 flex-1 rounded-sm bg-accent font-mono text-sm text-accent-fg"
                      : "h-10 flex-1 rounded-sm font-mono text-sm text-muted"
                  }
                >
                  {u}
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Default rest</p>
            <div className="flex flex-wrap gap-2">
              {REST_OPTIONS.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setDefaultRest(sec)}
                  className={
                    settings.defaultRestSec === sec
                      ? "h-9 rounded-full bg-accent px-3 font-mono text-xs text-accent-fg"
                      : "h-9 rounded-full bg-surface-2 px-3 font-mono text-xs text-muted"
                  }
                >
                  {sec}s
                </button>
              ))}
            </div>
          </section>

          <section className="flex items-center justify-between gap-4 rounded-lg bg-surface-2 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Start rest after a set</p>
              <p className="text-xs text-muted">Timer begins when you check a working set complete.</p>
            </div>
            <Switch
              checked={settings.autoStartRest}
              onCheckedChange={setAutoStartRest}
              aria-label="Auto start rest timer"
            />
          </section>

          <section className="flex items-center justify-between gap-4 rounded-lg bg-surface-2 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Buzz when rest is done</p>
              <p className="text-xs text-muted">Vibrate even if the phone is in your pocket.</p>
            </div>
            <Switch
              checked={settings.hapticRest !== false}
              onCheckedChange={setHapticRest}
              aria-label="Vibrate when rest ends"
            />
          </section>

          <section className="flex items-center justify-between gap-4 rounded-lg bg-surface-2 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Morning check-in</p>
              <p className="text-xs text-muted">Sleep and readiness before Home. Off anytime here.</p>
            </div>
            <Switch
              checked={settings.morningGate !== false}
              onCheckedChange={setMorningGate}
              aria-label="Morning check-in screen"
            />
          </section>

          <section className="flex flex-col gap-2">
            <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Week</p>
            <p className="text-sm text-muted">Today will show what’s planned. Leave a day blank if you don’t want a nudge.</p>
            <ul className="flex flex-col gap-2">
              {WEEK_DAYS_MON_FIRST.map((d) => {
                const plan = settings.weekPlan?.[d.i] ?? { rest: false, templateId: null, programId: null };
                const value = plan.rest
                  ? "rest"
                  : plan.programId
                    ? `p:${plan.programId}`
                    : plan.templateId
                      ? `t:${plan.templateId}`
                      : "";
                return (
                  <li key={d.i} className="flex items-center gap-3">
                    <span className="w-10 font-mono text-xs text-muted">{d.short}</span>
                    <select
                      className="h-10 min-w-0 flex-1 rounded-md bg-bg px-3 font-sans text-sm text-fg"
                      value={value}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "rest") setDayPlan(d.i, { rest: true, templateId: null, programId: null });
                        else if (v.startsWith("p:"))
                          setDayPlan(d.i, { rest: false, templateId: null, programId: v.slice(2) });
                        else if (v.startsWith("t:"))
                          setDayPlan(d.i, { rest: false, templateId: v.slice(2), programId: null });
                        else setDayPlan(d.i, { rest: false, templateId: null, programId: null });
                      }}
                    >
                      <option value="">None</option>
                      <option value="rest">Rest</option>
                      {TEMPLATES.filter((t) => t.id !== "empty").map((t) => (
                        <option key={t.id} value={`t:${t.id}`}>
                          {t.name}
                        </option>
                      ))}
                      {programs.map((p) => (
                        <option key={p.id} value={`p:${p.id}`}>
                          {p.dayLabel ? `${p.packName ? p.packName + " · " : ""}${p.dayLabel}` : p.name}
                        </option>
                      ))}
                    </select>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <p className="font-mono text-[10px] tracking-wider text-muted uppercase">MyFitnessPal</p>
            <p className="text-sm text-muted">
              MFP does not let new apps log you in. Forge estimates the session's calories, copies it,
              and opens MFP so you can paste it into Exercise. This is always a rough estimate from
              duration, body weight, and effort — not a measurement.
            </p>
            <div>
              <p className="mb-1.5 font-mono text-[10px] tracking-wider text-muted uppercase">
                Typical effort
              </p>
              <div className="flex rounded-md bg-bg p-1">
                {INTENSITY_OPTIONS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setDefaultIntensity(i)}
                    className={
                      settings.defaultIntensity === i
                        ? "h-9 flex-1 rounded-sm bg-accent font-mono text-xs text-accent-fg"
                        : "h-9 flex-1 rounded-sm font-mono text-xs text-muted"
                    }
                  >
                    {INTENSITY_LABEL[i]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] tracking-wider text-muted uppercase">
                  Body weight ({settings.unit})
                </span>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.1"
                  placeholder={settings.unit === "kg" ? "82" : "180"}
                  value={weightDisplay}
                  onChange={(e) => {
                    const n = parseNum(e.target.value);
                    if (n == null) {
                      setBodyWeightLb(null);
                      return;
                    }
                    setBodyWeightLb(settings.unit === "kg" ? n / LB_TO_KG : n);
                  }}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] tracking-wider text-muted uppercase">
                  Height ({heightUnit})
                </span>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.1"
                  placeholder={settings.unit === "kg" ? "178" : "70"}
                  value={heightDisplay}
                  onChange={(e) => {
                    const n = parseNum(e.target.value);
                    if (n == null) {
                      setHeightCm(null);
                      return;
                    }
                    setHeightCm(displayToCm(n, settings.unit));
                  }}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] tracking-wider text-muted uppercase">Calorie goal</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="2400"
                  value={settings.calorieGoal ?? ""}
                  onChange={(e) => setCalorieGoal(parseNum(e.target.value))}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] tracking-wider text-muted uppercase">Protein goal g</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="180"
                  value={settings.proteinGoal ?? ""}
                  onChange={(e) => setProteinGoal(parseNum(e.target.value))}
                />
              </label>
            </div>
            <Button type="button" variant="secondary" onClick={() => openMyFitnessPal("home")}>
              <ExternalLink className="size-4" />
              Open MyFitnessPal
            </Button>
          </section>

          <section className="flex flex-col gap-2">
            <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Legal</p>
            <Link to="/privacy" className="text-sm text-accent">
              Privacy policy
            </Link>
          </section>
        </div>
          </DrawerContent>
        </Drawer>
      ) : null}
    </>
  );
}

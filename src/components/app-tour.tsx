import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useGym } from "@/lib/store";
import { checkinDoneToday } from "@/lib/checkin";
import { Button } from "./ui/button";

const KEY = "forge-tour-done";

type Step = {
  to: "/" | "/session" | "/progress" | "/coach" | "/history" | "/spotter";
  title: string;
  points: string[];
};

const STEPS: Step[] = [
  {
    to: "/",
    title: "Home",
    points: ["Front door. Start here. An open session shows as a card — tap it or Discard."],
  },
  {
    to: "/",
    title: "Check-in",
    points: ["Sleep and feel feed readiness. Skip anytime. Off in Settings if you want."],
  },
  {
    to: "/",
    title: "Start",
    points: ["Start builds today. Scan, repeat, and templates sit under the small disclosure."],
  },
  {
    to: "/session",
    title: "Train",
    points: ["Weight, reps, Done. Rest starts after a set. Finish saves it to the Log."],
  },
  {
    to: "/session",
    title: "Programs",
    points: ["Named days live here when nothing is in progress. Tap a day to start it."],
  },
  {
    to: "/progress",
    title: "Progress",
    points: ["PRs and weekly volume. After you lift, not during."],
  },
  {
    to: "/coach",
    title: "Coach",
    points: ["Blue card is Spotter. Ask the log underneath is the in-app coach."],
  },
  {
    to: "/spotter",
    title: "Spotter",
    points: ["Coach shares a 6-letter code. Tap a client for their week. Athletes just train."],
  },
  {
    to: "/history",
    title: "Log",
    points: ["Finished sessions land here. Open a day to edit or repeat it."],
  },
  {
    to: "/",
    title: "Settings",
    points: ["Gear on Home: units, rest, theme, backup. Replay this tour from there."],
  },
];

function tourDone(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

function markDone() {
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    /* ignore */
  }
}

export function AppTour({ ready }: { ready: boolean }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);
  const gateOn = useGym((s) => s.settings.morningGate !== false);
  const readiness = useGym((s) => s.readinessLogs);
  const [checkinOk, setCheckinOk] = useState(() => !gateOn || checkinDoneToday(readiness));

  useEffect(() => {
    const sync = () => setCheckinOk(!gateOn || checkinDoneToday(useGym.getState().readinessLogs));
    sync();
    window.addEventListener("forge-checkin-done", sync);
    return () => window.removeEventListener("forge-checkin-done", sync);
  }, [gateOn, readiness]);

  useEffect(() => {
    if (!ready || !checkinOk) return;
    if (tourDone()) return;
    const t = window.setTimeout(() => setOpen(true), 500);
    return () => window.clearTimeout(t);
  }, [ready, checkinOk]);

  useEffect(() => {
    if (!open) return;
    const target = STEPS[step]?.to;
    if (target && pathname !== target) void navigate({ to: target });
  }, [open, step, pathname, navigate]);

  if (!open) return null;
  const cur = STEPS[step];
  if (!cur) return null;

  function skip() {
    markDone();
    setOpen(false);
    void navigate({ to: "/" });
  }

  function next() {
    if (step >= STEPS.length - 1) {
      skip();
      return;
    }
    setStep((n) => n + 1);
  }

  const last = step === STEPS.length - 1;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-lg rounded-2xl bg-surface p-4 text-fg shadow-[var(--shadow-lift)] ring-2 ring-accent">
        <p className="text-xs font-semibold text-muted">
          Tour {step + 1} / {STEPS.length}
        </p>
        <h2 className="mt-1 font-display text-xl font-extrabold">{cur.title}</h2>
        <ul className="mt-2 text-sm text-muted">
          {cur.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <Button className="flex-1" variant="secondary" onClick={skip}>
            Skip tutorial
          </Button>
          <Button className="flex-1" onClick={next}>
            {last ? "Done" : "Next"}
          </Button>
        </div>
        {step > 0 ? (
          <button type="button" className="mt-2 w-full py-2 text-xs text-muted" onClick={() => setStep((n) => n - 1)}>
            Back
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function resetTour() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  addBuddy,
  getCircles,
  markNudged,
  removeBuddy,
  setCirclesPrompts,
  shareCircleLink,
  type CirclesState,
} from "@/lib/circles";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function CirclesCard() {
  const [state, setState] = useState<CirclesState | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setState(getCircles());
    try {
      const q = new URLSearchParams(window.location.search).get("circle");
      if (q) {
        setState(addBuddy(q));
        setMsg(`Added buddy ${q.toUpperCase()}.`);
        const url = new URL(window.location.href);
        url.searchParams.delete("circle");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      }
    } catch {
      /* ignore */
    }
  }, []);

  if (!state) return null;

  return (
    <section className="mt-8 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Circles</p>
      <h2 className="mt-1 font-display text-lg font-semibold">Opt-in accountability</h2>
      <p className="mt-1 text-sm text-muted">
        Not a feed. Share a code with one training buddy. Optional nudges stay on this phone.
      </p>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-bg px-3 py-3">
        <div>
          <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Your code</p>
          <p className="font-display text-2xl font-bold tracking-wide">{state.myCode}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={async () => {
            const link = shareCircleLink(state.myCode);
            try {
              await navigator.clipboard.writeText(link);
              setMsg("Share link copied.");
            } catch {
              setMsg(link);
            }
          }}
        >
          Copy link
        </Button>
      </div>
      <div className="mt-3 flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Buddy code"
          className="flex-1"
        />
        <Button
          type="button"
          onClick={() => {
            setState(addBuddy(code));
            setCode("");
            setMsg("Buddy saved locally.");
          }}
        >
          Add
        </Button>
      </div>
      <label className="mt-3 flex items-center justify-between gap-3 text-sm">
        <span>Occasional “did you lift?” prompts</span>
        <input
          type="checkbox"
          checked={state.promptsOn}
          onChange={(e) => setState(setCirclesPrompts(e.target.checked))}
          className="size-5 accent-[var(--color-accent)]"
        />
      </label>
      {state.buddies.length ? (
        <ul className="mt-3 flex flex-col gap-2">
          {state.buddies.map((b) => (
            <li key={b.id} className="flex items-center justify-between rounded-xl bg-bg px-3 py-2">
              <div>
                <p className="font-medium">{b.label}</p>
                <p className="font-mono text-[10px] text-muted">{b.code}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="font-mono text-[10px] tracking-wider text-accent uppercase"
                  onClick={() => {
                    setState(markNudged(b.id));
                    setMsg(`Nudge noted for ${b.label}. Tell them in your usual chat.`);
                  }}
                >
                  Nudge
                </button>
                <button
                  type="button"
                  className="font-mono text-[10px] tracking-wider text-muted uppercase"
                  onClick={() => setState(removeBuddy(b.id))}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">No buddies yet. Spotter remains the coach path.</p>
      )}
      <p className="mt-2 text-xs text-muted">
        Want a coach in the loop? <Link to="/spotter" className="text-accent">Open Spotter</Link>.
      </p>
      {msg ? <p className="mt-2 text-xs text-accent">{msg}</p> : null}
    </section>
  );
}

import { useEffect, useRef, useState } from "react";
import { markSplashDone, quoteForDay, splashCast } from "@/lib/splash";
import { ForgeCharacter } from "./forge-character";

const HOLD_MS = 2200;
const FADE_MS = 380;

export function PowerSplash({ onDone }: { onDone: () => void }) {
  const [fade, setFade] = useState(false);
  const quote = quoteForDay();
  const cast = splashCast();
  const doneRef = useRef(onDone);
  const finished = useRef(false);
  doneRef.current = onDone;

  function finish() {
    if (finished.current) return;
    finished.current = true;
    markSplashDone();
    doneRef.current();
  }

  function skip() {
    if (finished.current) return;
    setFade(true);
    window.setTimeout(finish, FADE_MS);
  }

  useEffect(() => {
    const fadeAt = window.setTimeout(() => setFade(true), HOLD_MS);
    const doneAt = window.setTimeout(finish, HOLD_MS + FADE_MS);
    return () => {
      window.clearTimeout(fadeAt);
      window.clearTimeout(doneAt);
    };
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Forge loading — tap to skip"
      onClick={skip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          skip();
        }
      }}
      className={`fixed inset-0 z-[90] flex cursor-pointer flex-col overflow-hidden bg-bg transition-opacity duration-300 ${
        fade ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/35 blur-3xl" />
        <div className="absolute top-1/3 -left-16 h-56 w-56 rounded-full bg-candy-2/30 blur-3xl" />
        <div className="absolute right-0 bottom-24 h-64 w-64 rounded-full bg-candy-3/25 blur-3xl" />
        <span className="forge-blob forge-blob--a opacity-70" />
        <span className="forge-blob forge-blob--b opacity-60" />
        <span className="forge-blob forge-blob--c opacity-50" />
      </div>

      <div className="relative z-[1] flex flex-1 flex-col items-center justify-center px-6 pt-10">
        <p className="font-mono text-[10px] tracking-[0.28em] text-accent uppercase">Forge · teen gym log</p>
        <div className="relative mt-4 w-full max-w-xs">
          <ForgeCharacter
            kind={cast}
            size="hero"
            motion="float"
            blobs
            className="mx-auto w-full"
            alt=""
          />
        </div>
        <p className="mt-2 font-display text-6xl font-extrabold tracking-tight text-fg drop-shadow-[0_0_28px_color-mix(in_srgb,var(--color-accent)_55%,transparent)]">
          FORGE
        </p>
        <p className="mt-3 max-w-sm text-center text-lg font-semibold leading-snug text-fg/95">{quote}</p>
        <p className="mt-6 font-mono text-[10px] tracking-wider text-muted uppercase">Tap anywhere to skip</p>
      </div>

      <div className="relative z-[1] px-8 pb-10">
        <div className="mx-auto h-1.5 max-w-xs overflow-hidden rounded-full bg-well">
          <div className="forge-splash-bar h-full rounded-full bg-gradient-to-r from-accent via-candy-2 to-candy-3" />
        </div>
      </div>
    </div>
  );
}

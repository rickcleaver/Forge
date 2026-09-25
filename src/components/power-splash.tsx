import { useEffect, useRef, useState } from "react";
import { markSplashDone, quoteForDay, splashImage } from "@/lib/splash";

export function PowerSplash({ onDone }: { onDone: () => void }) {
  const [fade, setFade] = useState(false);
  const quote = quoteForDay();
  const src = splashImage();
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const fadeAt = window.setTimeout(() => setFade(true), 2600);
    const doneAt = window.setTimeout(() => {
      markSplashDone();
      doneRef.current();
    }, 3000);
    return () => {
      window.clearTimeout(fadeAt);
      window.clearTimeout(doneAt);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[90] flex flex-col bg-bg transition-opacity duration-500 ${
        fade ? "opacity-0" : "opacity-100"
      }`}
    >
      <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/55 to-bg/20" />
      <div className="relative mt-auto px-8 pb-20">
        <p className="font-display text-5xl font-extrabold tracking-tight">FORGE</p>
        <p className="mt-3 max-w-sm text-lg font-medium leading-snug">{quote}</p>
      </div>
    </div>
  );
}

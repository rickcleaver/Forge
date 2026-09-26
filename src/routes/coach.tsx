import { createFileRoute, Link } from "@tanstack/react-router";
import { CoachPanel } from "@/components/coach-panel";
import { PhysiqueCheckin } from "@/components/physique-checkin";

export const Route = createFileRoute("/coach")({ component: CoachPage });

function CoachPage() {
  return (
    <main className="px-4 pt-4 pb-4">
      <h1 className="font-display text-3xl font-extrabold tracking-tight forge-page-title">Coach</h1>
      <p className="mt-1 text-sm text-muted">Ask anything training. Scroll up for the thread. Not a doctor — just your neon hype + advice.</p>
      <div className="mt-4">
        <CoachPanel />
      </div>
      <Link
        to="/spotter"
        className="mt-6 flex items-center justify-between rounded-2xl bg-accent px-5 py-5 text-accent-fg shadow-[var(--shadow-glow)]"
      >
        <span>
          <span className="block text-sm font-semibold opacity-80">Real coach?</span>
          <span className="mt-1 block font-display text-xl font-extrabold">Forge Spotter</span>
          <span className="mt-1 block text-sm opacity-80">Share the week. Get a program back.</span>
        </span>
      </Link>
      <PhysiqueCheckin />
    </main>
  );
}

import { useEffect, useState } from "react";
import { renderRecapCard, shareRecap } from "@/lib/recap-card";
import { sessionPrNames } from "@/lib/stats";
import { useGym } from "@/lib/store";
import type { Session } from "@/lib/types";
import { Button } from "./ui/button";

export function RecapScreen({ session, onDone }: { session: Session; onDone: () => void }) {
  const unit = useGym((s) => s.settings.unit);
  const sessions = useGym((s) => s.sessions);
  const prs = sessionPrNames(session, sessions);
  const prKey = prs.join("|");
  const [url, setUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);

  useEffect(() => {
    let alive = true;
    let created: string | null = null;
    void renderRecapCard(session, unit, prs).then((out) => {
      if (!alive) {
        URL.revokeObjectURL(out.url);
        return;
      }
      created = out.url;
      setUrl(out.url);
      setBlob(out.blob);
    });
    return () => {
      alive = false;
      if (created) URL.revokeObjectURL(created);
    };
    // prs identity is covered by prKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, unit, prKey]);

  return (
    <main className="px-4 pt-4">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Session done</h1>
      <p className="mt-2 text-sm text-muted">
        {prs.length
          ? `Moment: new best on ${prs.slice(0, 2).join(", ")}.`
          : "Logged. Forge already used this session to pick next week’s loads."}
      </p>
      {url ? (
        <img
          src={url}
          alt={`${session.name} recap`}
          className="mt-6 w-full rounded-xl shadow-[var(--shadow-lift)]"
        />
      ) : (
        <div className="mt-6 aspect-[1080/1350] w-full animate-pulse rounded-xl bg-surface" />
      )}
      <div className="mt-4 flex flex-col gap-2">
        <Button
          className="w-full"
          disabled={!blob}
          onClick={() => {
            if (blob) void shareRecap(blob, session.name);
          }}
        >
          Share or save
        </Button>
        <Button className="w-full" variant="secondary" onClick={onDone}>
          Back to log
        </Button>
      </div>
    </main>
  );
}

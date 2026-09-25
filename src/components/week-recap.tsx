import { useEffect, useState } from "react";
import { renderWeekCard, shareRecap } from "@/lib/week-card";
import { weekTraining } from "@/lib/stats";
import { useGym } from "@/lib/store";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { realSessions } from "@/lib/demo-sessions";

export function WeekRecapButton() {
  const sessions = realSessions(useGym((s) => s.sessions));
  const unit = useGym((s) => s.settings.unit);
  const week = weekTraining(sessions);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    let created: string | null = null;
    void renderWeekCard(sessions, unit).then((out) => {
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
  }, [open, sessions, unit]);

  if (week.sessions === 0) return null;

  return (
    <>
      <Button type="button" variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        Share this week
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setUrl(null);
            setBlob(null);
          }
        }}
      >
        <DialogContent className="max-h-[88dvh] overflow-y-auto">
          <DialogTitle>Week card</DialogTitle>
          <DialogDescription>Sessions, tonnage, PRs, muscles hit. Save or post it.</DialogDescription>
          {url ? (
            <img src={url} alt="This week on Forge" className="mt-4 w-full rounded-xl" />
          ) : (
            <div className="mt-4 aspect-[1080/1350] w-full animate-pulse rounded-xl bg-surface" />
          )}
          <Button
            className="mt-3 w-full"
            disabled={!blob}
            onClick={() => {
              if (blob) void shareRecap(blob, "this-week");
            }}
          >
            Share or save
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

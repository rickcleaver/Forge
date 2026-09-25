import type { Session } from "./types";

function cell(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function sessionsToCsv(sessions: Session[]): string {
  const header = [
    "date",
    "session",
    "exercise",
    "set",
    "weight",
    "reps",
    "rir",
    "warmup",
    "duration_min",
    "distance",
    "muscles",
    "finished",
  ];
  const rows = [header.join(",")];
  const ordered = [...sessions].sort((a, b) => (a.finishedAt ?? a.startedAt) - (b.finishedAt ?? b.startedAt));
  for (const s of ordered) {
    const when = new Date(s.finishedAt ?? s.startedAt).toISOString().slice(0, 10);
    s.exercises.forEach((ex) => {
      ex.sets.forEach((set, i) => {
        rows.push(
          [
            cell(when),
            cell(s.name),
            cell(ex.name),
            cell(i + 1),
            cell(set.weight),
            cell(set.reps),
            cell(set.rir),
            cell(set.warmup ? "yes" : ""),
            cell(set.durationMin),
            cell(set.distance),
            cell(ex.muscles.join("|")),
            cell(s.finishedAt ? "yes" : ""),
          ].join(","),
        );
      });
    });
  }
  return rows.join("\n");
}

export function downloadSessionsCsv(sessions: Session[]): void {
  const day = new Date().toISOString().slice(0, 10);
  const blob = new Blob([sessionsToCsv(sessions)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `forge-log-${day}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

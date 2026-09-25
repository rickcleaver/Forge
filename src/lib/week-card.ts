import { format, startOfWeek } from "date-fns";
import { MUSCLE_MAP, type MuscleId, type Session } from "./types";
import { muscleHitsThisWeek, weekPrNames, weekTraining } from "./stats";
import { formatVolume } from "./utils";
import { shareRecap } from "./recap-card";

const W = 1080;
const H = 1350;

function cssVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export async function renderWeekCard(
  sessions: Session[],
  unit: "lb" | "kg",
  now = Date.now(),
): Promise<{ blob: Blob; url: string }> {
  try {
    await document.fonts.ready;
  } catch {
    /* ignore */
  }

  const bg = cssVar("--color-bg", "#0c0c0b");
  const fg = cssVar("--color-fg", "#f3f1ea");
  const muted = cssVar("--color-muted", "#8c8a83");
  const accent = cssVar("--color-accent", "#7e9cb4");
  const success = cssVar("--color-success", "#c4a36a");
  const surface = cssVar("--color-surface", "#161614");
  const well = cssVar("--color-well", "#2c3943");

  const week = weekTraining(sessions, now);
  const prs = weekPrNames(sessions, now);
  const hits = muscleHitsThisWeek(sessions, now);
  const muscles = (Object.entries(hits) as [MuscleId, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  const start = startOfWeek(now, { weekStartsOn: 1 });

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas");

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, 8);

  ctx.fillStyle = muted;
  ctx.font = "600 28px 'IBM Plex Mono', ui-monospace, monospace";
  ctx.letterSpacing = "8px";
  ctx.fillText("FORGE", 72, 100);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = fg;
  ctx.font = "700 84px Syne, ui-sans-serif, sans-serif";
  ctx.fillText("This week", 72, 210);

  ctx.fillStyle = muted;
  ctx.font = "500 32px 'IBM Plex Sans', ui-sans-serif, sans-serif";
  ctx.fillText(`${format(start, "MMM d")} – ${format(now, "MMM d")}`, 72, 268);

  const stats = [
    { label: "SESSIONS", value: String(week.sessions) },
    { label: "VOLUME", value: formatVolume(week.volume, unit) },
    { label: "PRs", value: String(prs.length) },
  ];
  stats.forEach((s, i) => {
    const x = 72 + i * 324;
    const y = 330;
    ctx.fillStyle = surface;
    roundRect(ctx, x, y, 300, 160, 20);
    ctx.fill();
    ctx.fillStyle = muted;
    ctx.font = "600 22px 'IBM Plex Mono', ui-monospace, monospace";
    ctx.fillText(s.label, x + 24, y + 48);
    ctx.fillStyle = fg;
    ctx.font = "700 40px Syne, ui-sans-serif, sans-serif";
    ctx.fillText(s.value, x + 24, y + 112);
  });

  ctx.fillStyle = muted;
  ctx.font = "600 24px 'IBM Plex Mono', ui-monospace, monospace";
  ctx.fillText("DAYS", 72, 560);

  week.days.forEach((d, i) => {
    const x = 72 + i * 140;
    ctx.fillStyle = d.trained ? success : well;
    ctx.beginPath();
    ctx.arc(x + 36, 640, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = muted;
    ctx.font = "600 22px 'IBM Plex Mono', ui-monospace, monospace";
    ctx.fillText(format(d.at, "EEEEE"), x + 24, 700);
  });

  let cursor = 780;
  if (prs.length) {
    ctx.fillStyle = success;
    ctx.font = "600 24px 'IBM Plex Mono', ui-monospace, monospace";
    ctx.fillText("PERSONAL RECORDS", 72, cursor);
    cursor += 48;
    ctx.fillStyle = fg;
    ctx.font = "600 36px Syne, ui-sans-serif, sans-serif";
    for (const name of prs.slice(0, 5)) {
      ctx.fillText(`PR  ${name}`, 72, cursor);
      cursor += 48;
    }
    cursor += 16;
  }

  if (muscles.length) {
    ctx.fillStyle = muted;
    ctx.font = "600 24px 'IBM Plex Mono', ui-monospace, monospace";
    ctx.fillText("WORKED", 72, cursor);
    cursor += 36;
    let px = 72;
    ctx.font = "600 26px 'IBM Plex Sans', ui-sans-serif, sans-serif";
    for (const [id] of muscles) {
      const label = MUSCLE_MAP[id]?.short ?? id;
      const tw = ctx.measureText(label).width + 40;
      if (px + tw > W - 72) {
        px = 72;
        cursor += 64;
      }
      ctx.fillStyle = well;
      roundRect(ctx, px, cursor, tw, 52, 26);
      ctx.fill();
      ctx.fillStyle = fg;
      ctx.fillText(label, px + 20, cursor + 35);
      px += tw + 12;
    }
  }

  ctx.fillStyle = muted;
  ctx.font = "500 24px 'IBM Plex Sans', ui-sans-serif, sans-serif";
  ctx.fillText("Logged with Forge", 72, H - 64);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/png");
  });
  return { blob, url: URL.createObjectURL(blob) };
}

export { shareRecap };

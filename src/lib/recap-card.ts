import { format } from "date-fns";
import { MUSCLE_MAP } from "./types";
import { sessionDurationMs, sessionMuscles, sessionSetCount, sessionVolume } from "./stats";
import { formatDuration, formatVolume } from "./utils";
import type { Session } from "./types";

const W = 1080;
const H = 1350;

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

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= max) line = next;
    else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

export async function renderRecapCard(
  session: Session,
  unit: "lb" | "kg",
  prs: string[],
): Promise<{ blob: Blob; url: string }> {
  try {
    await document.fonts.ready;
  } catch {
    /* continue with fallbacks */
  }

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas");

  ctx.fillStyle = "#0c0c0b";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#7e9cb4";
  ctx.fillRect(0, 0, W, 8);

  ctx.fillStyle = "#8c8a83";
  ctx.font = "600 28px 'IBM Plex Mono', ui-monospace, monospace";
  ctx.letterSpacing = "8px";
  ctx.fillText("FORGE", 72, 100);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = "#f3f1ea";
  ctx.font = "700 84px Syne, ui-sans-serif, sans-serif";
  const nameLines = wrap(ctx, session.name || "Session", W - 144);
  let y = 200;
  for (const line of nameLines) {
    ctx.fillText(line, 72, y);
    y += 92;
  }

  ctx.fillStyle = "#8c8a83";
  ctx.font = "500 32px 'IBM Plex Sans', ui-sans-serif, sans-serif";
  ctx.fillText(format(session.finishedAt ?? session.startedAt, "EEEE, MMMM d"), 72, y + 8);

  const duration = formatDuration(sessionDurationMs(session));
  const sets = String(sessionSetCount(session));
  const volume = formatVolume(sessionVolume(session), unit);
  const stats = [
    { label: "TIME", value: duration },
    { label: "SETS", value: sets },
    { label: "VOLUME", value: volume },
  ];
  const boxW = 300;
  const gap = 24;
  const startX = 72;
  const boxY = y + 56;
  stats.forEach((s, i) => {
    const x = startX + i * (boxW + gap);
    ctx.fillStyle = "#161614";
    roundRect(ctx, x, boxY, boxW, 160, 20);
    ctx.fill();
    ctx.strokeStyle = "rgba(243,241,234,0.08)";
    ctx.lineWidth = 2;
    roundRect(ctx, x, boxY, boxW, 160, 20);
    ctx.stroke();
    ctx.fillStyle = "#8c8a83";
    ctx.font = "600 22px 'IBM Plex Mono', ui-monospace, monospace";
    ctx.fillText(s.label, x + 24, boxY + 48);
    ctx.fillStyle = "#f3f1ea";
    ctx.font = "700 40px Syne, ui-sans-serif, sans-serif";
    ctx.fillText(s.value, x + 24, boxY + 112);
  });

  let cursor = boxY + 200;
  if (prs.length > 0) {
    ctx.fillStyle = "#c4a36a";
    ctx.font = "600 24px 'IBM Plex Mono', ui-monospace, monospace";
    ctx.fillText("PERSONAL RECORDS", 72, cursor);
    cursor += 48;
    ctx.fillStyle = "#f3f1ea";
    ctx.font = "600 36px Syne, ui-sans-serif, sans-serif";
    for (const name of prs.slice(0, 4)) {
      ctx.fillText(`PR  ${name}`, 72, cursor);
      cursor += 48;
    }
    cursor += 16;
  }

  const muscles = sessionMuscles(session);
  if (muscles.length) {
    ctx.fillStyle = "#8c8a83";
    ctx.font = "600 24px 'IBM Plex Mono', ui-monospace, monospace";
    ctx.fillText("WORKED", 72, cursor);
    cursor += 36;
    let px = 72;
    const py = cursor;
    ctx.font = "600 26px 'IBM Plex Sans', ui-sans-serif, sans-serif";
    for (const id of muscles) {
      const label = MUSCLE_MAP[id]?.short ?? id;
      const tw = ctx.measureText(label).width + 40;
      if (px + tw > W - 72) break;
      ctx.fillStyle = "#2c3943";
      roundRect(ctx, px, py, tw, 52, 26);
      ctx.fill();
      ctx.fillStyle = "#f3f1ea";
      ctx.fillText(label, px + 20, py + 35);
      px += tw + 12;
    }
  }

  ctx.fillStyle = "#5c5b57";
  ctx.font = "500 24px 'IBM Plex Sans', ui-sans-serif, sans-serif";
  ctx.fillText("Logged with Forge", 72, H - 64);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/png");
  });
  return { blob, url: URL.createObjectURL(blob) };
}

export async function shareRecap(blob: Blob, name: string): Promise<boolean> {
  const file = new File([blob], `forge-${name.replace(/\s+/g, "-").toLowerCase()}.png`, {
    type: "image/png",
  });
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };
  try {
    if (nav.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
      await nav.share({ files: [file], title: name, text: `${name} — Forge` });
      return true;
    }
  } catch (err) {
    if ((err as { name?: string }).name === "AbortError") return false;
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = file.name;
  a.click();
  return true;
}

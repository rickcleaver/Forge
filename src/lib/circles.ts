import { uid } from "./utils";

export type CircleBuddy = {
  id: string;
  code: string;
  label: string;
  createdAt: number;
  lastNudgeAt: number | null;
};

export type CirclesState = {
  myCode: string;
  buddies: CircleBuddy[];
  promptsOn: boolean;
};

const KEY = "forge-circles-v1";

function load(): CirclesState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw) as CirclesState;
    if (!parsed.myCode) throw new Error("bad");
    return {
      myCode: parsed.myCode,
      buddies: Array.isArray(parsed.buddies) ? parsed.buddies : [],
      promptsOn: Boolean(parsed.promptsOn),
    };
  } catch {
    const fresh: CirclesState = { myCode: makeCode(), buddies: [], promptsOn: false };
    save(fresh);
    return fresh;
  }
}

function save(state: CirclesState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "FG-";
  for (let i = 0; i < 4; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export function getCircles(): CirclesState {
  if (typeof window === "undefined") return { myCode: "FG-WAIT", buddies: [], promptsOn: false };
  return load();
}

export function setCirclesPrompts(on: boolean) {
  const s = load();
  s.promptsOn = on;
  save(s);
  return s;
}

export function addBuddy(code: string, label?: string): CirclesState {
  const s = load();
  const clean = code.trim().toUpperCase();
  if (!clean || clean === s.myCode) return s;
  if (s.buddies.some((b) => b.code === clean)) return s;
  s.buddies = [
    ...s.buddies,
    { id: uid(), code: clean, label: label?.trim() || clean, createdAt: Date.now(), lastNudgeAt: null },
  ].slice(0, 8);
  save(s);
  return s;
}

export function removeBuddy(id: string): CirclesState {
  const s = load();
  s.buddies = s.buddies.filter((b) => b.id !== id);
  save(s);
  return s;
}

export function shareCircleLink(myCode: string): string {
  const url = new URL(window.location.origin);
  url.pathname = "/";
  url.searchParams.set("circle", myCode);
  return url.toString();
}

export function markNudged(id: string): CirclesState {
  const s = load();
  s.buddies = s.buddies.map((b) => (b.id === id ? { ...b, lastNudgeAt: Date.now() } : b));
  save(s);
  return s;
}

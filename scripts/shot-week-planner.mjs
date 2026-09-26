#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const url = process.env.SHOT_URL || "http://127.0.0.1:8080/";
const out = process.env.SHOT_OUT || "/workspace/forge-app/screenshots/home-week-planner.png";
mkdirSync(dirname(out), { recursive: true });

const today = new Date();
const dayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

const REST = { rest: true, templateId: null, programId: null };
const slot = (templateId) => ({ rest: false, templateId, programId: null });
const weekPlan = [
  { ...REST },
  slot("push"),
  slot("pull"),
  slot("legs"),
  slot("upper"),
  slot("full"),
  { ...REST },
];

const persisted = {
  state: {
    sessions: [],
    weighIns: [],
    stepLogs: [],
    progressPhotos: [],
    physiqueCheckins: [],
    programs: [],
    readinessLogs: [],
    activeSessionId: null,
    settings: {
      unit: "lb",
      defaultRestSec: 90,
      autoStartRest: true,
      hapticRest: true,
      bodyWeightLb: 150,
      heightCm: 170,
      displayName: "Rick",
      ageYears: 17,
      avatarPresetId: null,
      avatarPhotoUrl: null,
      calorieGoal: null,
      proteinGoal: null,
      exerciseRest: {},
      defaultIntensity: "moderate",
      weekPlan,
      theme: "neon",
      colorMode: "dark",
      onboarded: true,
      setupDone: true,
      goal: "muscle",
      trainDays: 5,
      place: "gym",
      morningGate: false,
    },
    timer: { running: false, duration: 90, endsAt: null, completedAt: null },
    lastBackupAt: null,
    sessionsAtLastBackup: 0,
    player: {
      xp: 120,
      level: 2,
      gems: 40,
      claimedQuests: {},
      flags: {
        visitedMuscles: false,
        visitedPrograms: false,
        addedCircleBuddy: false,
      },
      unlockedCosmetics: [],
      equippedFlair: null,
    },
    healthSync: { lastSyncAt: null, stepsToday: null, sleepHrs: null },
  },
  version: 0,
};

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});

await context.addInitScript(
  ({ persistedJson, dayKey }) => {
    try {
      sessionStorage.setItem("forge-checkin-day", dayKey);
      sessionStorage.setItem("forge-profile-skip", "1");
      sessionStorage.setItem("forge-splash-visit", dayKey);
      localStorage.setItem("forge-coach-tip-day", dayKey);
      localStorage.setItem("forge-coach-tip-id", "shot");
      localStorage.setItem("forge-tour-done", "1");
    } catch {
      /* ignore */
    }
    const open = indexedDB.open("forge-db", 1);
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains("kv")) open.result.createObjectStore("kv");
    };
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").put(persistedJson, "forge-log-v1");
    };
    try {
      localStorage.setItem("forge-log-v1", persistedJson);
    } catch {
      /* ignore */
    }
  },
  { persistedJson: JSON.stringify(persisted), dayKey },
);

const page = await context.newPage();
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });

// Skip splash if present
const splash = page.locator('[aria-label="Forge loading — tap to skip"]');
try {
  await splash.waitFor({ state: "visible", timeout: 5_000 });
  await splash.click({ force: true });
  await splash.waitFor({ state: "hidden", timeout: 8_000 }).catch(() => {});
} catch {
  /* already gone */
}

// Dismiss coach tip overlay if any
const tipClose = page.locator('[role="status"] button, [aria-label="Dismiss"], [aria-label="Close tip"]');
if (await tipClose.count()) {
  await tipClose.first().click({ force: true }).catch(() => {});
}
await page.evaluate(() => {
  document.querySelectorAll('[role="status"]').forEach((el) => el.remove());
});

await page.waitForSelector('[data-testid="week-planner"]', { timeout: 30_000 });
await page.locator('[data-testid="week-planner"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await page.screenshot({ path: out, fullPage: false });
console.log(JSON.stringify({ ok: true, out, url }, null, 2));
await browser.close();

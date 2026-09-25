# Forge

**Teen gym log with Liftoff-inspired dark neon energy — real quests, XP, streaks, and cartoon crew.**

Fast set logging, programs, muscle maps, coach chat, Circles buddies, and Spotter for coaches. Built to feel sticky for teens without copying any other brand.

Live: https://forgelog.ca · Package: `ca.forge.log`

## Best-in-class UX

- **Dark neon shell** — navy base, electric blue / purple / lime accents, rounded cards (Pop & Sunny themes still available).
- **Player HUD** — level, XP bar, streak flame, gems, alerts on Home & Progress.
- **Real quests** — finish setup, first workout, log sets, hit a PR, open muscle map / programs, invite a Circles buddy. Claim XP + gems; progress tracks real actions.
- **Home tabs** — For You (level-up card, quests, today’s workout) · Feed (Circles) · Discover (programs & templates).
- **Forge crew** — cartoon mascot/crew on Home, onboarding, empty states, and key hubs.
- **Logging delight** — set pop, rest theatre, PR flash with zero extra taps.
- **Programs / Progress / Circles / Sync / Health Connect** — existing P0–P2 kept local-first.

## Themes

| Id | Vibe |
| --- | --- |
| `neon` (default) | Dark navy · electric blue |
| `pop` | Candy pink bright alternate |
| `sunny` | Citrus glow alternate |

## Capacitor Android (Health Connect)

Forge is a PWA at https://forgelog.ca (Play package `ca.forge.log`). The `android/` tree is a Capacitor shell that wraps the same web app and bridges Health Connect into the existing ingest path.

### Open in Android Studio

1. Install JDK 17+ and Android Studio.
2. From this repo:
   ```bash
   npm install
   npm run build
   # capacitor.config.ts webDir must match your client build output (default: dist/client).
   npx cap sync android
   npx cap open android
   ```
3. Run on a device/emulator with **Health Connect** (built into Android 14+; older devices need the Play Store app).

### Permissions + privacy

- Manifest declares Health Connect **read** for steps, weight, sleep, and heart rate.
- `HealthConnectPrivacyActivity` opens https://forgelog.ca/privacy — required for Play’s Health Connect declaration. Keep that page accurate: health data stays on-device (no Forge server upload).
- `minSdkVersion` is **26** (Health Connect floor).

### Bridge

- Native plugin: `ForgeHealth` (`android/app/src/main/java/ca/forge/log/ForgeHealthPlugin.java`)
- JS: `src/lib/forge-health-plugin.ts`
- Web ingest still listens for `window.forgeApplyHealth` / `postMessage({ type: "forge-health", source: "health-connect", ... })` via `src/lib/health-connect.ts`.

**Honest status:** the plugin stub can publish snapshots into the web app; automatic Health Connect SDK queries are not fully wired yet. PWA/web builds are unchanged and do not require Capacitor.

### Don’t break the web build

Capacitor deps are optional at runtime. `npm run build` / `npm run dev` stay web-first. Only `npx cap sync` needs a client `dist` output.


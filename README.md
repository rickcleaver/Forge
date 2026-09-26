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

Forge is a PWA at https://forgelog.ca (Play package `ca.forge.log`). The `android/` tree is a Capacitor 6 shell that wraps the same web app and bridges **real Health Connect SDK reads** into the existing ingest path.

### Open in Android Studio

1. Install JDK 17+ and Android Studio.
2. From this repo:
   ```bash
   npm install
   npm run build
   # capacitor.config.ts webDir must match your client build output (default: dist).
   npx cap sync android
   npx cap open android
   ```
3. Run on a device/emulator with **Health Connect** (built into Android 14+; older devices need the Play Store app).

### What the native bridge does

| Step | API |
| --- | --- |
| Availability | `ForgeHealth.getStatus()` → `available` / `sdkStatus` / `permissionsGranted` |
| Permissions | `ForgeHealth.requestReadPermissions()` → Health Connect system sheet |
| Query + ingest | `ForgeHealth.readAndPublish()` aggregates today’s steps, latest weight (30d), sleep (36h), resting HR (7d), then posts `forge-health` into the WebView |
| Settings | `ForgeHealth.openHealthConnectSettings()` |

- Native plugin: `android/app/src/main/java/ca/forge/log/ForgeHealthPlugin.kt` (`androidx.health.connect:connect-client`)
- JS: `src/lib/forge-health-plugin.ts` + `src/lib/health-connect.ts` (`syncHealthConnectNative`)
- UI: Health sync card shows **Synced** only after `applyHealthSnapshot` succeeds — never from a permission grant alone
- Web ingest still listens for `window.forgeApplyHealth` / `postMessage({ type: "forge-health", source: "health-connect", ... })`

PWA/web builds are unchanged and do not require Capacitor.

### Avatar / Cap Camera

Onboarding and Settings let athletes pick a neon cartoon preset or a selfie.
The **web / PWA path** always uses:

```html
<input type="file" accept="image/*" capture="user" />  <!-- front camera -->
<input type="file" accept="image/*" />                 <!-- gallery -->
```

Photos are compressed to a data URL and persisted with the rest of settings
(IndexedDB via zustand). No native plugin is required for that path.

**Optional native upgrade:** `@capacitor/camera` can replace the file input on
Android/iOS for a richer picker (`Camera.getPhoto({ resultType: CameraResultType.DataUrl, source: CameraSource.Prompt })`).
Keep the web `<input>` fallback so desktop and installed PWA still work without Cap.

### Permissions + privacy

- Manifest declares Health Connect **read** for steps, weight, sleep, heart rate, and resting heart rate.
- `HealthConnectPrivacyActivity` opens https://forgelog.ca/privacy — required for Play’s Health Connect declaration. Keep that page accurate: health data stays on-device (no Forge server upload).
- `minSdkVersion` is **26** (Health Connect floor).

### Play Console / DAL / release checklist

1. **Health Connect declaration** in Play Console → App content → Health apps: declare read types (Steps, Weight, Sleep, Heart rate / Resting heart rate) and point the privacy policy at https://forgelog.ca/privacy.
2. **Data safety form**: mark health data as collected on-device only; not shared off-device / not uploaded to Forge servers.
3. **Digital Asset Links (DAL)** if you also ship a TWA / Play App Signing web link: host `/.well-known/assetlinks.json` for `ca.forge.log` with your release signing cert SHA-256.
4. **Build**: `npm run build && npx cap sync android`, then Android Studio → Generate Signed Bundle (AAB). JDK 17+, `compileSdk`/`targetSdk` 34.
5. **Device test**: Android 14+ emulator or phone with Health Connect + a steps/weight source (Fitbit, Garmin, Pixel steps). Tap **Connect & sync**, grant reads, confirm Today steps / Weight update and badge flips to **Synced**.

### Cap + Health Connect device checklist

Use this on a real phone or Android 14+ emulator before a Play upload:

1. **Build & sync** — `npm run build && npx cap sync android`, then Run from Android Studio (JDK 17+, `ca.forge.log`).
2. **Health Connect present** — Android 14+ built-in, or install Health Connect from Play on older devices.
3. **Seed a source** — Pixel Steps, Fitbit, Garmin, or Health Connect Controller so steps/weight/sleep exist.
4. **Connect & sync** — In Forge → Settings → Health Connect → **Connect & sync** → grant Steps, Weight, Sleep, Heart rate / Resting heart rate.
5. **Confirm ingest** — Home **Steps** card updates, weight appears if present, badge flips to **Synced** (never from permission alone).
6. **Privacy activity** — From Health Connect app permissions / Play declaration path, `HealthConnectPrivacyActivity` opens https://forgelog.ca/privacy.
7. **Web fallback** — Same build still works as PWA at https://forgelog.ca without Capacitor; native bridge is a no-op on web.
8. **Avatar camera (optional)** — Onboarding selfie uses web `<input capture>` on PWA; Cap Camera is optional upgrade only.

### Don’t break the web build

Capacitor deps are optional at runtime. `npm run build` / `npm run dev` stay web-first. Only `npx cap sync` needs a client `dist` output.

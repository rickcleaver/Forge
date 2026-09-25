import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ca.forge.log",
  appName: "Forge",
  // TanStack Start / Vite client build. Run `npm run build` before `npx cap sync`.
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;

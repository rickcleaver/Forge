/**
 * Capacitor ForgeHealth plugin (JS).
 * Native implementation: android/.../ForgeHealthPlugin.java
 * Posts into window.forgeApplyHealth — same path as the PWA bridge.
 */
import { registerPlugin } from "@capacitor/core";

export type ForgeHealthSnapshotArgs = {
  steps?: number;
  weightLb?: number;
  sleepHrs?: number;
  readiness?: number;
};

export type ForgeHealthNativeInfo = {
  native: boolean;
  healthConnectReady: boolean;
  note?: string;
};

export interface ForgeHealthPlugin {
  isNativeShell(): Promise<ForgeHealthNativeInfo>;
  openHealthConnectSettings(): Promise<void>;
  publishHealthSnapshot(args: ForgeHealthSnapshotArgs): Promise<void>;
}

export const ForgeHealth = registerPlugin<ForgeHealthPlugin>("ForgeHealth", {
  web: {
    async isNativeShell() {
      return {
        native: false,
        healthConnectReady: false,
        note: "Web/PWA — Health Connect needs the Android Capacitor shell.",
      };
    },
    async openHealthConnectSettings() {},
    async publishHealthSnapshot() {},
  },
});

export function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

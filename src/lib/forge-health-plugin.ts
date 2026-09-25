/**
 * Capacitor ForgeHealth plugin (JS).
 * Native implementation: android/.../ForgeHealthPlugin.kt
 * Posts into window.forgeApplyHealth — same path as the PWA bridge.
 */
import { registerPlugin } from "@capacitor/core";

export type ForgeHealthSnapshotArgs = {
  steps?: number;
  weightLb?: number;
  sleepHrs?: number;
  readiness?: number;
  restingHr?: number;
};

export type ForgeHealthNativeInfo = {
  native: boolean;
  healthConnectReady: boolean;
  available?: boolean;
  permissionsGranted?: boolean;
  sdkStatus?: string;
  note?: string;
  grantedPermissions?: string[];
};

export type ForgeHealthReadResult = ForgeHealthSnapshotArgs & {
  type?: string;
  source?: string;
};

export interface ForgeHealthPlugin {
  isNativeShell(): Promise<ForgeHealthNativeInfo>;
  getStatus(): Promise<ForgeHealthNativeInfo>;
  openHealthConnectSettings(): Promise<void>;
  requestReadPermissions(): Promise<ForgeHealthNativeInfo>;
  readAndPublish(): Promise<ForgeHealthReadResult>;
  publishHealthSnapshot(args: ForgeHealthSnapshotArgs): Promise<ForgeHealthReadResult | void>;
}

const webImpl: ForgeHealthPlugin = {
  async isNativeShell() {
    return {
      native: false,
      healthConnectReady: false,
      available: false,
      permissionsGranted: false,
      sdkStatus: "web",
      note: "Web/PWA — Health Connect needs the Android Capacitor shell.",
    };
  },
  async getStatus() {
    return webImpl.isNativeShell();
  },
  async openHealthConnectSettings() {},
  async requestReadPermissions() {
    return webImpl.isNativeShell();
  },
  async readAndPublish() {
    throw new Error("Health Connect auto-read requires the Android Capacitor shell.");
  },
  async publishHealthSnapshot() {},
};

export const ForgeHealth = registerPlugin<ForgeHealthPlugin>("ForgeHealth", {
  web: webImpl,
});

export function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

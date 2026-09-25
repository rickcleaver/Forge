import { useEffect } from "react";
import { isSetupSession } from "@/lib/stats";
import { useGym } from "@/lib/store";

export function WakeLock() {
  const sessions = useGym((s) => s.sessions);
  const activeId = useGym((s) => s.activeSessionId);
  const active = sessions.find((s) => s.id === activeId && !s.finishedAt);
  const live = Boolean(active && !isSetupSession(active));

  useEffect(() => {
    if (!live || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let dead = false;

    async function request() {
      if (dead || document.visibilityState !== "visible") return;
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        lock = null;
      }
    }

    function onVis() {
      if (document.visibilityState === "visible") void request();
    }

    void request();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      dead = true;
      document.removeEventListener("visibilitychange", onVis);
      void lock?.release();
    };
  }, [live]);

  return null;
}

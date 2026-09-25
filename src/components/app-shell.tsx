import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Activity, Clock3, Dumbbell, House, MessageCircle } from "lucide-react";
import { useGym } from "@/lib/store";
import { themeBarColor } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { RestTimerHost } from "./rest-timer";
import { WakeLock } from "./wake-lock";
import { PowerSplash } from "./power-splash";
import { AppTour } from "./app-tour";
import { splashDoneThisVisit } from "@/lib/splash";
import { stepsFromBridge } from "@/lib/health-connect";
import { registerOffline, subscribeOnline } from "@/lib/offline";
import { Onboarding } from "./onboarding";

const NAV = [
  { to: "/", label: "Home", icon: House },
  { to: "/session", label: "Train", icon: Dumbbell },
  { to: "/progress", label: "Progress", icon: Activity },
  { to: "/coach", label: "Coach", icon: MessageCircle },
  { to: "/history", label: "Log", icon: Clock3 },
] as const;

export function StoreHydration({ children }: { children: React.ReactNode }) {
  const hydrated = useGym((s) => s.hydrated);
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!useGym.getState().hydrated) useGym.getState().setHydrated(true);
    }, 1200);
    void Promise.resolve(useGym.persist.rehydrate())
      .catch(() => undefined)
      .finally(() => {
        const gym = useGym.getState();
        gym.setHydrated(true);
        gym.sweepStaleSetups();
      });
    return () => window.clearTimeout(t);
  }, []);
  if (!hydrated) {
    return <div className="min-h-dvh bg-bg" />;
  }
  return children;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const activeId = useGym((s) => s.activeSessionId);
  const sessions = useGym((s) => s.sessions);
  const live = sessions.find((s) => s.id === activeId && !s.finishedAt);
  const theme = useGym((s) => s.settings.theme ?? "steel");
  const colorMode = useGym((s) => s.settings.colorMode ?? "dark");
  const [splash, setSplash] = useState(() => !splashDoneThisVisit());
  const [online, setOnline] = useState(true);

  useEffect(() => {
    registerOffline();
    return subscribeOnline(setOnline);
  }, []);

  useEffect(() => {
    function apply(n: number) {
      useGym.getState().logSteps(n);
    }
    (window as Window & { forgeApplySteps?: (n: number) => void }).forgeApplySteps = apply;
    function onMsg(e: MessageEvent) {
      const n = stepsFromBridge(e.data);
      if (n != null) apply(n);
    }
    window.addEventListener("message", onMsg);
    return () => {
      window.removeEventListener("message", onMsg);
      delete (window as Window & { forgeApplySteps?: (n: number) => void }).forgeApplySteps;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.mode = colorMode;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", themeBarColor(theme, colorMode));
  }, [theme, colorMode]);

  useEffect(() => {
    if (splash) return;
    let land = false;
    try {
      land =
        window.sessionStorage.getItem("forge-land-home") === "1" ||
        window.sessionStorage.getItem("forge-after-checkin") === "1";
    } catch {
      land = false;
    }
    if (!land) return;
    if (pathname === "/session" || pathname.startsWith("/session/")) {
      void navigate({ to: "/", replace: true });
      return;
    }
    if (pathname === "/") {
      try {
        window.sessionStorage.removeItem("forge-land-home");
        window.sessionStorage.removeItem("forge-after-checkin");
      } catch {
        /* ignore */
      }
    }
  }, [splash, pathname, navigate]);

  return (
    <div className="flex min-h-dvh justify-center bg-bg text-fg">
      {splash ? (
        <PowerSplash
          onDone={() => {
            setSplash(false);
            try {
              window.sessionStorage.setItem("forge-land-home", "1");
            } catch {
              /* ignore */
            }
            void navigate({ to: "/", replace: true });
          }}
        />
      ) : null}
      <div
        className="w-full max-w-lg pb-32"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        {online ? null : (
          <p className="mx-4 mt-3 rounded-full bg-surface px-3 py-1.5 text-center text-xs text-muted shadow-[var(--shadow-border)]">
            Offline · sets still save on this phone
          </p>
        )}
        <Onboarding />
        <div className="forge-page-enter">{children}</div>
      </div>
      <WakeLock />
      {live && live.liveAt != null ? <RestTimerHost /> : null}
      <AppTour ready={!splash} />
      <nav
        className="fixed inset-x-0 z-30 px-3"
        style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5 rounded-full bg-surface/95 p-1 shadow-[var(--shadow-lift)] backdrop-blur-xl">
          {NAV.map((item) => {
            const on =
              item.to === "/"
                ? pathname === "/"
                : pathname === item.to || pathname.startsWith(`${item.to}/`);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  data-tour={item.label.toLowerCase()}
                  data-active={on}
                  className={cn(
                    "nav-pill relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-semibold",
                    on ? "bg-accent text-accent-fg" : "text-muted",
                  )}
                >
                  <Icon className="size-5" strokeWidth={on ? 2.5 : 1.8} />
                  {item.label}
                  {item.to === "/session" && live ? (
                    <span className="absolute top-1.5 right-3 size-1.5 rounded-full bg-success" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

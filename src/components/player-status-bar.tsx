import { Bell, Flame, Gem, Sparkles } from "lucide-react";
import { useGym } from "@/lib/store";
import { levelFromXp, trainingStreak } from "@/lib/player-progress";
import { SettingsDrawer } from "./settings-drawer";
import { ForgeCharacter } from "./forge-character";

export function PlayerStatusBar() {
  const sessions = useGym((s) => s.sessions);
  const player = useGym((s) => s.player);
  const level = levelFromXp(player.xp);
  const streak = trainingStreak(sessions);

  return (
    <header className="flex items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2 ring-2 ring-[color-mix(in_srgb,var(--color-ring)_70%,transparent)]">
          <ForgeCharacter kind="mascot" size="xs" motion="none" className="scale-125" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold tabular-nums">
            Lv.{level.level}
            <span className="ml-1 text-xs font-medium text-muted">
              {level.xpIntoLevel}/{level.xpForNext} XP
            </span>
          </p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-well">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-ring)] to-[var(--color-accent)] transition-[width] duration-300"
              style={{ width: `${Math.round(level.progress * 100)}%` }}
            />
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-bold shadow-[var(--shadow-border)]">
          <Flame className="size-3.5 text-orange-400" />
          {streak}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-bold shadow-[var(--shadow-border)]">
          <Gem className="size-3.5 text-sky-400" />
          {player.gems}
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-muted shadow-[var(--shadow-border)]"
          title="Total XP"
        >
          <Sparkles className="size-3.5 text-accent" />
          {player.xp}
        </span>
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full bg-surface text-amber-300 shadow-[var(--shadow-border)]"
          aria-label="Alerts"
        >
          <Bell className="size-4" />
        </button>
        <SettingsDrawer />
      </div>
    </header>
  );
}

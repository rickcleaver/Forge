import { Bell, Flame, Gem, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useGym } from "@/lib/store";
import { levelFromXp, trainingStreak } from "@/lib/player-progress";
import { COSMETIC_MAP } from "@/lib/cosmetics";
import { resolveAvatarSrc } from "@/lib/avatars";
import { SettingsDrawer } from "./settings-drawer";
import { ForgeCharacter } from "./forge-character";

export function PlayerStatusBar() {
  const sessions = useGym((s) => s.sessions);
  const player = useGym((s) => s.player);
  const settings = useGym((s) => s.settings);
  const level = levelFromXp(player.xp);
  const streak = trainingStreak(sessions);
  const flair = player.equippedFlair ? COSMETIC_MAP[player.equippedFlair] : null;
  const ring = flair?.ring ?? "color-mix(in srgb, var(--color-ring) 70%, transparent)";
  const avatarSrc = resolveAvatarSrc(settings);

  return (
    <header className="flex items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div
          className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-2"
          style={{
            boxShadow: `0 0 0 2px ${ring}, 0 0 14px color-mix(in srgb, ${flair?.ring ?? "var(--color-ring)"} 40%, transparent)`,
          }}
          title={flair ? `Flair: ${flair.name}` : "Avatar"}
          data-flair={flair?.id ?? "none"}
          data-avatar={avatarSrc ? "custom" : "mascot"}
        >
          <div className="flex size-full items-center justify-center overflow-hidden rounded-full">
            {avatarSrc ? (
              <img src={avatarSrc} alt="" className="size-full object-cover" draggable={false} />
            ) : (
              <ForgeCharacter kind="mascot" size="xs" motion="none" className="scale-125" />
            )}
          </div>
          {flair ? (
            <span
              className="pointer-events-none absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-surface text-[10px] shadow-[var(--shadow-border)]"
              aria-hidden
            >
              {flair.emoji}
            </span>
          ) : null}
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
        <Link
          to="/streak"
          className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-bold shadow-[var(--shadow-border)] transition hover:brightness-110"
          aria-label={`Streak ${streak} days`}
        >
          <Flame className="size-3.5 text-orange-400" />
          {streak}
        </Link>
        <Link
          to="/gems"
          className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-bold shadow-[var(--shadow-border)] transition hover:brightness-110"
          aria-label={`${player.gems} gems`}
        >
          <Gem className="size-3.5 text-[var(--color-candy-2)]" />
          {player.gems}
        </Link>
        <span
          className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-muted shadow-[var(--shadow-border)]"
          title="Total XP"
        >
          <Sparkles className="size-3.5 text-[var(--color-ring)]" />
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

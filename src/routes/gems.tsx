import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Gem, ShoppingBag, Sparkles } from "lucide-react";
import { COSMETIC_DEFS, COSMETIC_MAP, type CosmeticId } from "@/lib/cosmetics";
import { QUEST_DEFS } from "@/lib/quests";
import { useGym } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gems")({ component: GemsPage });

function GemsPage() {
  const player = useGym((s) => s.player);
  const buyCosmetic = useGym((s) => s.buyCosmetic);
  const equipFlair = useGym((s) => s.equipFlair);
  const [toast, setToast] = useState<string | null>(null);

  const claimed = QUEST_DEFS.filter((q) => player.claimedQuestIds.includes(q.id));
  const earnedFromClaims = claimed.reduce((n, q) => n + q.rewardGems, 0);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }

  function onBuy(id: CosmeticId) {
    const res = buyCosmetic(id);
    if (!res.ok) {
      flash(res.error ?? "Nope.");
      return;
    }
    flash(`Unlocked ${COSMETIC_MAP[id].name}!`);
  }

  function onEquip(id: CosmeticId | null) {
    const res = equipFlair(id);
    if (!res.ok) {
      flash(res.error ?? "Nope.");
      return;
    }
    flash(id ? `Equipped ${COSMETIC_MAP[id].name}` : "Flair cleared");
  }

  return (
    <main className="forge-page-enter px-4 pt-4 pb-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-bold text-muted shadow-[var(--shadow-border)]"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </Link>

      <div className="mt-5 flex items-start gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 shadow-[var(--shadow-glow)]">
          <Gem className="size-7 text-white" />
        </div>
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">Loot</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Gems</h1>
          <p className="mt-1 text-sm text-muted">Earn from quests. Spend on drip that actually sticks.</p>
        </div>
      </div>

      <div className="forge-neon-frame mt-6 rounded-2xl bg-surface p-5 shadow-[var(--shadow-lift)]">
        <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Balance</p>
        <p className="mt-1 flex items-baseline gap-2 font-display text-5xl font-extrabold tabular-nums text-[var(--color-candy-2)]">
          {player.gems}
          <span className="text-base font-semibold text-muted">gems</span>
        </p>
        <p className="mt-2 text-xs text-muted">
          ~{earnedFromClaims} logged from claimed quests
          {player.unlockedCosmetics.length
            ? ` · ${player.unlockedCosmetics.length} unlock${player.unlockedCosmetics.length === 1 ? "" : "s"} owned`
            : ""}
        </p>
      </div>

      {toast ? (
        <p
          role="status"
          className="mt-3 rounded-xl bg-well px-3 py-2 text-center text-sm font-bold text-accent"
        >
          {toast}
        </p>
      ) : null}

      <section className="mt-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <ShoppingBag className="size-4 text-[var(--color-candy-3)]" />
          Gem shop
        </h2>
        <p className="mt-1 text-sm text-muted">Avatar flair persists on your player save. Equip one at a time.</p>
        <ul className="mt-3 space-y-2">
          {COSMETIC_DEFS.map((item) => {
            const owned = player.unlockedCosmetics.includes(item.id);
            const equipped = player.equippedFlair === item.id;
            const canAfford = player.gems >= item.cost;
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]"
              >
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{
                    background: `color-mix(in srgb, ${item.ring} 28%, transparent)`,
                    boxShadow: `0 0 16px color-mix(in srgb, ${item.ring} 35%, transparent)`,
                  }}
                >
                  {item.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{item.name}</p>
                  <p className="text-xs text-muted">{item.blurb}</p>
                  <p className="mt-0.5 font-mono text-[10px] tabular-nums text-[var(--color-candy-2)]">
                    {item.cost} gems
                  </p>
                </div>
                {owned ? (
                  <button
                    type="button"
                    onClick={() => onEquip(equipped ? null : item.id)}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold",
                      equipped
                        ? "bg-well text-muted"
                        : "bg-accent text-accent-fg shadow-[var(--shadow-glow)]",
                    )}
                  >
                    {equipped ? "Unequip" : "Equip"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!canAfford}
                    onClick={() => onBuy(item.id)}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold",
                      canAfford
                        ? "bg-gradient-to-r from-cyan-400 to-violet-500 text-accent-fg"
                        : "bg-well text-subtle",
                    )}
                  >
                    Buy
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Sparkles className="size-4 text-[var(--color-ring)]" />
          Gem log
        </h2>
        <p className="mt-1 text-sm text-muted">From quests you’ve actually claimed.</p>
        {claimed.length === 0 ? (
          <div className="mt-3 rounded-2xl bg-surface-2/80 p-4 text-sm text-muted">
            No claims yet. Crush a quest on Home / Progress, then cash it for gems.
            <Link to="/progress" hash="forge-quests" className="mt-2 block font-bold text-accent">
              Open quests →
            </Link>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-2xl bg-surface shadow-[var(--shadow-border)]">
            {claimed.map((q) => (
              <li key={q.id} className="flex items-center justify-between px-4 py-3">
                <span>
                  <span className="block text-sm font-medium">{q.title}</span>
                  <span className="font-mono text-[10px] text-muted">+{q.rewardXp} XP</span>
                </span>
                <span className="font-mono text-sm font-bold tabular-nums text-[var(--color-candy-2)]">
                  +{q.rewardGems}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-2xl bg-surface-2/80 p-4 text-sm text-muted">
        <p className="font-display text-base font-bold text-fg">How gems work</p>
        <ul className="mt-2 space-y-1.5">
          <li>Quests pay gems when you Claim — proof only, no freebies.</li>
          <li>Shop unlocks save on your player. Unequip anytime.</li>
          <li>Spend wisely: gold glow is flex, spark trail is the starter drip.</li>
        </ul>
      </section>
    </main>
  );
}

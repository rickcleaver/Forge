import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ForgeCharacterKind = "mascot" | "crew";
export type ForgeCharacterSize = "xs" | "sm" | "md" | "lg" | "hero";

const SRC: Record<ForgeCharacterKind, string> = {
  mascot: "/art/characters/mascot-hero.png",
  crew: "/art/characters/crew-hero.png",
};

const SIZE: Record<ForgeCharacterSize, string> = {
  xs: "h-14 w-auto",
  sm: "h-20 w-auto",
  md: "h-28 w-auto",
  lg: "h-40 w-auto max-w-[11rem]",
  hero: "h-auto w-full max-h-56 object-contain",
};

type Props = {
  kind?: ForgeCharacterKind;
  size?: ForgeCharacterSize;
  className?: string;
  imgClassName?: string;
  alt?: string;
  /** Decorative sticker float / wiggle */
  motion?: "none" | "float" | "wiggle";
  /** Soft candy blobs behind the figure */
  blobs?: boolean;
};

/**
 * Reusable Forge mascot / crew placements for teen sticky UI.
 * Purely decorative — never blocks taps on CTAs underneath.
 */
export function ForgeCharacter({
  kind = "mascot",
  size = "md",
  className,
  imgClassName,
  alt = "",
  motion = "float",
  blobs = false,
}: Props) {
  return (
    <div
      className={cn(
        "forge-character-stage relative inline-flex items-end justify-center pointer-events-none select-none",
        className,
      )}
      aria-hidden={alt ? undefined : true}
    >
      {blobs ? (
        <>
          <span className="forge-blob forge-blob--a" />
          <span className="forge-blob forge-blob--b" />
        </>
      ) : null}
      <img
        src={SRC[kind]}
        alt={alt}
        draggable={false}
        className={cn(
          "forge-sticker forge-sticker-cutout relative z-[1] object-contain",
          SIZE[size],
          motion === "wiggle" && "forge-wiggle",
          motion === "float" && "forge-bounce-in",
          kind === "crew" && "rounded-3xl",
          imgClassName,
        )}
      />
    </div>
  );
}

/** Compact empty-state block with character + teen copy. */
export function ForgeEmptyState({
  title,
  body,
  kind = "mascot",
  className,
  children,
}: {
  title: string;
  body: string;
  kind?: ForgeCharacterKind;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "forge-card-play forge-bounce-in relative overflow-hidden rounded-3xl bg-surface px-4 py-6 text-center shadow-[var(--shadow-border)]",
        className,
      )}
    >
      <span className="forge-blob forge-blob--a opacity-40" />
      <span className="forge-blob forge-blob--c opacity-35" />
      <ForgeCharacter kind={kind} size={kind === "crew" ? "hero" : "lg"} className="mx-auto" blobs={false} />
      <p className="relative z-[1] mt-3 font-display text-xl font-semibold">{title}</p>
      <p className="relative z-[1] mt-1 text-sm text-muted">{body}</p>
      {children ? <div className="relative z-[1] mt-4">{children}</div> : null}
    </div>
  );
}

import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "muted",
  ...props
}: React.ComponentProps<"span"> & { tone?: "muted" | "accent" | "success" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone === "muted" && "bg-surface-2 text-muted",
        tone === "accent" && "bg-accent text-accent-fg",
        tone === "success" && "bg-success/20 text-success",
        className,
      )}
      {...props}
    />
  );
}

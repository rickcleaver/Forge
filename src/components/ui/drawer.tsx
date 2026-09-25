import { Drawer as Vaul } from "vaul";
import { cn } from "@/lib/utils";

export const Drawer = Vaul.Root;
export const DrawerTrigger = Vaul.Trigger;
export const DrawerClose = Vaul.Close;
export const DrawerPortal = Vaul.Portal;

export function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Vaul.Content>) {
  return (
    <Vaul.Portal>
      <Vaul.Overlay className="fixed inset-0 z-50 bg-overlay" />
      <Vaul.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[92dvh] flex-col rounded-t-2xl bg-surface outline-none",
          className,
        )}
        {...props}
      >
        <div className="mx-auto mt-3 mb-1 h-1 w-10 rounded-full bg-border" />
        {children}
      </Vaul.Content>
    </Vaul.Portal>
  );
}

export function DrawerTitle({ className, ...props }: React.ComponentProps<typeof Vaul.Title>) {
  return (
    <Vaul.Title
      className={cn("font-display text-lg font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof Vaul.Description>) {
  return <Vaul.Description className={cn("text-sm text-muted", className)} {...props} />;
}

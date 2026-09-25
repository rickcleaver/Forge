import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold select-none transition-[background-color,color,opacity,box-shadow,transform] duration-150 ease-out active:not-disabled:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-fg shadow-[var(--shadow-glow)] hover:bg-accent/90",
        secondary:
          "bg-surface-2 text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
        ghost: "text-fg hover:bg-surface-2",
        outline:
          "text-fg shadow-[var(--shadow-border)] hover:bg-surface-2 hover:shadow-[var(--shadow-border-hover)]",
        danger: "bg-danger text-fg hover:bg-danger/90",
        success: "bg-success text-accent-fg hover:bg-success/90",
      },
      size: {
        default: "h-12 rounded-full px-5 text-sm",
        sm: "h-10 rounded-full px-4 text-xs",
        lg: "h-14 rounded-full px-6 text-base",
        icon: "size-11 rounded-full",
        "icon-sm": "size-9 rounded-full",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

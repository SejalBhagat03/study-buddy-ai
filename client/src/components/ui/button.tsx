import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary via-secondary to-highlight text-white shadow-soft hover:shadow-glow hover:scale-[1.03] active:scale-[0.98] border-0 font-semibold",
        destructive: "bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-soft hover:shadow-glow hover:scale-[1.03] active:scale-[0.98]",
        outline: "border border-glass-border bg-white/40 backdrop-blur-md text-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 shadow-soft hover:scale-[1.02]",
        secondary: "bg-white/60 backdrop-blur-md text-foreground border border-glass-border/50 shadow-soft hover:bg-white/80 hover:scale-[1.02]",
        ghost: "hover:bg-secondary/30 hover:text-foreground hover:scale-[1.02]",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "bg-gradient-to-r from-primary via-secondary to-highlight text-white shadow-soft hover:shadow-glow hover:scale-[1.03] active:scale-[0.98]",
        glass: "bg-white/40 backdrop-blur-md border border-glass-border/40 text-foreground hover:bg-white/60 shadow-soft hover:scale-[1.02]",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-13 rounded-xl px-7 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "default" | "sm" | "icon";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none",
          // Variants
          variant === "primary" &&
            "bg-primary text-primary-foreground hover:brightness-110",
          variant === "secondary" &&
            "border border-border bg-card text-foreground hover:bg-muted",
          variant === "ghost" &&
            "text-muted-foreground hover:text-foreground hover:bg-muted",
          variant === "destructive" &&
            "bg-destructive text-white hover:brightness-110",
          // Sizes
          size === "default" && "text-sm px-4 py-2.5",
          size === "sm" && "text-xs px-3 py-2",
          size === "icon" && "size-9",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };

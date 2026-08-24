import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground",
        "placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
        "transition-colors",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground resize-none",
        "placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
        "transition-colors",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground",
        "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
        "transition-colors",
        className
      )}
      {...props}
    />
  )
);
Select.displayName = "Select";

export { Input, Textarea, Select };

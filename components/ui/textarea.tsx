import { TextareaHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  requiredMark?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(
  ({ className, label, error, requiredMark, ...props }, ref) => (
    <label className="block space-y-2">
      {label ? (
        <span className="text-sm font-medium text-foreground">
          {label}
          {requiredMark ? <span className="text-danger"> *</span> : null}
        </span>
      ) : null}
      <textarea
        ref={ref}
        className={cn(
          "min-h-[140px] w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20",
          error && "border-danger focus:border-danger focus:ring-danger/20",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm text-danger">{error}</span> : null}
    </label>
  ),
);

Textarea.displayName = "Textarea";

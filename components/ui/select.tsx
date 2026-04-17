import { SelectHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  requiredMark?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, Props>(
  ({ className, label, error, requiredMark, children, ...props }, ref) => (
    <label className="block space-y-2">
      {label ? (
        <span className="text-sm font-medium text-foreground">
          {label}
          {requiredMark ? <span className="text-danger"> *</span> : null}
        </span>
      ) : null}
      <select
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
          error && "border-danger focus:border-danger focus:ring-danger/20",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="text-sm text-danger">{error}</span> : null}
    </label>
  ),
);

Select.displayName = "Select";

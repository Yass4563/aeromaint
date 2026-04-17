import { ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-primary text-white hover:bg-primary/90",
  secondary: "bg-surface text-foreground ring-1 ring-border hover:bg-primary-soft",
  danger: "bg-danger text-white hover:bg-danger/90",
  ghost: "bg-transparent text-foreground hover:bg-primary-soft",
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";

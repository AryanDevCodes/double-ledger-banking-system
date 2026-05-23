import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<NonNullable<GradientButtonProps["variant"]>, string> = {
  primary:
    "bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:shadow-[0_4px_28px_rgba(99,102,241,0.55)]",
  secondary:
    "bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--ink-primary)] hover:bg-white/70 dark:hover:bg-white/10",
  danger:
    "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white shadow-[0_4px_20px_rgba(239,68,68,0.35)]",
  success:
    "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-[0_4px_20px_rgba(16,185,129,0.35)]",
};

const sizeStyles: Record<NonNullable<GradientButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
};

export default function GradientButton({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  className,
  disabled,
  ...props
}: GradientButtonProps) {
  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "overflow-hidden group",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {/* Sheen on hover */}
      {variant === "primary" && (
        <span
          aria-hidden="true"
          className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
        />
      )}
      {loading && (
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

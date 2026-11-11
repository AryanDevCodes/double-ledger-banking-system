import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const TINT_STYLES = {
  neutral: "",
  indigo: "bg-indigo-500/5 border-indigo-500/20",
  emerald: "bg-emerald-500/5 border-emerald-500/20",
  rose: "bg-rose-500/5 border-rose-500/20",
  amber: "bg-amber-500/5 border-amber-500/20",
};

export interface GlassPanelProps {
  variant?: "default" | "elevated" | "subtle" | "interactive";
  tint?: keyof typeof TINT_STYLES;
  className?: string;
  children: ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  as?: keyof JSX.IntrinsicElements;
}

export default function GlassPanel({
  variant = "default",
  tint = "neutral",
  className,
  children,
  style,
  onClick,
  as: Tag = "div",
}: GlassPanelProps) {
  const tintClass = TINT_STYLES[tint] || "";

  return (
    <Tag
      className={cn(
        "rounded-lg border border-border bg-card transition-colors duration-150",
        variant === "elevated" && "shadow-sm",
        variant === "subtle" && "bg-muted/40 border-border",
        variant === "interactive" && "hover:bg-muted/40 hover:border-primary/30",
        tintClass,
        className
      )}
      style={style}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}
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
  blur?: "sm" | "md" | "lg" | "xl"; // we'll use backdrop-blur-* classes
  tint?: keyof typeof TINT_STYLES;
  className?: string;
  children: ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  as?: keyof JSX.IntrinsicElements;
}

const blurMap = {
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
  lg: "backdrop-blur-lg",
  xl: "backdrop-blur-xl",
};

export default function GlassPanel({
  variant = "default",
  blur = "lg",
  tint = "neutral",
  className,
  children,
  style,
  onClick,
  as: Tag = "div",
}: GlassPanelProps) {
  const tintClass = TINT_STYLES[tint] || "";
  const blurClass = blurMap[blur] || "backdrop-blur-lg";

  return (
    <Tag
      className={cn(
        "rounded-2xl border border-border/40 bg-card/60 transition-all duration-300",
        blurClass,
        variant === "elevated" && "shadow-lg shadow-black/5",
        variant === "subtle" && "bg-card/40 border-border/20",
        variant === "interactive" && "hover:bg-card/80 hover:border-border/60 hover:-translate-y-0.5 hover:shadow-lg",
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
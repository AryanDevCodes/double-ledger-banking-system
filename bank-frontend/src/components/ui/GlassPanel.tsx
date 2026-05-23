import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface GlassPanelProps {
  variant?: "default" | "elevated" | "subtle" | "interactive";
  blur?: "sm" | "md" | "lg" | "xl";
  tint?: "neutral" | "indigo" | "emerald" | "rose" | "amber";
  className?: string;
  children: ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  as?: keyof JSX.IntrinsicElements;
}

const blurStyle: Record<NonNullable<GlassPanelProps["blur"]>, string> = {
  sm: "blur(8px)",
  md: "blur(12px)",
  lg: "blur(16px)",
  xl: "blur(20px)",
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
  const blurValue = blurStyle[blur];

  return (
    <Tag
      className={cn(
        "glass-panel rounded-2xl",
        variant === "elevated" && "glass-panel--elevated",
        variant === "subtle" && "glass-panel--subtle",
        variant === "interactive" && "glass-panel--interactive",
        tint !== "neutral" && `glass-panel--${tint}`,
        className,
      )}
      style={{
        backdropFilter: blurValue,
        WebkitBackdropFilter: blurValue,
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}

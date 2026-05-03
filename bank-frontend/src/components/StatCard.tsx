import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: string; positive: boolean };
  className?: string;
  compact?: boolean;
}

export default function StatCard({ title, value, subtitle, icon, trend, className, compact = true }: StatCardProps) {
  return (
    <div className={cn("stat-card", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">{title}</p>
          <p className={cn("font-semibold tracking-tight", compact ? "text-xl" : "text-2xl")}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={cn("text-xs font-medium", trend.positive ? "text-success" : "text-destructive")}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div className={cn(
          "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-primary/10 text-primary ring-1 ring-primary/35 shadow-md",
          compact ? "h-9 w-9" : "h-10 w-10"
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}

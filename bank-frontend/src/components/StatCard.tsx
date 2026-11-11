import type { ReactNode } from "react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import NumberTicker from "@/components/ui/NumberTicker";
import Sparkline from "@/components/ui/Sparkline";

const TINT = {
  indigo: {
    surface: "bg-primary/10 text-primary",
    spark: "hsl(var(--primary))",
  },
  emerald: {
    surface: "bg-success/10 text-success",
    spark: "hsl(var(--success))",
  },
  rose: {
    surface: "bg-destructive/10 text-destructive",
    spark: "hsl(var(--destructive))",
  },
  amber: {
    surface: "bg-warning/10 text-warning",
    spark: "hsl(var(--warning))",
  },
  sky: {
    surface: "bg-secondary text-secondary-foreground",
    spark: "hsl(var(--secondary-foreground))",
  },
} as const;

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: string; positive: boolean };
  className?: string;
  compact?: boolean;
  sparklineData?: number[];
  tint?: keyof typeof TINT;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
  compact = false,
  sparklineData,
  tint = "indigo",
}: StatCardProps) {
  const t = TINT[tint];

  // Safely parse numeric strings (e.g., "1,234.56" -> 1234.56)
  const numericValue = useMemo(() => {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const cleaned = value.replace(/,/g, "").trim();
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(cleaned)) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }, [value]);

  const isNumeric = numericValue !== null;

  // Fallback sparkline color
  const sparkColor = t.spark || "hsl(var(--primary))";

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card",
        className
      )}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", t.surface)}>
            {icon}
          </div>
        </div>

        <div className={cn("mt-3 font-semibold leading-tight tracking-tight tabular-nums text-foreground", compact ? "text-xl" : "text-2xl")}>
          {isNumeric ? <NumberTicker value={numericValue} /> : value}
        </div>

        {(subtitle || trend) && <div className="mt-2 flex items-center justify-between gap-2">
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : (
            <span />
          )}
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold",
                trend.positive
                  ? "text-success"
                  : "text-destructive"
              )}
            >
              <span
                className={cn(
                  "inline-block transition-transform duration-200",
                  trend.positive ? "rotate-0" : "rotate-180"
                )}
              >
                ↑
              </span>
              {trend.value}
            </span>
          )}
        </div>}

        {sparklineData && sparklineData.length > 1 && (
          <div className="mt-3 -mx-1">
            <Sparkline data={sparklineData} color={sparkColor} height={40} />
          </div>
        )}
      </div>
    </div>
  );
}

StatCard.displayName = "StatCard";
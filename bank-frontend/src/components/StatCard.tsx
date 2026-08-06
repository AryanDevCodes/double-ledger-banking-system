import type { ReactNode } from "react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import NumberTicker from "@/components/ui/NumberTicker";
import Sparkline from "@/components/ui/Sparkline";

/* ───────────────────────────────────────────
   Stat Card v2.1
   Premium metric card with sparkline, trend
   indicator, and gradient orb icon.
   ─────────────────────────────────────────── */

const TINT = {
  indigo: {
    orb: "bg-gradient-to-br from-[hsl(var(--chart-1))] to-[hsl(var(--chart-2))] shadow-lg shadow-[hsl(var(--chart-1))/20]",
    spark: "hsl(var(--chart-1))",
  },
  emerald: {
    orb: "bg-gradient-to-br from-[hsl(var(--chart-3))] to-[hsl(var(--chart-6))] shadow-lg shadow-[hsl(var(--chart-3))/20]",
    spark: "hsl(var(--chart-3))",
  },
  rose: {
    orb: "bg-gradient-to-br from-[hsl(var(--chart-5))] to-[hsl(var(--destructive))] shadow-lg shadow-[hsl(var(--chart-5))/20]",
    spark: "hsl(var(--chart-5))",
  },
  amber: {
    orb: "bg-gradient-to-br from-[hsl(var(--chart-4))] to-[hsl(var(--warning))] shadow-lg shadow-[hsl(var(--chart-4))/20]",
    spark: "hsl(var(--chart-4))",
  },
  sky: {
    orb: "bg-gradient-to-br from-[hsl(var(--chart-6))] to-[hsl(var(--chart-1))] shadow-lg shadow-[hsl(var(--chart-6))/20]",
    spark: "hsl(var(--chart-6))",
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
    if (typeof value === "number") return value;
    // Remove commas and try to parse
    const cleaned = value.replace(/,/g, "").trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }, [value]);

  const isNumeric = numericValue !== null;

  // Fallback sparkline color
  const sparkColor = t.spark || "hsl(var(--primary))";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl",
        "transition-all duration-300 ease-out",
        "hover:bg-card/80 hover:border-border/60 hover:-translate-y-0.5 hover:shadow-lg",
        className
      )}
    >
      {/* Subtle gradient sheen */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              {title}
            </p>
            <div
              className={cn(
                "mt-1 font-bold tracking-tight text-foreground",
                compact ? "text-xl" : "text-2xl"
              )}
            >
              {isNumeric ? <NumberTicker value={numericValue} /> : value}
            </div>
          </div>

          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white",
              t.orb
            )}
          >
            {icon}
          </div>
        </div>

        {(subtitle || trend) && <div className="my-3 h-px bg-border/50" />}

        <div className="flex items-center justify-between gap-2">
          {subtitle ? (
            <p className="text-xs text-muted-foreground/70 truncate">{subtitle}</p>
          ) : (
            <span /> // keeps trend aligned to the right when subtitle is absent
          )}
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold",
                trend.positive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
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
        </div>

        {sparklineData && sparklineData.length > 1 && (
          <div className="mt-3 -mx-1">
            <Sparkline data={sparklineData} color={sparkColor} height={40} strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  );
}

StatCard.displayName = "StatCard";
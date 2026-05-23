import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import NumberTicker from "@/components/ui/NumberTicker";
import Sparkline from "@/components/ui/Sparkline";

const TINT = {
  indigo: {
    bg: "from-indigo-500/30 to-violet-500/15",
    icon: "text-white",
    orb: "bg-gradient-to-br from-indigo-400 to-violet-600",
    glow: "shadow-[0_4px_20px_rgba(99,102,241,0.55)]",
    ring: "ring-indigo-400/40",
    spark: "#6366f1",
  },
  emerald: {
    bg: "from-emerald-500/30 to-teal-500/15",
    icon: "text-white",
    orb: "bg-gradient-to-br from-emerald-400 to-teal-600",
    glow: "shadow-[0_4px_20px_rgba(16,185,129,0.55)]",
    ring: "ring-emerald-400/40",
    spark: "#10b981",
  },
  rose: {
    bg: "from-rose-500/30 to-pink-500/15",
    icon: "text-white",
    orb: "bg-gradient-to-br from-rose-400 to-pink-600",
    glow: "shadow-[0_4px_20px_rgba(244,63,94,0.55)]",
    ring: "ring-rose-400/40",
    spark: "#f43f5e",
  },
  amber: {
    bg: "from-amber-500/30 to-orange-400/15",
    icon: "text-white",
    orb: "bg-gradient-to-br from-amber-400 to-orange-500",
    glow: "shadow-[0_4px_20px_rgba(245,158,11,0.55)]",
    ring: "ring-amber-400/40",
    spark: "#f59e0b",
  },
  sky: {
    bg: "from-sky-500/30 to-blue-500/15",
    icon: "text-white",
    orb: "bg-gradient-to-br from-sky-400 to-blue-600",
    glow: "shadow-[0_4px_20px_rgba(14,165,233,0.55)]",
    ring: "ring-sky-400/40",
    spark: "#0ea5e9",
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
  title, value, subtitle, icon, trend,
  className, compact = true, sparklineData, tint = "indigo",
}: StatCardProps) {
  const t = TINT[tint];
  const isNumeric = typeof value === "number";

  return (
    <div className={cn("stat-card stat-card--clean", className)}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <p className="stat-card-title">{title}</p>
        <p className={cn("stat-card-value mt-1 sm:mt-0 whitespace-nowrap", compact ? "text-lg" : "text-xl")}>
          {isNumeric ? <NumberTicker value={value} /> : value}
        </p>
      </div>
      {(subtitle || trend) && <div className="stat-card-divider" aria-hidden="true" />}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        {subtitle ? <p className="stat-card-subtitle">{subtitle}</p> : <span />}
        {trend ? (
          <p className={cn("stat-card-trend mt-1 sm:mt-0", trend.positive ? "text-emerald-600" : "text-rose-600")}>
            {trend.positive ? "↑" : "↓"} {trend.value}
          </p>
        ) : null}
      </div>
      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-2 -mx-1">
          <Sparkline data={sparklineData} color={t.spark} height={40} />
        </div>
      )}
    </div>
  );
}

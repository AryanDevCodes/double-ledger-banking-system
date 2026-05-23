import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FuturisticStatWidget {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  tint?: "indigo" | "emerald" | "rose" | "amber" | "sky" | "cyan" | "violet";
  trend?: { value: string; positive: boolean };
  sparklineData?: number[];
}

interface FuturisticStatsGridProps {
  widgets: FuturisticStatWidget[];
  loading?: boolean;
  skeletonCount?: number;
  columnsClassName?: string;
  role?: "admin" | "manager" | "customer-manager" | "auditor" | "user";
}

const TINT_COLORS = {
  indigo: { primary: "#6366f1", glow: "rgba(99, 102, 241, 0.4)", gradient: "from-indigo-500/30 to-violet-500/15" },
  emerald: { primary: "#10b981", glow: "rgba(16, 185, 129, 0.4)", gradient: "from-emerald-500/30 to-teal-500/15" },
  rose: { primary: "#f43f5e", glow: "rgba(244, 63, 94, 0.4)", gradient: "from-rose-500/30 to-pink-500/15" },
  amber: { primary: "#f59e0b", glow: "rgba(245, 158, 11, 0.4)", gradient: "from-amber-500/30 to-orange-400/15" },
  sky: { primary: "#0ea5e9", glow: "rgba(14, 165, 233, 0.4)", gradient: "from-sky-500/30 to-blue-500/15" },
  cyan: { primary: "#22d3ee", glow: "rgba(34, 211, 238, 0.4)", gradient: "from-cyan-500/30 to-sky-500/15" },
  violet: { primary: "#a78bfa", glow: "rgba(167, 139, 250, 0.4)", gradient: "from-violet-500/30 to-purple-500/15" },
};

function StatCardSkeleton() {
  return (
    <div className="stat-card-futuristic animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 bg-white/20 rounded" />
        <div className="h-8 w-8 bg-white/10 rounded-lg" />
      </div>
      <div className="mt-4 h-8 w-24 bg-white/20 rounded" />
      <div className="mt-2 h-3 w-16 bg-white/10 rounded" />
    </div>
  );
}

function FuturisticStatCard({ widget, index }: { widget: FuturisticStatWidget; index: number }) {
  const colors = TINT_COLORS[widget.tint || "indigo"];
  const isNumeric = typeof widget.value === "number";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="stat-card-futuristic group cursor-pointer"
      style={{
        "--neon-primary": colors.primary,
        "--neon-primary-glow": colors.glow,
      } as React.CSSProperties}
    >
      <div className="flex items-start justify-between">
        <div
          className="p-2.5 rounded-xl bg-gradient-to-br opacity-80 group-hover:opacity-100 transition-opacity"
          style={{ background: `linear-gradient(135deg, ${colors.primary}30, ${colors.primary}15)` }}
        >
          <div className="text-white" style={{ color: colors.primary }}>
            {widget.icon}
          </div>
        </div>
        {widget.trend && (
          <div
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              widget.trend.positive
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-rose-500/20 text-rose-400"
            )}
          >
            {widget.trend.positive ? "↑" : "↓"} {widget.trend.value}
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {widget.title}
        </p>
        <p
          className="text-2xl font-bold mt-1 tracking-tight metric-glow"
          style={{ color: colors.primary, textShadow: `0 0 30px ${colors.glow}` }}
        >
          {isNumeric ? (
            <NumberTickerAnimated value={widget.value as number} />
          ) : (
            widget.value
          )}
        </p>
        {widget.subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{widget.subtitle}</p>
        )}
      </div>

      {widget.sparklineData && widget.sparklineData.length > 1 && (
        <div className="mt-4 h-12">
          <SparklineMini data={widget.sparklineData} color={colors.primary} />
        </div>
      )}

      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg, transparent, ${colors.primary}, transparent)`,
        }}
      />
    </motion.div>
  );
}

function NumberTickerAnimated({ value }: { value: number }) {
  const display = value.toLocaleString();
  return <span>{display}</span>;
}

function SparklineMini({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 48;
  const width = 120;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#spark-${color.replace("#", "")})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-lg"
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  );
}

export default function FuturisticStatsGrid({
  widgets,
  loading = false,
  skeletonCount,
  columnsClassName = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  role,
}: FuturisticStatsGridProps) {
  const count = skeletonCount ?? widgets.length ?? 4;

  if (loading) {
    return (
      <div className={cn("grid gap-4 mb-6 stagger-children", columnsClassName)}>
        {Array.from({ length: count }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4 mb-6 stagger-children", columnsClassName)}>
      {widgets.map((w, i) => (
        <FuturisticStatCard key={w.id} widget={w} index={i} />
      ))}
    </div>
  );
}

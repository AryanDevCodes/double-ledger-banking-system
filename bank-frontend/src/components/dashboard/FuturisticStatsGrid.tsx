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
  indigo: { primary: "hsl(var(--primary))", surface: "bg-primary/10", text: "text-primary" },
  emerald: { primary: "hsl(var(--primary))", surface: "bg-primary/10", text: "text-primary" },
  rose: { primary: "hsl(var(--destructive))", surface: "bg-destructive/10", text: "text-destructive" },
  amber: { primary: "hsl(var(--warning))", surface: "bg-warning/10", text: "text-warning" },
  sky: { primary: "hsl(var(--primary))", surface: "bg-primary/10", text: "text-primary" },
  cyan: { primary: "hsl(var(--primary))", surface: "bg-primary/10", text: "text-primary" },
  violet: { primary: "hsl(var(--primary))", surface: "bg-primary/10", text: "text-primary" },
};

function StatCardSkeleton() {
  return (
    <div className="stat-card-futuristic animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="h-8 w-8 rounded-md bg-muted" />
      </div>
      <div className="mt-4 h-8 w-24 rounded bg-muted" />
      <div className="mt-2 h-3 w-16 rounded bg-muted" />
    </div>
  );
}

function FuturisticStatCard({ widget }: { widget: FuturisticStatWidget }) {
  const colors = TINT_COLORS[widget.tint || "indigo"];
  const isNumeric = typeof widget.value === "number";

  return (
    <article className="stat-card-futuristic">
      <div className="flex items-start justify-between">
        <div className={cn("rounded-md border border-border p-2.5", colors.surface)}>
          <div className={colors.text}>
            {widget.icon}
          </div>
        </div>
        {widget.trend && (
          <div
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              widget.trend.positive
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
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
        <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
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
    </article>
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
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={color}
        fillOpacity="0.1"
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
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
      {widgets.map((w) => (
        <FuturisticStatCard key={w.id} widget={w} />
      ))}
    </div>
  );
}

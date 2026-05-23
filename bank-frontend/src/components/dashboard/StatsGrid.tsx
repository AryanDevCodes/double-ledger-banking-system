import type { ReactNode } from "react";
import StatCard from "@/components/StatCard";
import { StatCardSkeleton } from "@/components/LoadingStates";

export interface StatWidgetDef {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  tint?: "indigo" | "emerald" | "rose" | "amber" | "sky";
}

interface StatsGridProps {
  widgets: StatWidgetDef[];
  loading?: boolean;
  skeletonCount?: number;
  columnsClassName?: string;
}

/**
 * Simple, page-specific stats grid. Each role dashboard picks the widgets that
 * are meaningful for that role; nothing here is hidden behind role flags.
 */
export default function StatsGrid({
  widgets,
  loading = false,
  skeletonCount,
  columnsClassName = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
}: StatsGridProps) {
  const count = skeletonCount ?? widgets.length ?? 4;

  if (loading) {
    return (
      <div className={`grid ${columnsClassName} gap-3 mb-6`}>
        {Array.from({ length: count }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${columnsClassName} gap-3 mb-6`}>
      {widgets.map((w) => (
        <StatCard
          key={w.id}
          title={w.title}
          value={w.value}
          icon={w.icon}
          subtitle={w.subtitle}
          tint={w.tint}
        />
      ))}
    </div>
  );
}

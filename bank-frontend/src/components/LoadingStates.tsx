import { cn } from "@/lib/utils";

function GlassSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden",
        "bg-[linear-gradient(90deg,var(--glass-border)_0%,hsl(var(--foreground)/0.12)_50%,var(--glass-border)_100%)]",
        "bg-[length:200%_100%] animate-shimmer",
        className,
      )}
    />
  );
}

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  className?: string;
}

export function TableSkeleton({ columns = 5, rows = 5, className }: TableSkeletonProps) {
  return (
    <div className={cn("w-full glass-panel rounded-2xl overflow-hidden", className)}>
      <div className="flex gap-4 border-b border-border p-4">
        {Array.from({ length: columns }).map((_, i) => (
          <GlassSkeleton key={i} className="h-3.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 border-b border-border/50 p-4 last:border-0">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <GlassSkeleton
              key={colIndex}
              className={cn("h-3.5 flex-1", colIndex === 0 && "max-w-[100px]")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("glass-panel rounded-2xl p-4 space-y-3", className)}>
      <div className="flex items-start justify-between">
        <GlassSkeleton className="h-3.5 w-20" />
        <GlassSkeleton className="h-9 w-9 rounded-xl" />
      </div>
      <GlassSkeleton className="h-7 w-28" />
      <GlassSkeleton className="h-3 w-16" />
      <GlassSkeleton className="h-9 w-full rounded-lg" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <GlassSkeleton className="h-8 w-48" />
        <GlassSkeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <TableSkeleton />
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <GlassSkeleton className="h-4 w-24" />
          <GlassSkeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
      <GlassSkeleton className="h-10 w-full rounded-xl mt-6" />
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex gap-3 p-3 glass-panel rounded-2xl">
          <GlassSkeleton className="h-9 w-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <GlassSkeleton className="h-4 w-3/4" />
            <GlassSkeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("glass-panel rounded-2xl p-5 space-y-4", className)}>
      <div className="flex items-center gap-3">
        <GlassSkeleton className="h-10 w-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <GlassSkeleton className="h-4 w-1/2" />
          <GlassSkeleton className="h-3 w-1/3" />
        </div>
      </div>
      <GlassSkeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}

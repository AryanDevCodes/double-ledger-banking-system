import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface QuickAction {
  to: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  badge?: string;
  badgeType?: "success" | "warning" | "danger" | "info";
}

interface FuturisticQuickActionsProps {
  title?: string;
  actions: QuickAction[];
  className?: string;
  columns?: number;
}

const BADGE_STYLES = {
  success: "badge-futuristic--success",
  warning: "badge-futuristic--warning",
  danger: "badge-futuristic--danger",
  info: "badge-futuristic--info",
};

export default function FuturisticQuickActions({
  title = "Quick Actions",
  actions,
  className,
  columns = 2,
}: FuturisticQuickActionsProps) {
  const gridClass = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2",
  }[columns] || "grid-cols-1 sm:grid-cols-2";

  return (
    <div className={cn("glass-card-futuristic p-5", className)}>
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-primary rounded-full" />
        {title}
      </h3>
      
      <div className={cn("grid gap-3", gridClass)}>
        {actions.map((action) => {
          const Icon = action.icon;
          
          return (
            <Link
              key={action.to}
              to={action.to}
              className="group flex items-start gap-3 rounded-md border border-border p-3 transition-colors hover:border-primary/30 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="rounded-md border border-border bg-primary/10 p-2 text-primary transition-colors group-hover:bg-primary/15">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{action.label}</span>
                  {action.badge && (
                    <span className={cn("badge-futuristic", BADGE_STYLES[action.badgeType || "info"])}>
                      {action.badge}
                    </span>
                  )}
                </div>
                {action.description && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {action.description}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

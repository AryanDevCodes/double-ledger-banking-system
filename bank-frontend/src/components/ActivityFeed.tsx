import { formatDate, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { 
  ArrowLeftRight, 
  UserPlus, 
  Shield, 
  Server, 
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle
} from "lucide-react";
import type { ActivityItem } from "@/types/api";

interface ActivityFeedProps {
  activities: ActivityItem[];
  className?: string;
  maxItems?: number;
}

const typeIcons = {
  transaction: ArrowLeftRight,
  account: CreditCard,
  customer: UserPlus,
  system: Server,
  security: Shield,
};

const statusColors = {
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
  info: "text-info",
};

const statusIcons = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

export default function ActivityFeed({ activities, className, maxItems = 10 }: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className={cn("space-y-1", className)}>
      {displayActivities.map((activity, index) => {
        const TypeIcon = typeIcons[activity.type];
        const StatusIcon = activity.status ? statusIcons[activity.status] : null;
        
        return (
          <div
            key={activity.id}
            className={cn(
              "flex gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50",
              index === 0 && "bg-muted/30"
            )}
          >
            {/* Icon */}
            <div className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              activity.status === "error" && "bg-destructive/10",
              activity.status === "warning" && "bg-warning/10",
              activity.status === "success" && "bg-success/10",
              activity.status === "info" && "bg-info/10",
              !activity.status && "bg-muted"
            )}>
              <TypeIcon className={cn(
                "h-4 w-4",
                activity.status ? statusColors[activity.status] : "text-muted-foreground"
              )} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-tight">{activity.title}</p>
                {StatusIcon && (
                  <StatusIcon className={cn("h-4 w-4 shrink-0", statusColors[activity.status!])} />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {activity.description}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-muted-foreground">
                  {formatRelativeTime(activity.timestamp)}
                </span>
                {activity.userName && (
                  <>
                    <span className="text-[10px] text-muted-foreground">•</span>
                    <span className="text-[10px] text-muted-foreground">
                      {activity.userName}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {displayActivities.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No recent activity
        </div>
      )}
    </div>
  );
}

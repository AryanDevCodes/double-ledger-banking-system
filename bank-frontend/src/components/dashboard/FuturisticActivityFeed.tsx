import { cn } from "@/lib/utils";
import { 
  ArrowUpRight, 
  CreditCard, 
  Shield, 
  Users, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Activity
} from "lucide-react";

export interface ActivityEvent {
  id: string;
  type: "transaction" | "security" | "account" | "kyc" | "system";
  title: string;
  description: string;
  timestamp: string;
  status: "success" | "pending" | "failed" | "warning";
  amount?: string;
  user?: string;
}

interface FuturisticActivityFeedProps {
  events: ActivityEvent[];
  maxEvents?: number;
  title?: string;
  className?: string;
  onEventClick?: (event: ActivityEvent) => void;
}

const TYPE_ICONS = {
  transaction: ArrowUpRight,
  security: Shield,
  account: CreditCard,
  kyc: Users,
  system: Activity,
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function ActivityEventItem({ 
  event, 
  onClick 
}: { 
  event: ActivityEvent; 
  onClick?: () => void;
}) {
  const Icon = TYPE_ICONS[event.type];

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "activity-item group w-full text-left",
        onClick && "cursor-pointer hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
      onClick={onClick}
      onKeyDown={(keyboardEvent) => {
        if (onClick && (keyboardEvent.key === "Enter" || keyboardEvent.key === " ")) {
          keyboardEvent.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-md border border-border bg-muted/40 p-2 text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground truncate">
              {event.title}
            </p>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatTimestamp(event.timestamp)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {event.description}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            {event.amount && (
              <span className="text-xs font-medium text-foreground">
                {event.amount}
              </span>
            )}
            {event.user && (
              <span className="text-xs text-muted-foreground">
                • {event.user}
              </span>
            )}
            <span className={cn("badge-futuristic", `badge-futuristic--${event.status === 'warning' ? 'warning' : event.status}`)}>
              {event.status === 'success' && <CheckCircle2 className="w-3 h-3" />}
              {event.status === 'failed' && <XCircle className="w-3 h-3" />}
              {event.status === 'pending' && <Clock className="w-3 h-3" />}
              {event.status === 'warning' && <AlertTriangle className="w-3 h-3" />}
              {event.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FuturisticActivityFeed({
  events,
  maxEvents = 8,
  title = "Recent activity",
  className,
  onEventClick,
}: FuturisticActivityFeedProps) {
  const displayedEvents = events.slice(0, maxEvents);

  return (
    <div className={cn("glass-card-futuristic p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
      </div>

      <div className="space-y-0">
        {displayedEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          displayedEvents.map((event) => (
            <ActivityEventItem
              key={event.id}
              event={event}
              onClick={onEventClick ? () => onEventClick(event) : undefined}
            />
          ))
        )}
      </div>

      {events.length > maxEvents && (
        <div className="mt-4 pt-4 border-t border-border">
          <button className="text-xs text-primary hover:text-primary/80 transition-colors">
            View all {events.length} events →
          </button>
        </div>
      )}
    </div>
  );
}

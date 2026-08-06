import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Shield, 
  Users, 
  Building2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Activity
} from "lucide-react";

export interface ActivityEvent {
  id: string;
  type: "transaction" | "security" | "account" | "kyc" | "system" | "webhook";
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
  webhook: Building2,
};

const STATUS_COLORS = {
  success: { bg: "bg-success/15", text: "text-success", border: "border-success/30" },
  pending: { bg: "bg-warning/15", text: "text-warning", border: "border-warning/30" },
  failed: { bg: "bg-destructive/15", text: "text-destructive", border: "border-destructive/30" },
  warning: { bg: "bg-info/15", text: "text-info", border: "border-info/30" },
};

const TYPE_COLORS = {
  transaction: "hsl(var(--chart-1))",
  security: "hsl(var(--chart-5))",
  account: "hsl(var(--chart-2))",
  kyc: "hsl(var(--chart-4))",
  system: "hsl(var(--chart-3))",
  webhook: "hsl(var(--chart-6))",
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
  index,
  onClick 
}: { 
  event: ActivityEvent; 
  index: number;
  onClick?: () => void;
}) {
  const Icon = TYPE_ICONS[event.type];
  const statusColor = STATUS_COLORS[event.status];
  const typeColor = TYPE_COLORS[event.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="activity-item group cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div 
          className="relative p-2 rounded-lg bg-muted/30"
          style={{ 
            boxShadow: `0 0 15px ${typeColor}30`,
          }}
        >
          <Icon className="w-4 h-4" style={{ color: typeColor }} />
          <div 
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full pulse-live"
            style={{ backgroundColor: `hsl(var(--${event.status === 'success' ? 'success' : event.status === 'pending' ? 'warning' : event.status === 'failed' ? 'destructive' : 'info'}))` }}
          />
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
              <span className="text-xs font-mono" style={{ color: typeColor }}>
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
    </motion.div>
  );
}

export default function FuturisticActivityFeed({
  events,
  maxEvents = 8,
  title = "Live Activity",
  className,
  onEventClick,
}: FuturisticActivityFeedProps) {
  const displayedEvents = events.slice(0, maxEvents);

  return (
    <div className={cn("glass-card-futuristic p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
              <Activity className="w-4 h-4 text-primary" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full pulse-live" />
          </div>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <span className="badge-futuristic badge-futuristic--info">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          Live
        </span>
      </div>

      <div className="space-y-0">
        {displayedEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          displayedEvents.map((event, index) => (
            <ActivityEventItem
              key={event.id}
              event={event}
              index={index}
              onClick={() => onEventClick?.(event)}
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

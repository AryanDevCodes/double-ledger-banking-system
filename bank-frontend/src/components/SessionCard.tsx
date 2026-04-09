import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Monitor, 
  Smartphone, 
  Globe, 
  LogOut,
  Clock
} from "lucide-react";
import type { SessionInfo } from "@/lib/api-client";

interface SessionCardProps {
  session: SessionInfo;
  isCurrent?: boolean;
  onTerminate?: (sessionId: string) => void;
}

export default function SessionCard({ session, isCurrent = false, onTerminate }: SessionCardProps) {
  const isDesktop = session.userAgent.toLowerCase().includes("windows") || 
                    session.userAgent.toLowerCase().includes("mac");
  
  const DeviceIcon = isDesktop ? Monitor : Smartphone;

  return (
    <div className={cn(
      "glass-card p-4 transition-all",
      isCurrent && "ring-2 ring-primary/40 shadow-lg",
      !session.isActive && "opacity-60"
    )}>
      <div className="flex items-start gap-4">
        {/* Device Icon */}
        <div className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          session.isActive ? "bg-primary/10" : "bg-muted"
        )}>
          <DeviceIcon className={cn(
            "h-5 w-5",
            session.isActive ? "text-primary" : "text-muted-foreground"
          )} />
        </div>

        {/* Session Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold truncate">{session.userName}</h4>
            {isCurrent && (
              <Badge variant="outline" className="text-[10px] py-0 h-5 bg-primary/10 text-primary border-primary/20">
                Current
              </Badge>
            )}
            {!session.isActive && (
              <Badge variant="outline" className="text-[10px] py-0 h-5">
                Inactive
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground mb-2 truncate">
            {session.userAgent}
          </p>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {session.ipAddress}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(session.lastActivity)}
            </span>
          </div>
        </div>

        {/* Actions */}
        {!isCurrent && session.isActive && onTerminate && (
            <Button
            variant="ghost"
            size="sm"
              className="shrink-0 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onTerminate(session.id)}
          >
            <LogOut className="h-4 w-4 mr-1" />
            End
          </Button>
        )}
      </div>

      {/* Time Details */}
      <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-4 text-[11px] text-muted-foreground">
        <span>Started: {formatDateTime(session.createdAt)}</span>
        <span>Expires: {formatDateTime(session.expiresAt)}</span>
      </div>
    </div>
  );
}

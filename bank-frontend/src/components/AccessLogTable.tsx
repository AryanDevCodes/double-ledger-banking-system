import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  LogIn, 
  LogOut, 
  KeyRound, 
  Shield,
  ShieldOff,
  CheckCircle,
  XCircle,
  MapPin
} from "lucide-react";
import type { AccessLogEntry } from "@/lib/api-client";

interface AccessLogTableProps {
  logs: AccessLogEntry[];
  className?: string;
}

const eventIcons = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  FAILED_LOGIN: XCircle,
  PASSWORD_CHANGE: KeyRound,
  MFA_ENABLED: Shield,
  MFA_DISABLED: ShieldOff,
};

const eventColors = {
  LOGIN: "bg-success/10 text-success border-success/20",
  LOGOUT: "bg-muted text-muted-foreground border-border",
  FAILED_LOGIN: "bg-destructive/10 text-destructive border-destructive/20",
  PASSWORD_CHANGE: "bg-warning/10 text-warning border-warning/20",
  MFA_ENABLED: "bg-primary/10 text-primary border-primary/20",
  MFA_DISABLED: "bg-destructive/10 text-destructive border-destructive/20",
};

const eventLabels = {
  LOGIN: "Login",
  LOGOUT: "Logout",
  FAILED_LOGIN: "Failed Login",
  PASSWORD_CHANGE: "Password Change",
  MFA_ENABLED: "MFA Enabled",
  MFA_DISABLED: "MFA Disabled",
};

export default function AccessLogTable({ logs, className }: AccessLogTableProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Timestamp</TableHead>
            <TableHead>User</TableHead>
            <TableHead className="w-[130px]">Event</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="w-[120px]">IP Address</TableHead>
            <TableHead className="w-[80px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const EventIcon = eventIcons[log.eventType];
            return (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {formatDateTime(log.timestamp)}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium">{log.userName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{log.userId}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("gap-1", eventColors[log.eventType])}>
                    <EventIcon className="h-3 w-3" />
                    {eventLabels[log.eventType]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {log.location ? (
                    <span className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {log.location}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {log.ipAddress}
                </TableCell>
                <TableCell>
                  {log.success ? (
                    <span className="inline-flex items-center gap-1 text-success text-xs font-medium">
                      <CheckCircle className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-destructive text-xs font-medium">
                      <XCircle className="h-3.5 w-3.5" />
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No access logs found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

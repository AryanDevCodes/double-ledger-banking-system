import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Eye, 
  Plus, 
  Pencil, 
  Trash2, 
  LogIn, 
  LogOut, 
  Download,
  CheckCircle,
  XCircle 
} from "lucide-react";
import type { AuditLogEntry } from "@/lib/api-client";

interface AuditLogTableProps {
  logs: AuditLogEntry[];
  className?: string;
  compact?: boolean;
}

const actionIcons = {
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
  VIEW: Eye,
  LOGIN: LogIn,
  LOGOUT: LogOut,
  EXPORT: Download,
};

const actionColors = {
  CREATE: "bg-success/10 text-success border-success/20",
  UPDATE: "bg-info/10 text-info border-info/20",
  DELETE: "bg-destructive/10 text-destructive border-destructive/20",
  VIEW: "bg-muted text-muted-foreground border-border",
  LOGIN: "bg-primary/10 text-primary border-primary/20",
  LOGOUT: "bg-muted text-muted-foreground border-border",
  EXPORT: "bg-warning/10 text-warning border-warning/20",
};

export default function AuditLogTable({ logs, className, compact = false }: AuditLogTableProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Timestamp</TableHead>
            <TableHead>User</TableHead>
            <TableHead className="w-[100px]">Action</TableHead>
            <TableHead>Resource</TableHead>
            {!compact && <TableHead>Details</TableHead>}
            <TableHead className="w-[100px]">Status</TableHead>
            {!compact && <TableHead className="w-[120px]">IP Address</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const ActionIcon = actionIcons[log.action];
            return (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {formatDate(log.timestamp, true)}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium">{log.userName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{log.userId}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("gap-1", actionColors[log.action])}>
                    <ActionIcon className="h-3 w-3" />
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{log.resource}</p>
                    <p className="text-xs text-muted-foreground font-mono">{log.resourceId}</p>
                  </div>
                </TableCell>
                {!compact && (
                  <TableCell className="max-w-[300px]">
                    <p className="text-xs text-muted-foreground truncate">{log.details}</p>
                  </TableCell>
                )}
                <TableCell>
                  {log.status === "SUCCESS" ? (
                    <span className="inline-flex items-center gap-1 text-success text-xs font-medium">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Success
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-destructive text-xs font-medium">
                      <XCircle className="h-3.5 w-3.5" />
                      Failed
                    </span>
                  )}
                </TableCell>
                {!compact && (
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.ipAddress}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
          {logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={compact ? 5 : 7} className="text-center py-8 text-muted-foreground">
                No audit logs found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

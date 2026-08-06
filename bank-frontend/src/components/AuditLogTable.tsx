import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  Plus,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  Download,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { AuditLogEntry } from "@/lib/api-client";

/* ───────────────────────────────────────────
   Audit Log Table v2.0
   Premium data table with semantic action
   badges, status indicators, and improved
   information density.
   ─────────────────────────────────────────── */

interface AuditLogTableProps {
  logs: AuditLogEntry[];
  className?: string;
  compact?: boolean;
}

const ACTION_META: Record<
  string,
  { icon: typeof Eye; label: string; variant: string }
> = {
  CREATE: { icon: Plus, label: "Create", variant: "badge-success" },
  UPDATE: { icon: Pencil, label: "Update", variant: "badge-info" },
  DELETE: { icon: Trash2, label: "Delete", variant: "badge-destructive" },
  VIEW: { icon: Eye, label: "View", variant: "badge-neutral" },
  LOGIN: { icon: LogIn, label: "Login", variant: "badge-success" },
  LOGOUT: { icon: LogOut, label: "Logout", variant: "badge-neutral" },
  EXPORT: { icon: Download, label: "Export", variant: "badge-warning" },
};

function ActionBadge({ action }: { action: string }) {
  const meta = ACTION_META[action] || {
    icon: Eye,
    label: action,
    variant: "badge-neutral",
  };
  const Icon = meta.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium text-[11px] px-2 py-0.5 rounded-md border",
        meta.variant
      )}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
}

function StatusIndicator({ status }: { status: string }) {
  const isSuccess = status === "SUCCESS";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold",
        isSuccess ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
      )}
    >
      {isSuccess ? (
        <CheckCircle className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}
      {isSuccess ? "Success" : "Failed"}
    </span>
  );
}

export default function AuditLogTable({
  logs,
  className,
  compact = false,
}: AuditLogTableProps) {
  const colCount = compact ? 5 : 7;

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm",
        className
      )}
    >
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border/60 hover:bg-transparent">
            <TableHead className="w-[140px] text-[10px] uppercase tracking-wider">
              Timestamp
            </TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider">
              User
            </TableHead>
            <TableHead className="w-[100px] text-[10px] uppercase tracking-wider">
              Action
            </TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider">
              Resource
            </TableHead>
            {!compact && (
              <TableHead className="text-[10px] uppercase tracking-wider">
                Details
              </TableHead>
            )}
            <TableHead className="w-[100px] text-[10px] uppercase tracking-wider">
              Status
            </TableHead>
            {!compact && (
              <TableHead className="w-[120px] text-[10px] uppercase tracking-wider">
                IP Address
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow
              key={log.id}
              className="border-b border-border/30 transition-colors hover:bg-muted/30"
            >
              <TableCell className="font-mono text-[11px] text-muted-foreground/80">
                {formatDate(log.timestamp, true)}
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm font-medium">{log.userName}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {log.userId}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <ActionBadge action={log.action} />
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm">{log.resource}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {log.resourceId}
                  </p>
                </div>
              </TableCell>
              {!compact && (
                <TableCell className="max-w-[300px]">
                  <p className="text-xs text-muted-foreground truncate">
                    {log.details}
                  </p>
                </TableCell>
              )}
              <TableCell>
                <StatusIndicator status={log.status} />
              </TableCell>
              {!compact && (
                <TableCell className="font-mono text-[11px] text-muted-foreground/80">
                  {log.ipAddress}
                </TableCell>
              )}
            </TableRow>
          ))}

          {logs.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={colCount}
                className="text-center py-12 text-muted-foreground/60"
              >
                <div className="flex flex-col items-center gap-2">
                  <Eye className="h-5 w-5 opacity-40" />
                  <span className="text-sm">No audit logs found</span>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
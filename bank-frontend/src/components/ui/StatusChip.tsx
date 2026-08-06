import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type StatusVariant =
  | "completed"
  | "success"
  | "active"
  | "pending"
  | "processing"
  | "failed"
  | "error"
  | "inactive"
  | "warning"
  | "info"
  | "neutral";

interface StatusChipProps {
  status: StatusVariant | string;
  label?: string;
  dot?: boolean;
  className?: string;
  icon?: ReactNode;
}

const variantMap: Record<StatusVariant, string> = {
  completed:
    "bg-success/12 text-success border-success/25",
  success:
    "bg-success/12 text-success border-success/25",
  active:
    "bg-info/12 text-info border-info/25",
  pending:
    "bg-warning/12 text-warning border-warning/25",
  processing:
    "bg-primary/12 text-primary border-primary/25",
  failed:
    "bg-destructive/12 text-destructive border-destructive/25",
  error:
    "bg-destructive/12 text-destructive border-destructive/25",
  inactive:
    "bg-muted/30 text-muted-foreground border-border",
  warning:
    "bg-warning/12 text-warning border-warning/25",
  info:
    "bg-info/12 text-info border-info/25",
  neutral:
    "bg-muted/30 text-muted-foreground border-border",
};

const dotColorMap: Record<StatusVariant, string> = {
  completed: "bg-success",
  success: "bg-success",
  active: "bg-info",
  pending: "bg-warning",
  processing: "bg-primary",
  failed: "bg-destructive",
  error: "bg-destructive",
  inactive: "bg-muted-foreground",
  warning: "bg-warning",
  info: "bg-info",
  neutral: "bg-muted-foreground",
};

function normalizeStatus(raw: string): StatusVariant {
  const key = raw.toLowerCase().replace(/[^a-z]/g, "") as StatusVariant;
  return key in variantMap ? key : "neutral";
}

export default function StatusChip({ status, label, dot = false, className, icon }: StatusChipProps) {
  const key = normalizeStatus(status);
  const styles = variantMap[key] ?? variantMap.neutral;
  const dotColor = dotColorMap[key] ?? dotColorMap.neutral;
  const displayLabel = label ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        styles,
        className,
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotColor)}
        />
      )}
      {icon && <span className="shrink-0 [&>svg]:h-3 [&>svg]:w-3">{icon}</span>}
      {displayLabel}
    </span>
  );
}

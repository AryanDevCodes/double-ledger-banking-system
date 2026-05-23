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
    "bg-emerald-500/12 text-emerald-700 border-emerald-500/25 dark:text-emerald-400",
  success:
    "bg-emerald-500/12 text-emerald-700 border-emerald-500/25 dark:text-emerald-400",
  active:
    "bg-sky-500/12 text-sky-700 border-sky-500/25 dark:text-sky-400",
  pending:
    "bg-amber-500/12 text-amber-700 border-amber-500/25 dark:text-amber-400",
  processing:
    "bg-violet-500/12 text-violet-700 border-violet-500/25 dark:text-violet-400",
  failed:
    "bg-red-500/12 text-red-700 border-red-500/25 dark:text-red-400",
  error:
    "bg-red-500/12 text-red-700 border-red-500/25 dark:text-red-400",
  inactive:
    "bg-slate-500/10 text-slate-500 border-slate-500/20 dark:text-slate-400",
  warning:
    "bg-amber-500/12 text-amber-700 border-amber-500/25 dark:text-amber-400",
  info:
    "bg-sky-500/12 text-sky-700 border-sky-500/25 dark:text-sky-400",
  neutral:
    "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400",
};

const dotColorMap: Record<StatusVariant, string> = {
  completed: "bg-emerald-500",
  success: "bg-emerald-500",
  active: "bg-sky-500",
  pending: "bg-amber-500",
  processing: "bg-violet-500",
  failed: "bg-red-500",
  error: "bg-red-500",
  inactive: "bg-slate-400",
  warning: "bg-amber-500",
  info: "bg-sky-500",
  neutral: "bg-slate-400",
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

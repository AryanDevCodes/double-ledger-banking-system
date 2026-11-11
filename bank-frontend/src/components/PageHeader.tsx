import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  titleClassName?: string;
}

export default function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  className,
  titleClassName,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "page-header flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          {icon ? (
            <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/60 text-primary",
            )}>
              {icon}
            </div>
          ) : null}

          <div className="min-w-0">
            <h1 className={cn("page-title truncate", titleClassName)}>{title}</h1>
            {subtitle ? <div className="page-subtitle">{subtitle}</div> : null}
          </div>
        </div>
      </div>

      {actions ? (
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

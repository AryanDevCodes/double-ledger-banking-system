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
        "page-header flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          {icon ? (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm">
              {icon}
            </div>
          ) : null}

          <div className="min-w-0">
            <h1 className={cn("page-title truncate", titleClassName)}>{title}</h1>
            {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
          </div>
        </div>
      </div>

      {actions ? <div className="flex items-center gap-2 flex-wrap">{actions}</div> : null}
    </div>
  );
}

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export default function SectionHeader({ title, description, actions, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3 mb-4", className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-[var(--ink-primary)] tracking-tight">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

import { cn } from "@/lib/utils";
import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

interface GlassTableProps {
  children: ReactNode;
  className?: string;
  stickyHeader?: boolean;
}

export function GlassTable({ children, className, stickyHeader = true }: GlassTableProps) {
  return (
    <div
      className={cn(
        "glass-panel rounded-2xl overflow-hidden",
        stickyHeader && "[&_thead_tr_th]:sticky [&_thead_tr_th]:top-0 [&_thead_tr_th]:z-10",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    </div>
  );
}

export function GlassTableHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <thead className={cn("border-b border-[var(--glass-border)]", className)}>
      {children}
    </thead>
  );
}

export function GlassTableBody({ children, className }: { children: ReactNode; className?: string }) {
  return <tbody className={cn("divide-y divide-[var(--glass-border)]/50", className)}>{children}</tbody>;
}

export function GlassTableRow({
  children,
  className,
  selected,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "transition-all duration-150 group",
        "hover:bg-white/40 dark:hover:bg-white/[0.04] hover:scale-[1.001]",
        "odd:bg-transparent even:bg-white/[0.02] dark:even:bg-white/[0.015]",
        selected && "bg-indigo-500/10 dark:bg-indigo-500/15",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function GlassTableHead({
  children,
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]",
        "bg-[var(--glass-bg)] backdrop-blur-glass",
        "whitespace-nowrap",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function GlassTableCell({
  children,
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <td
      className={cn("px-4 py-3 text-sm text-[var(--ink-primary)]", className)}
      {...props}
    >
      {children}
    </td>
  );
}

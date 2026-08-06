import { cn } from "@/lib/utils";
import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

export function GlassTable({ children, className, stickyHeader = true }: { children: ReactNode; className?: string; stickyHeader?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden",
        stickyHeader && "[&_thead_tr_th]:sticky [&_thead_tr_th]:top-0 [&_thead_tr_th]:z-10",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    </div>
  );
}

export function GlassTableHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <thead className={cn("border-b border-border/60", className)}>{children}</thead>;
}

export function GlassTableBody({ children, className }: { children: ReactNode; className?: string }) {
  return <tbody className={cn("divide-y divide-border/40", className)}>{children}</tbody>;
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
        "transition-colors duration-150",
        "hover:bg-muted/30",
        "even:bg-card/30",
        selected && "bg-primary/10",
        onClick && "cursor-pointer",
        className
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
        "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground",
        "bg-card/80 backdrop-blur-sm",
        "whitespace-nowrap",
        className
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
    <td className={cn("px-4 py-3 text-sm text-foreground", className)} {...props}>
      {children}
    </td>
  );
}
import type { ReactNode } from "react";
import { Activity as ActivityIcon, type LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TransactionResponseDTO } from "@/types/api";
import { formatDate, type DashboardTrendPoint } from "./dashboard-data";

type DashboardTone = "blue" | "green" | "violet" | "amber" | "rose" | "slate";

const toneStyles: Record<DashboardTone, string> = {
  blue: "bg-muted text-muted-foreground",
  green: "bg-primary/10 text-primary",
  violet: "bg-secondary text-secondary-foreground",
  amber: "bg-warning/10 text-warning",
  rose: "bg-destructive/10 text-destructive",
  slate: "bg-muted text-muted-foreground",
};

export function DashboardHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  updatedAt,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  updatedAt?: Date | null;
  actions?: ReactNode;
}) {
  return (
    <section className="border-b border-border pb-5 sm:pb-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/60 text-primary">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </p>
            <h1 className="mt-1 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {updatedAt && (
            <span className="mr-1 text-xs text-muted-foreground">
              Updated {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {actions}
        </div>
      </div>
    </section>
  );
}

export function DashboardMetric({
  label,
  value,
  detail,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  tone?: DashboardTone;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", toneStyles[tone])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 break-words text-xl font-semibold leading-tight tracking-tight tabular-nums text-foreground sm:text-2xl 2xl:text-xl">
        {value}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </article>
  );
}

export function DashboardPanel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-border bg-card", className)}>
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function DashboardEmpty({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-9 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted/60 text-muted-foreground">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

export function DashboardTrend({
  title,
  description,
  points,
  formatValue = (value) => value.toLocaleString(),
}: {
  title: string;
  description: string;
  points: DashboardTrendPoint[];
  formatValue?: (value: number) => string;
}) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);

  return (
    <DashboardPanel title={title} description={description}>
      {points.length === 0 ? (
        <DashboardEmpty title="No activity to chart" description="Data will appear here as activity is recorded." icon={ActivityIcon} />
      ) : (
        <>
          <div className="flex h-36 items-end gap-2 sm:gap-4" role="img" aria-label={`${title} chart`}>
            {points.map((point) => (
              <div key={point.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <span className="max-w-full truncate text-[10px] text-muted-foreground" title={formatValue(point.value)}>
                  {formatValue(point.value)}
                </span>
                <div className="flex h-24 w-full items-end rounded-sm bg-muted/60 p-1">
                  <div
                    className="w-full bg-primary/80 transition-[height]"
                    style={{ height: point.value > 0 ? `${Math.max((point.value / maxValue) * 100, 4)}%` : "0%" }}
                    title={`${point.label}: ${formatValue(point.value)}`}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{point.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </DashboardPanel>
  );
}

export function DashboardTransactions({
  transactions,
  accountNumbers,
  emptyTitle = "No transactions yet",
  emptyDescription = "Completed activity will show here.",
}: {
  transactions: readonly TransactionResponseDTO[];
  accountNumbers?: ReadonlySet<string>;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const recent = [...transactions]
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
    .slice(0, 5);

  if (recent.length === 0) {
    return <DashboardEmpty title={emptyTitle} description={emptyDescription} icon={ActivityIcon} />;
  }

  return (
    <div className="divide-y divide-border/60">
      {recent.map((transaction) => {
        const personal = accountNumbers !== undefined;
        const sent = accountNumbers?.has(transaction.senderAccountNumber) ?? false;
        const otherAccount = sent ? transaction.receiverAccountNumber : transaction.senderAccountNumber;
        const otherName = personal
          ? sent ? transaction.receiverName : transaction.senderName
          : `${transaction.senderName} → ${transaction.receiverName}`;
        const avatarName = personal ? otherName : transaction.senderName;
        const initials = avatarName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
        const amountPrefix = personal ? sent ? "−" : "+" : "";
        const amountColor = !personal
          ? "text-foreground"
          : sent
            ? "text-destructive"
            : "text-success";
        const avatarColor = !personal
          ? "bg-primary/10 text-primary"
          : sent
            ? "bg-destructive/10 text-destructive"
            : "bg-success/10 text-success";
        const status = transaction.status.toLowerCase();
        const completed = status === "completed" || status === "success";
        const failed = status === "failed" || status === "reversed";

        return (
          <div key={transaction.transactionId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold", avatarColor)}>
              {initials || "?"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{otherName}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {personal
                  ? `${sent ? "To" : "From"} · A/c •••• ${otherAccount.slice(-4)} · `
                  : ""}
                {formatDate(transaction.transactionDate)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className={cn("font-mono text-sm font-semibold tabular-nums", amountColor)}>
                {amountPrefix}{formatCurrency(transaction.amount)}
              </p>
              <span className={cn(
                "mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                completed ? "bg-success/10 text-success"
                  : failed ? "bg-destructive/10 text-destructive"
                    : "bg-warning/10 text-warning",
              )}>
                {status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}


import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  FileCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import type { ComplianceMetrics } from "@/types/api";
import { formatDate } from "@/lib/format";

/* ───────────────────────────────────────────
   Compliance Card v2.0
   Radial-inspired progress, metric grid with
   gradient orbs, and contextual status chips.
   ─────────────────────────────────────────── */

interface ComplianceCardProps {
  metrics: ComplianceMetrics;
  className?: string;
}

type Status = "excellent" | "good" | "needs_attention";

function getStatus(kyc: number): Status {
  if (kyc >= 95) return "excellent";
  if (kyc >= 85) return "good";
  return "needs_attention";
}

const STATUS_CONFIG: Record<
  Status,
  { label: string; chip: string; progress: string }
> = {
  excellent: {
    label: "Excellent",
    chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    progress: "bg-emerald-500",
  },
  good: {
    label: "Good Standing",
    chip: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
    progress: "bg-sky-500",
  },
  needs_attention: {
    label: "Needs Attention",
    chip: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    progress: "bg-amber-500",
  },
};

const METRICS = [
  {
    key: "amlChecks" as const,
    label: "AML Checks",
    icon: FileCheck,
    tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "pendingReviews" as const,
    label: "Pending Reviews",
    icon: Clock,
    tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    key: "flaggedTransactions" as const,
    label: "Flagged Txns",
    icon: AlertTriangle,
    tint: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  {
    key: "auditReady" as const,
    label: "Audit Ready",
    icon: CheckCircle2,
    tint: "bg-primary/10 text-primary",
    staticValue: "100%",
  },
];

export default function ComplianceCard({
  metrics,
  className,
}: ComplianceCardProps) {
  const status = getStatus(metrics.kycCompliance);
  const config = STATUS_CONFIG[status];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/50 bg-card/70 backdrop-blur-xl p-6",
        "shadow-sm transition-all duration-300 hover:shadow-md hover:border-border/70",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-foreground">Compliance Overview</h3>
        </div>
        <span
          className={cn(
            "text-[11px] font-semibold px-2.5 py-1 rounded-full border",
            config.chip
          )}
        >
          {config.label}
        </span>
      </div>

      {/* KYC Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            KYC Compliance Rate
          </span>
          <span className="text-sm font-bold tabular-nums">
            {metrics.kycCompliance}%
          </span>
        </div>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-out",
              config.progress
            )}
            style={{ width: `${metrics.kycCompliance}%` }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {METRICS.map((m) => {
          const Icon = m.icon;
          const value = m.staticValue ?? (metrics[m.key] as number | string);
          return (
            <div
              key={m.key}
              className="flex items-start gap-3 rounded-xl border border-border/40 bg-muted/20 p-3 transition-colors hover:bg-muted/40"
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  m.tint
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold tabular-nums leading-tight">
                  {value}
                </p>
                <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                  {m.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Audit Dates */}
      <div className="mt-5 pt-4 border-t border-border/40">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span>Last audit: {formatDate(metrics.lastAuditDate)}</span>
          <span className="mx-1 text-border">•</span>
          <span>Next: {formatDate(metrics.nextAuditDate)}</span>
        </div>
      </div>
    </div>
  );
}
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  FileCheck, 
  AlertTriangle, 
  Clock,
  CheckCircle,
  CalendarDays
} from "lucide-react";
import type { ComplianceMetrics } from "@/types/api";
import { formatDate } from "@/lib/format";

interface ComplianceCardProps {
  metrics: ComplianceMetrics;
  className?: string;
}

export default function ComplianceCard({ metrics, className }: ComplianceCardProps) {
  const complianceStatus = metrics.kycCompliance >= 95 
    ? "excellent" 
    : metrics.kycCompliance >= 85 
      ? "good" 
      : "needs_attention";

  return (
    <div className={cn("glass-card p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Compliance Overview
        </h3>
        <span className={cn(
          "text-xs font-medium px-2 py-1 rounded-full",
          complianceStatus === "excellent" && "bg-success/10 text-success",
          complianceStatus === "good" && "bg-info/10 text-info",
          complianceStatus === "needs_attention" && "bg-warning/10 text-warning"
        )}>
          {complianceStatus === "excellent" && "Excellent"}
          {complianceStatus === "good" && "Good Standing"}
          {complianceStatus === "needs_attention" && "Needs Attention"}
        </span>
      </div>

      {/* KYC Compliance Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">KYC Compliance Rate</span>
          <span className="text-sm font-semibold">{metrics.kycCompliance}%</span>
        </div>
        <Progress 
          value={metrics.kycCompliance} 
          className="h-2" 
        />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10">
            <FileCheck className="h-4 w-4 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">{metrics.amlChecks}</p>
            <p className="text-xs text-muted-foreground">AML Checks</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning/10">
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold">{metrics.pendingReviews}</p>
            <p className="text-xs text-muted-foreground">Pending Reviews</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold">{metrics.flaggedTransactions}</p>
            <p className="text-xs text-muted-foreground">Flagged Txns</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <CheckCircle className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">100%</p>
            <p className="text-xs text-muted-foreground">Audit Ready</p>
          </div>
        </div>
      </div>

      {/* Audit Dates */}
      <div className="mt-5 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Last audit: {formatDate(metrics.lastAuditDate)}</span>
          <span className="mx-1">•</span>
          <span>Next: {formatDate(metrics.nextAuditDate)}</span>
        </div>
      </div>
    </div>
  );
}

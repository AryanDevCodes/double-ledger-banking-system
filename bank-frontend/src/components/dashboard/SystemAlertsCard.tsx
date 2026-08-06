import { AlertTriangle, ShieldCheck, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomerResponseDTO } from "@/types/api";

interface Props {
  customers: CustomerResponseDTO[];
  loading: boolean;
  /** Optional extra alerts a page can render */
  extra?: React.ReactNode;
}

export default function SystemAlertsCard({ customers, loading, extra }: Props) {
  const pendingKyc = customers.filter((c) => c.kycStatus === "PENDING").length;

  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          System Alerts
        </h3>
      </div>
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {pendingKyc > 0 ? (
            <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {pendingKyc} Pending KYC Verification{pendingKyc > 1 && "s"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Action required for customer onboarding
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
              <ShieldCheck className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  All Systems Operational
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  No pending actions required
                </p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3 rounded-xl border border-info/30 bg-info/10 p-4">
            <Users className="h-5 w-5 text-info mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {customers.length} Active Customers
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                System is running smoothly
              </p>
            </div>
          </div>
          {extra}
        </div>
      )}
    </div>
  );
}

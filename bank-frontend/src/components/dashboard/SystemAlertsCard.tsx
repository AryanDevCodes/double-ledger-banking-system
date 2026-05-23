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
          <AlertTriangle className="h-5 w-5 text-amber-500" />
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
            <div className="flex items-start gap-3 rounded-xl border border-amber-300/40 bg-amber-50/90 p-4 dark:border-amber-700/60 dark:bg-amber-950/20">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  {pendingKyc} Pending KYC Verification{pendingKyc > 1 && "s"}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Action required for customer onboarding
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-300/40 bg-emerald-50/90 p-4 dark:border-emerald-700/60 dark:bg-emerald-950/20">
              <ShieldCheck className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                  All Systems Operational
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  No pending actions required
                </p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3 rounded-xl border border-blue-300/40 bg-blue-50/90 p-4 dark:border-blue-700/60 dark:bg-blue-950/20">
            <Users className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                {customers.length} Active Customers
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
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

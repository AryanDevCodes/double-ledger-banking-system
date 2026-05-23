import { ShieldCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomerResponseDTO } from "@/types/api";

interface Props {
  customers: CustomerResponseDTO[];
  loading: boolean;
}

export default function ComplianceCard({ customers, loading }: Props) {
  const completed = customers.filter((c) => c.kycStatus === "COMPLETED").length;
  const pending = customers.filter((c) => c.kycStatus === "PENDING").length;
  const compliance = customers.length > 0 ? Math.round((completed / customers.length) * 100) : 0;

  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
          Compliance Status
        </h3>
      </div>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-2 w-full" />
          <div className="grid grid-cols-2 gap-4 pt-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">KYC Compliance</span>
              <span className="font-semibold text-emerald-600">{compliance}%</span>
            </div>
            <Progress value={compliance} className="h-2" />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl glass-panel--emerald border border-emerald-500/25">
              <p className="text-xl font-bold text-emerald-600">{completed}</p>
              <p className="text-xs text-muted-foreground mt-1">Verified KYC</p>
            </div>
            <div className="p-3.5 rounded-xl glass-panel--amber border border-amber-500/25">
              <p className="text-xl font-bold text-amber-600">{pending}</p>
              <p className="text-xs text-muted-foreground mt-1">Pending Reviews</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

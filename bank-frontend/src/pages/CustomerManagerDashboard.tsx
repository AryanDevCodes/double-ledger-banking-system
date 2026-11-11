import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  DashboardEmpty,
  DashboardHero,
  DashboardMetric,
  DashboardPanel,
} from "@/components/dashboard/RoleDashboardPrimitives";

export default function CustomerManagerDashboard() {
  const { customers, accounts, loading, reload, lastUpdated } = useDashboardData("all", {
    banks: false,
    upi: false,
    transactions: false,
    realtime: 30000,
  });
  const pendingCustomers = customers.filter((customer) => customer.kycStatus === "PENDING");
  const verifiedCustomers = customers.filter((customer) => customer.kycStatus === "COMPLETED");
  const activeCustomers = customers.filter((customer) => customer.customerStatus === "ACTIVE");
  const pendingAccounts = accounts.filter((account) => account.status === "PENDING");
  const kycCompletion = customers.length
    ? Math.round((verifiedCustomers.length / customers.length) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <DashboardHero
        eyebrow="Customer services"
        title="Onboarding & KYC"
        description="Keep customer records, verification status, and account onboarding moving."
        icon={Users}
        updatedAt={lastUpdated}
        actions={
          <Button variant="outline" size="sm" onClick={() => void reload()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric label="Customer records" value={customers.length} detail={`${activeCustomers.length} active`} icon={Users} tone="blue" />
        <DashboardMetric label="KYC awaiting review" value={pendingCustomers.length} detail="Based on current KYC status" icon={Clock3} tone="amber" />
        <DashboardMetric label="KYC verified" value={verifiedCustomers.length} detail={`${kycCompletion}% of customer records`} icon={CheckCircle2} tone="green" />
        <DashboardMetric label="Pending accounts" value={pendingAccounts.length} detail={`${accounts.length} total accounts`} icon={CreditCard} tone="violet" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <DashboardPanel
          title="KYC review queue"
          description="Customers with KYC status marked pending"
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/customers"><Search className="mr-2 h-3.5 w-3.5" />Open directory</Link>
            </Button>
          }
        >
          {pendingCustomers.length === 0 ? (
            <DashboardEmpty title="Queue is clear" description="There are no customer records awaiting KYC review." icon={ShieldCheck} />
          ) : (
            <div className="space-y-2">
              {pendingCustomers.slice(0, 6).map((customer) => (
                <div key={customer.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      <UserRound className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{customer.fullName || "Unnamed customer"}</p>
                      <p className="truncate text-xs text-muted-foreground">{customer.email}</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          )}
        </DashboardPanel>

        <div className="space-y-5">
          <DashboardPanel title="KYC progress" description="Current customer verification coverage">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-semibold tracking-tight">{kycCompletion}%</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {verifiedCustomers.length} verified of {customers.length} customer records
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <div
              className="mt-5 h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label="KYC verification completion"
              aria-valuenow={kycCompletion}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full rounded-full bg-emerald-500 transition-[width]" style={{ width: `${kycCompletion}%` }} />
            </div>
            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              <span>{pendingCustomers.length} pending</span>
              <span>{customers.length - verifiedCustomers.length - pendingCustomers.length} other</span>
            </div>
          </DashboardPanel>

          <DashboardPanel
            title="Account onboarding"
            description="Accounts currently awaiting activation"
            action={
              <Button asChild variant="ghost" size="sm" className="-mr-2">
                <Link to="/accounts">View accounts</Link>
              </Button>
            }
          >
            {pendingAccounts.length === 0 ? (
              <DashboardEmpty title="No pending accounts" description="New account requests will be listed here." icon={CreditCard} />
            ) : (
              <div className="space-y-2">
                {pendingAccounts.slice(0, 3).map((account) => (
                  <div key={account.accountNumber} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{account.customerName || "Customer"}</p>
                      <p className="text-xs text-muted-foreground">{account.bankName} · •••• {account.accountNumber.slice(-4)}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </div>
                ))}
              </div>
            )}
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
}

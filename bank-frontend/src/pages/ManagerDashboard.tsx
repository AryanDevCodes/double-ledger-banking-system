import { Link } from "react-router-dom";
import {
  ArrowLeftRight,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/hooks/useDashboardData";
import { buildMonthlyTransactionTrend } from "@/components/dashboard/dashboard-data";
import {
  DashboardEmpty,
  DashboardHero,
  DashboardMetric,
  DashboardPanel,
  DashboardTransactions,
  DashboardTrend,
} from "@/components/dashboard/RoleDashboardPrimitives";

export default function ManagerDashboard() {
  const { banks, customers, accounts, transactions, loading, reload, lastUpdated } =
    useDashboardData("all", { upi: false, realtime: 30000 });
  const pendingAccounts = accounts.filter((account) => account.status === "PENDING");
  const pendingKyc = customers.filter((customer) => customer.kycStatus === "PENDING");
  const activeAccounts = accounts.filter((account) => account.status === "ACTIVE").length;
  const completedTransactions = transactions.filter(
    (transaction) => transaction.status === "COMPLETED" || transaction.status === "SUCCESS",
  ).length;
  const trend = buildMonthlyTransactionTrend(transactions, { metric: "count" });

  return (
    <div className="space-y-5">
      <DashboardHero
        eyebrow="Banking operations"
        title="Operations overview"
        description="Monitor service activity, account requests, and customer verification queues."
        icon={Building2}
        updatedAt={lastUpdated}
        actions={
          <Button variant="outline" size="sm" onClick={() => void reload()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardMetric label="Partner banks" value={banks.length} detail="Registered institutions" icon={Building2} tone="violet" />
        <DashboardMetric label="Customers" value={customers.length} detail="Customer records" icon={Users} tone="blue" />
        <DashboardMetric label="Active accounts" value={activeAccounts} detail={`${accounts.length} total accounts`} icon={CreditCard} tone="green" />
        <DashboardMetric label="Awaiting attention" value={pendingAccounts.length + pendingKyc.length} detail={`${pendingAccounts.length} accounts · ${pendingKyc.length} KYC reviews`} icon={Clock3} tone="amber" />
        <DashboardMetric label="Successful transfers" value={completedTransactions} detail={`${transactions.length} recorded transactions`} icon={CheckCircle2} tone="blue" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <DashboardTrend
          title="Transaction activity"
          description="Recorded transfers by month"
          points={trend}
        />
        <DashboardPanel
          title="Operations shortcuts"
          description="Open the relevant work queue"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { to: "/accounts", label: "Account requests", count: pendingAccounts.length, icon: CreditCard },
              { to: "/customers", label: "KYC reviews", count: pendingKyc.length, icon: ShieldCheck },
              { to: "/customers", label: "Customer directory", count: customers.length, icon: Users },
              { to: "/banks", label: "Partner banks", count: banks.length, icon: Building2 },
              { to: "/transactions", label: "Transactions", count: transactions.length, icon: ArrowLeftRight },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-3 transition-colors hover:border-primary/30 hover:bg-muted/40"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="truncate text-sm font-medium">{item.label}</span>
                  </span>
                  <span className="font-mono text-sm tabular-nums text-muted-foreground">{item.count}</span>
                </Link>
              );
            })}
          </div>
        </DashboardPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardPanel
          title="Account requests"
          description="Accounts currently marked as pending"
          action={
            <Button asChild variant="ghost" size="sm" className="-mr-2">
              <Link to="/accounts">Open accounts</Link>
            </Button>
          }
        >
          {pendingAccounts.length === 0 ? (
            <DashboardEmpty title="No pending account requests" description="New requests will appear in this queue." icon={CreditCard} />
          ) : (
            <div className="space-y-2">
              {pendingAccounts.slice(0, 4).map((account) => (
                <div key={account.accountNumber} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{account.customerName || "Customer"}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {account.bankName} · A/c •••• {account.accountNumber.slice(-4)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Recent transactions"
          description="Latest system-wide transaction activity"
          action={
            <Button asChild variant="ghost" size="sm" className="-mr-2">
              <Link to="/transactions">View all</Link>
            </Button>
          }
        >
          <DashboardTransactions transactions={transactions} />
        </DashboardPanel>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <Wallet className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        Figures reflect the records currently available to your operations account.
        <span className="ml-auto hidden shrink-0 items-center gap-1 text-emerald-700 dark:text-emerald-400 sm:flex">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Role-scoped access
        </span>
      </div>
    </div>
  );
}

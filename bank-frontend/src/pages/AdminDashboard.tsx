import { Link } from "react-router-dom";
import {
  ArrowLeftRight,
  Building2,
  CheckCircle2,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/hooks/useDashboardData";
import { formatCurrency } from "@/lib/format";
import { FEATURES } from "@/lib/features";
import { buildMonthlyTransactionTrend } from "@/components/dashboard/dashboard-data";
import {
  DashboardEmpty,
  DashboardHero,
  DashboardMetric,
  DashboardPanel,
  DashboardTransactions,
  DashboardTrend,
} from "@/components/dashboard/RoleDashboardPrimitives";

export default function AdminDashboard() {
  const { banks, customers, accounts, upiProfiles, transactions, loading, reload, lastUpdated } =
    useDashboardData("all", { realtime: 30000 });
  const activeAccounts = accounts.filter((account) => account.status === "ACTIVE").length;
  const pendingAccounts = accounts.filter((account) => account.status === "PENDING").length;
  const successfulTransactions = transactions.filter(
    (transaction) => transaction.status === "COMPLETED" || transaction.status === "SUCCESS",
  ).length;
  const monthlyVolume = buildMonthlyTransactionTrend(transactions);
  const transactionStatuses = [
    { label: "Completed", count: successfulTransactions, color: "bg-success" },
    { label: "Pending", count: transactions.filter((transaction) => transaction.status === "PENDING").length, color: "bg-warning" },
    { label: "Failed / reversed", count: transactions.filter((transaction) => transaction.status === "FAILED" || transaction.status === "REVERSED").length, color: "bg-destructive" },
    { label: "Other", count: transactions.filter((transaction) => !["COMPLETED", "SUCCESS", "PENDING", "FAILED", "REVERSED"].includes(transaction.status)).length, color: "bg-muted-foreground" },
  ];
  const successRate = transactions.length
    ? Math.round((successfulTransactions / transactions.length) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <DashboardHero
        eyebrow="System administration"
        title="Banking command center"
        description="A system-wide view of institutions, balances, accounts, customers, and transaction flow."
        icon={ShieldCheck}
        updatedAt={lastUpdated}
        actions={
          <Button variant="outline" size="sm" onClick={() => void reload()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh data
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <DashboardMetric label="Institutions" value={banks.length} detail="Registered banks" icon={Building2} tone="violet" />
        <DashboardMetric label="Customers" value={customers.length} detail="Customer records" icon={Users} tone="blue" />
        <DashboardMetric label="Active accounts" value={activeAccounts} detail={`${pendingAccounts} pending · ${accounts.length} total`} icon={CreditCard} tone="green" />
        <DashboardMetric label="Deposits on record" value={formatCurrency(accounts.reduce((total, account) => total + (account.balance || 0), 0))} detail="Combined account balances" icon={Wallet} tone="amber" />
        <DashboardMetric label="Transaction success" value={`${successRate}%`} detail={`${successfulTransactions} completed of ${transactions.length}`} icon={CheckCircle2} tone="blue" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <DashboardTrend
          title="Transaction volume"
          description="Recorded transfer value over the last six months"
          points={monthlyVolume}
          formatValue={formatCurrency}
        />
        <DashboardPanel title="System snapshot" description="Current inventory counts">
          <div className="space-y-3">
            {[
              { label: "UPI profiles", value: upiProfiles.length, icon: Smartphone },
              { label: "Bank accounts", value: accounts.length, icon: CreditCard },
              { label: "Transactions", value: transactions.length, icon: ArrowLeftRight },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-3">
                  <span className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                    {item.label}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{item.value.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { to: "/banks", label: "Banks" },
              { to: "/customers", label: "Customers" },
              { to: "/accounts", label: "Accounts" },
              { to: "/transactions", label: "Transactions" },
              ...(FEATURES.enableAuditModule ? [{ to: "/audit", label: "Audit logs" }] : []),
              ...(FEATURES.enableSecurityModule ? [{ to: "/security", label: "Security" }] : []),
            ].map((item) => (
              <Button key={item.to} asChild size="sm" variant="outline">
                <Link to={item.to}>{item.label}</Link>
              </Button>
            ))}
          </div>
        </DashboardPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardPanel
          title="Transaction status"
          description="Distribution of statuses returned by transaction records"
        >
          {transactions.length === 0 ? (
            <DashboardEmpty title="No transaction data" description="Status distribution will appear when transactions are recorded." icon={ArrowLeftRight} />
          ) : (
            <div className="space-y-4">
              <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                {transactionStatuses.map((status) => (
                  <div
                    key={status.label}
                    className={status.color}
                    style={{ width: `${(status.count / transactions.length) * 100}%` }}
                    title={`${status.label}: ${status.count}`}
                  />
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {transactionStatuses.map((status) => (
                  <div key={status.label} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className={`h-2.5 w-2.5 rounded-full ${status.color}`} />
                      {status.label}
                    </span>
                    <span className="font-mono font-medium tabular-nums">{status.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Recent transactions"
          description="Latest transactions across the system"
          action={
            <Button asChild variant="ghost" size="sm" className="-mr-2">
              <Link to="/transactions">View all</Link>
            </Button>
          }
        >
          <DashboardTransactions transactions={transactions} />
        </DashboardPanel>
      </div>
    </div>
  );
}

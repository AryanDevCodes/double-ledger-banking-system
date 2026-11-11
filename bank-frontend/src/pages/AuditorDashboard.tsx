import { Link } from "react-router-dom";
import {
  ArrowLeftRight,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileSearch,
  RefreshCw,
  Shield,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/hooks/useDashboardData";
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

export default function AuditorDashboard() {
  const { banks, customers, accounts, transactions, loading, reload, lastUpdated } =
    useDashboardData("all", { upi: false, realtime: 30000 });
  const completed = transactions.filter(
    (transaction) => transaction.status === "COMPLETED" || transaction.status === "SUCCESS",
  ).length;
  const unresolved = transactions.filter(
    (transaction) => transaction.status === "PENDING" || transaction.status === "PROCESSING" || transaction.status === "INITIATED",
  ).length;
  const exceptions = transactions.filter(
    (transaction) => transaction.status === "FAILED" || transaction.status === "REVERSED",
  );
  const trend = buildMonthlyTransactionTrend(transactions, { metric: "count" });

  return (
    <div className="space-y-5">
      <DashboardHero
        eyebrow="Read-only oversight"
        title="Audit & compliance overview"
        description="Review recorded transaction outcomes and operational data without changing customer records."
        icon={Shield}
        updatedAt={lastUpdated}
        actions={
          <>
            <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
              Read-only access
            </span>
            <Button variant="outline" size="sm" onClick={() => void reload()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardMetric label="Transactions reviewed" value={transactions.length} detail="Records currently available" icon={ArrowLeftRight} tone="blue" />
        <DashboardMetric label="Completed" value={completed} detail="Completed or successful status" icon={CheckCircle2} tone="green" />
        <DashboardMetric label="Unresolved" value={unresolved} detail="Pending, processing, or initiated" icon={Clock3} tone="amber" />
        <DashboardMetric label="Exceptions" value={exceptions.length} detail="Failed or reversed status" icon={FileSearch} tone="rose" />
        <DashboardMetric label="Accounts in scope" value={accounts.length} detail={`${customers.length} customers · ${banks.length} banks`} icon={CreditCard} tone="violet" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <DashboardTrend
          title="Transaction records"
          description="Transaction count by month"
          points={trend}
        />
        <DashboardPanel
          title="Review destinations"
          description="Open source records for further inspection"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ...(FEATURES.enableAuditModule ? [{ to: "/audit", label: "Audit logs", description: "Recorded compliance events", icon: FileSearch }] : []),
              { to: "/transactions", label: "Transactions", description: "Search and review transfers", icon: ArrowLeftRight },
              { to: "/accounts", label: "Account registry", description: "Review account records", icon: CreditCard },
              { to: "/customers", label: "Customer records", description: "Review customer data", icon: Users },
              { to: "/banks", label: "Bank registry", description: "Review institution records", icon: Building2 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 rounded-xl border border-border/70 p-3 transition-colors hover:border-primary/30 hover:bg-muted/40"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </DashboardPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardPanel
          title="Failed and reversed transactions"
          description="Transaction records with an exception status"
          action={
            <Button asChild variant="ghost" size="sm" className="-mr-2">
              <Link to="/transactions">Open transactions</Link>
            </Button>
          }
        >
          {exceptions.length === 0 ? (
            <DashboardEmpty title="No exceptions in current data" description="Failed or reversed transactions will be summarized here." icon={CheckCircle2} />
          ) : (
            <DashboardTransactions transactions={exceptions} />
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Recent transaction records"
          description="Latest available system-wide activity"
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

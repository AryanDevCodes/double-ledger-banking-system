import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CreditCard,
  QrCode,
  Send,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { buildMonthlyTransactionTrend, formatDate } from "@/components/dashboard/dashboard-data";
import {
  DashboardEmpty,
  DashboardHero,
  DashboardMetric,
  DashboardPanel,
  DashboardTransactions,
  DashboardTrend,
} from "@/components/dashboard/RoleDashboardPrimitives";

export default function Dashboard() {
  const { user } = useAuth();
  const { accounts, upiProfiles, transactions, loading, reload, lastUpdated } =
    useDashboardData("self", { banks: false, customers: false, realtime: 30000 });
  const accountNumbers = useMemo(
    () => new Set(accounts.map((account) => account.accountNumber)),
    [accounts],
  );
  const currentMonthTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter((transaction) => {
      const date = new Date(transaction.transactionDate);
      const completed = transaction.status === "COMPLETED" || transaction.status === "SUCCESS";
      return completed && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    });
  }, [transactions]);
  const sentThisMonth = currentMonthTransactions
    .filter((transaction) => accountNumbers.has(transaction.senderAccountNumber))
    .reduce((total, transaction) => total + transaction.amount, 0);
  const receivedThisMonth = currentMonthTransactions
    .filter((transaction) => accountNumbers.has(transaction.receiverAccountNumber))
    .reduce((total, transaction) => total + transaction.amount, 0);
  const activeAccounts = accounts.filter((account) => account.status === "ACTIVE").length;
  const displayName = user?.fullName?.split(" ")[0] || user?.username || "there";
  const spendingTrend = useMemo(
    () => buildMonthlyTransactionTrend(transactions, { accountNumbers, direction: "sent" }),
    [transactions, accountNumbers],
  );

  return (
    <div className="space-y-5">
      <DashboardHero
        eyebrow="Personal banking"
        title={`Good to see you, ${displayName}`}
        description="A clear view of your accounts, payments, and recent activity."
        icon={Wallet}
        updatedAt={lastUpdated}
        actions={
          <Button variant="outline" size="sm" onClick={() => void reload()} disabled={loading}>
            <ArrowLeftRight className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric
          label="Available balance"
          value={formatCurrency(accounts.reduce((total, account) => total + (account.balance || 0), 0))}
          detail={`${activeAccounts} active account${activeAccounts === 1 ? "" : "s"}`}
          icon={Wallet}
          tone="green"
        />
        <DashboardMetric
          label="Accounts"
          value={accounts.length}
          detail="Across your linked banks"
          icon={CreditCard}
          tone="violet"
        />
        <DashboardMetric
          label="Sent this month"
          value={formatCurrency(sentThisMonth)}
          detail={`${currentMonthTransactions.filter((transaction) => accountNumbers.has(transaction.senderAccountNumber)).length} outgoing payment(s)`}
          icon={ArrowUpRight}
          tone="rose"
        />
        <DashboardMetric
          label="Received this month"
          value={formatCurrency(receivedThisMonth)}
          detail={`${currentMonthTransactions.filter((transaction) => accountNumbers.has(transaction.receiverAccountNumber)).length} incoming payment(s)`}
          icon={ArrowDownLeft}
          tone="blue"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <DashboardTrend
          title="Outgoing payments"
          description="Your transfer activity over the last six months"
          points={spendingTrend}
          formatValue={formatCurrency}
        />
        <DashboardPanel
          title="Shortcuts"
          description="Common actions for your everyday banking"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { to: "/send-money", label: "Send money", description: "Transfer to a bank account", icon: Send },
              { to: "/upi-pay", label: "Pay with UPI", description: "Make an instant payment", icon: Smartphone },
              { to: "/upi-pay", label: "My UPI QR", description: "Receive a payment", icon: QrCode },
              { to: "/my-transactions", label: "Transactions", description: "History and receipts", icon: ArrowLeftRight },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  to={action.to}
                  className="group flex items-center gap-3 rounded-xl border border-border/70 p-3 transition-colors hover:border-primary/30 hover:bg-muted/40"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{action.label}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">{action.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </DashboardPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardPanel
          title="Recent transactions"
          description="The latest activity across your accounts"
          action={
            <Button asChild variant="ghost" size="sm" className="-mr-2">
              <Link to="/my-transactions">View history</Link>
            </Button>
          }
        >
          <DashboardTransactions
            transactions={transactions}
            accountNumbers={accountNumbers}
            emptyTitle="No payments yet"
            emptyDescription="Your completed transfers will appear here."
          />
        </DashboardPanel>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
          <DashboardPanel
            title="Your accounts"
            description="Balances and account status"
            action={
              <Button asChild variant="ghost" size="sm" className="-mr-2">
                <Link to="/accounts">View accounts</Link>
              </Button>
            }
          >
            {accounts.length === 0 ? (
              <DashboardEmpty title="No accounts linked" description="Your bank accounts will appear here when available." icon={CreditCard} />
            ) : (
              <div className="space-y-2">
                {accounts.slice(0, 4).map((account) => (
                  <div key={account.accountNumber} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary">
                        <CreditCard className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{account.bankName}</p>
                        <p className="text-xs text-muted-foreground">A/c •••• {account.accountNumber.slice(-4)} · {account.status.toLowerCase()}</p>
                      </div>
                    </div>
                    <p className="shrink-0 font-mono text-sm font-semibold tabular-nums">{formatCurrency(account.balance)}</p>
                  </div>
                ))}
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel
            title="UPI profiles"
            description="Your linked payment addresses"
            action={
              <Button asChild variant="ghost" size="sm" className="-mr-2">
                <Link to="/upi-pay">Manage UPI</Link>
              </Button>
            }
          >
            {upiProfiles.length === 0 ? (
              <DashboardEmpty title="No UPI profile yet" description="Link a UPI address to make instant payments." icon={Smartphone} />
            ) : (
              <div className="space-y-2">
                {upiProfiles.slice(0, 3).map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary">
                        <Smartphone className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{profile.upiId}</p>
                        <p className="truncate text-xs text-muted-foreground">{profile.bankName} · linked {formatDate(profile.createdAt)}</p>
                      </div>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      {profile.status.toLowerCase()}
                    </span>
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

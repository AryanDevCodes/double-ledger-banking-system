import { useEffect, useState } from "react";
import { Building2, Users, CreditCard, ArrowLeftRight, Smartphone, TrendingUp, ShieldCheck, AlertTriangle, RefreshCw, Wallet, Activity, CheckCircle2 } from "lucide-react";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import PageWrapper from "@/components/PageWrapper";
import PageHeader from "@/components/PageHeader";
import { bankApi, customerApi, accountApi, upiApi, transactionApi } from "@/lib/api-client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/rbac";
import { StatCardSkeleton, TableSkeleton } from "@/components/LoadingStates";
import type { BankResponseDTO, CustomerResponseDTO, AccountResponseDTO, UpiProfileResponseDTO, TransactionResponseDTO } from "@/types/api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

type DashboardTransaction = TransactionResponseDTO & {
  transactionType?: string;
  timestamp?: string;
  id?: string | number;
  fromAccountNumber?: string;
  toAccountNumber?: string;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [banks, setBanks] = useState<BankResponseDTO[]>([]);
  const [customers, setCustomers] = useState<CustomerResponseDTO[]>([]);
  const [accounts, setAccounts] = useState<AccountResponseDTO[]>([]);
  const [upiProfiles, setUpiProfiles] = useState<UpiProfileResponseDTO[]>([]);
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const roles = user?.roles || [];
      const isCustomer = roles.includes(ROLES.USER) &&
                        !roles.includes(ROLES.ADMIN) &&
                        !roles.includes(ROLES.MANAGER) &&
                        !roles.includes(ROLES.CUSTOMER_MANAGER) &&
                        !roles.includes(ROLES.AUDITOR);

      if (isCustomer) {
        const accountsData = await accountApi.getMy();
        const upiByAccount = await Promise.all(
          accountsData.map((acc: AccountResponseDTO) => upiApi.getByAccountNumber(acc.accountNumber))
        );
        setAccounts(accountsData);
        setUpiProfiles(upiByAccount.flat());

        if (accountsData.length > 0) {
          const allTransactions = await Promise.all(
            accountsData.map((acc: AccountResponseDTO) =>
              transactionApi.getByAccount(acc.accountNumber, user?.email || "")
            )
          );
          setTransactions(allTransactions.flat());
        } else {
          setTransactions([]);
        }

        setBanks([]);
        setCustomers([]);
      } else {
        const [banksData, customersData, accountsData, upiData, transactionsData] = await Promise.all([
          bankApi.getAll(),
          customerApi.getAll(),
          accountApi.getAll(),
          upiApi.getAll(),
          transactionApi.getAll(),
        ]);
        setBanks(banksData);
        setCustomers(customersData);
        setAccounts(accountsData);
        setUpiProfiles(upiData);
        setTransactions(transactionsData);
      }
    } catch (error) {
      toast.error("Failed to load dashboard data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const activeAccounts = accounts.filter((a) => a.status === "ACTIVE").length;
  const pendingKyc = customers.filter((c) => c.kycStatus === "PENDING").length;
  const kycCompliance = customers.length > 0 
    ? Math.round((customers.filter(c => c.kycStatus === "COMPLETED").length / customers.length) * 100)
    : 0;

  const completedTransactions = transactions.filter((t) => t.status === "COMPLETED" || t.status === "SUCCESS");
  const successRate = transactions.length ? Math.round((completedTransactions.length / transactions.length) * 100) : 0;

  const roles = user?.roles || [];
  const isAuditor = roles.includes(ROLES.AUDITOR);
  const isCustomer = roles.includes(ROLES.USER) &&
    !roles.includes(ROLES.ADMIN) &&
    !roles.includes(ROLES.MANAGER) &&
    !roles.includes(ROLES.CUSTOMER_MANAGER) &&
    !roles.includes(ROLES.AUDITOR);
  const locale = typeof navigator !== "undefined" ? navigator.language : "en-US";

  const upiByAccount = new Map<string, string[]>();
  upiProfiles.forEach((profile) => {
    if (!upiByAccount.has(profile.accountNumber)) {
      upiByAccount.set(profile.accountNumber, []);
    }
    upiByAccount.get(profile.accountNumber)?.push(profile.upiId);
  });

  const monthlyTransactionData = (() => {
    const monthMap = new Map<string, { month: string; volume: number; count: number }>();
    transactions.forEach((txn) => {
      const rawDate = txn.transactionDate || txn.timestamp;
      if (!rawDate) return;
      const dt = new Date(rawDate);
      if (Number.isNaN(dt.getTime())) return;
      const key = `${dt.getFullYear()}-${dt.getMonth()}`;
      const label = dt.toLocaleString(locale, { month: "short" });
      const current = monthMap.get(key) || { month: label, volume: 0, count: 0 };
      current.volume += txn.amount || 0;
      current.count += 1;
      monthMap.set(key, current);
    });

    return Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([, value]) => value);
  })();

  const statusDistributionData = [
    { name: "Success", value: transactions.filter((t) => t.status === "SUCCESS" || t.status === "COMPLETED").length, color: "hsl(var(--success))" },
    { name: "Pending", value: transactions.filter((t) => t.status === "PENDING" || t.status === "PROCESSING").length, color: "hsl(var(--warning))" },
    { name: "Failed", value: transactions.filter((t) => t.status === "FAILED").length, color: "hsl(var(--destructive))" },
  ].filter((item) => item.value > 0);

  const bankDistributionData = Array.from(
    accounts.reduce((acc, item) => {
      acc.set(item.bankName, (acc.get(item.bankName) || 0) + 1);
      return acc;
    }, new Map<string, number>())
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([bank, count]) => ({ bank, accounts: count }));

  const formatParty = (name: string | undefined, accountNumber: string) => {
    const upiIds = upiByAccount.get(accountNumber) || [];
    const identifier = upiIds.length > 0 ? `UPI: ${upiIds[0]}` : accountNumber;
    return (
      <div>
        <div className="text-sm font-medium">{name || "Unknown"}</div>
        <div className="text-xs text-muted-foreground font-mono">{identifier}</div>
      </div>
    );
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Dashboard"
        subtitle={
          isCustomer
            ? "Your account summary and recent activity"
            : isAuditor
              ? "Compliance insights and risk overview"
              : "Real-time overview of the banking system"
        }
        icon={<TrendingUp className="h-5 w-5" />}
        actions={
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
          {isCustomer ? (
            <>
              <StatCard
                title="My Accounts"
                value={accounts.length}
                icon={<CreditCard className="h-5 w-5" />}
                subtitle={`${activeAccounts} active`}
              />
              <StatCard
                title="Total Balance"
                value={formatCurrency(totalBalance)}
                icon={<Wallet className="h-5 w-5" />}
              />
              <StatCard
                title="UPI Profiles"
                value={upiProfiles.length}
                icon={<Smartphone className="h-5 w-5" />}
              />
              <StatCard
                title="Transactions"
                value={transactions.length}
                icon={<ArrowLeftRight className="h-5 w-5" />}
                subtitle={`${successRate}% success`}
              />
              <StatCard
                title="Total Sent"
                value={formatCurrency(
                  transactions
                    .filter((t) => (t.transactionType || "TRANSFER") !== "CREDIT")
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <StatCard
                title="Total Received"
                value={formatCurrency(
                  transactions
                    .filter((t) => (t.transactionType || "TRANSFER") === "CREDIT")
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
                icon={<Activity className="h-5 w-5" />}
              />
            </>
          ) : (
            <>
              <StatCard 
                title="Banks" 
                value={banks.length} 
                icon={<Building2 className="h-5 w-5" />} 
                subtitle="Registered" 
              />
              <StatCard 
                title="Customers" 
                value={customers.length} 
                icon={<Users className="h-5 w-5" />} 
                subtitle="Total" 
              />
              <StatCard 
                title="Accounts" 
                value={activeAccounts} 
                icon={<CreditCard className="h-5 w-5" />} 
                subtitle="Active" 
              />
              <StatCard 
                title="Total Balance" 
                value={formatCurrency(totalBalance)} 
                icon={<TrendingUp className="h-5 w-5" />} 
              />
              <StatCard 
                title="Transactions" 
                value={transactions.length} 
                icon={<ArrowLeftRight className="h-5 w-5" />} 
                subtitle={`${successRate}% success`}
              />
              <StatCard 
                title="UPI Profiles" 
                value={upiProfiles.length} 
                icon={<Smartphone className="h-5 w-5" />} 
                subtitle="Registered" 
              />
            </>
          )}
        </div>
      )}

      {/* Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4 xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Transaction Volume (Last 6 Months)</h3>
            <span className="text-xs text-muted-foreground">Trend</span>
          </div>
          <div className="h-[260px]">
            {loading ? (
              <div className="space-y-3 p-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-[210px] w-full" />
              </div>
            ) : monthlyTransactionData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No transaction trend data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTransactionData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="txnVolumeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Volume"]}
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="hsl(var(--primary))"
                    fill="url(#txnVolumeFill)"
                    strokeWidth={2.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Transaction Health</h3>
            <span className="text-xs text-muted-foreground">Status</span>
          </div>
          <div className="h-[260px]">
            {loading ? (
              <div className="space-y-3 p-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-[210px] w-full" />
              </div>
            ) : statusDistributionData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={54}
                    outerRadius={84}
                    paddingAngle={4}
                  >
                    {statusDistributionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {!isCustomer && (
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Top Banks by Account Count</h3>
            <span className="text-xs text-muted-foreground">Distribution</span>
          </div>
          <div className="h-[250px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : bankDistributionData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No bank distribution data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bankDistributionData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="bank" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    formatter={(value: number) => [value, "Accounts"]}
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                    }}
                  />
                  <Bar dataKey="accounts" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}


      {/* Alerts & Compliance Row */}
      {!isCustomer && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Compliance Quick Stats */}
        <div className="glass-card p-5 hover:shadow-md transition-shadow">
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
                  <span className="font-semibold text-emerald-600">{kycCompliance}%</span>
                </div>
                <Progress value={kycCompliance} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 rounded-lg">
                  <p className="text-xl font-bold text-emerald-600">{customers.filter(c => c.kycStatus === "COMPLETED").length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Verified KYC</p>
                </div>
                <div className="p-3.5 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 rounded-lg">
                  <p className="text-xl font-bold text-amber-600">{pendingKyc}</p>
                  <p className="text-xs text-muted-foreground mt-1">Pending Reviews</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="glass-card p-5 hover:shadow-md transition-shadow">
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
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800 hover:shadow-md transition-shadow">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                      {pendingKyc} Pending KYC Verification{pendingKyc > 1 && "s"}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Action required for customer onboarding</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">All Systems Operational</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">No pending actions required</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Users className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{customers.length} Active Customers</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">System is running smoothly</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}


      {/* Recent Accounts / My Accounts */}
      <div className="glass-card hover:shadow-md transition-shadow">
        <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
          <h2 className="text-base font-semibold">{isCustomer ? "My Accounts" : "Recent Accounts"}</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/accounts">{isCustomer ? "Manage Accounts" : "View All Accounts"}</Link>
          </Button>
        </div>
        {loading ? (
          <TableSkeleton columns={5} rows={5} />
        ) : accounts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No accounts created yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Number</TableHead>
                <TableHead>{isCustomer ? "Type" : "Customer"}</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.slice(0, 6).map((acc) => (
                <TableRow key={acc.accountNumber} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold">{acc.accountNumber}</TableCell>
                  <TableCell className="font-medium">{isCustomer ? "Savings" : acc.customerName}</TableCell>
                  <TableCell className="text-sm">{acc.bankName}</TableCell>
                  <TableCell className="text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(acc.balance)}
                  </TableCell>
                  <TableCell><StatusBadge status={acc.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Recent Activity */}
      <div className="glass-card hover:shadow-md transition-shadow mt-5">
        <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <h2 className="text-base font-semibold">Recent Activity</h2>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/transactions">View All Transactions</Link>
          </Button>
        </div>
        {loading ? (
          <TableSkeleton columns={5} rows={5} />
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No transactions available yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 6).map((txn) => {
                const dateValue = txn.transactionDate || txn.timestamp;
                const fromAccount = txn.senderAccountNumber || txn.fromAccountNumber || "-";
                const toAccount = txn.receiverAccountNumber || txn.toAccountNumber || "-";
                return (
                  <TableRow key={txn.transactionId || txn.id}>
                    <TableCell>{dateValue ? formatDateTime(dateValue) : "-"}</TableCell>
                    <TableCell>{formatParty(txn.senderName, fromAccount)}</TableCell>
                    <TableCell>{formatParty(txn.receiverName, toAccount)}</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatCurrency(txn.amount)}</TableCell>
                    <TableCell><StatusBadge status={txn.status} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </PageWrapper>
  );
}

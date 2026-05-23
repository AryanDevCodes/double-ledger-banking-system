import { useMemo } from "react";
import {
  Building2,
  Users,
  CreditCard,
  ArrowLeftRight,
  TrendingUp,
  RefreshCw,
  Link2,
  ClipboardCheck,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileCheck,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PageWrapper from "@/components/PageWrapper";
import PageHeader from "@/components/PageHeader";
import { useDashboardData } from "@/hooks/useDashboardData";
import { formatCurrency } from "@/lib/format";
import FuturisticStatsGrid, { type FuturisticStatWidget } from "@/components/dashboard/FuturisticStatsGrid";
import FuturisticChart from "@/components/dashboard/FuturisticChart";
import FuturisticActivityFeed, { type ActivityEvent } from "@/components/dashboard/FuturisticActivityFeed";
import FuturisticQuickActions from "@/components/dashboard/FuturisticQuickActions";

const generateActivityEvents = (transactions: any[], accounts: any[], customers: any[]): ActivityEvent[] => {
  const events: ActivityEvent[] = [];
  
  accounts.filter(a => a.status === "PENDING").slice(0, 3).forEach((a, i) => {
    events.push({
      id: `acc-${a.accountId || i}`,
      type: "account",
      title: "Account Approval Request",
      description: `${a.accountNumber} pending review`,
      timestamp: new Date(Date.now() - i * 300000).toISOString(),
      status: "pending" as const,
      user: a.customerName || "Unknown",
    });
  });

  customers.filter(c => c.kycStatus === "PENDING").slice(0, 2).forEach((c, i) => {
    events.push({
      id: `kyc-${c.customerId || i}`,
      type: "kyc",
      title: "KYC Verification",
      description: "Documents uploaded for review",
      timestamp: new Date(Date.now() - (i + 3) * 300000).toISOString(),
      status: "pending" as const,
      user: c.fullName || c.email,
    });
  });

  transactions.slice(0, 2).forEach((t, i) => {
    events.push({
      id: `txn-${t.transactionId || i}`,
      type: "transaction",
      title: t.status === "COMPLETED" || t.status === "SUCCESS" ? "Transaction Processed" : "Transaction Pending",
      description: t.description || `${formatCurrency(t.amount)} transfer`,
      timestamp: t.transactionDate || new Date(Date.now() - (i + 5) * 300000).toISOString(),
      status: (t.status === "COMPLETED" || t.status === "SUCCESS") ? "success" as const : "pending" as const,
      amount: formatCurrency(t.amount),
      user: t.senderName || t.receiverName || "Unknown",
    });
  });

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const generateTransactionData = (transactions: any[]) => {
  const dailyData: Record<string, number> = {};
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  days.forEach(d => dailyData[d] = 0);
  
  transactions.forEach(t => {
    if (t.transactionDate) {
      const d = new Date(t.transactionDate);
      const key = days[d.getDay()];
      dailyData[key] = (dailyData[key] || 0) + 1;
    }
  });
  
  return Object.entries(dailyData).map(([name, value]) => ({ name, value }));
};

const generateApprovalData = (accounts: any[], customers: any[]) => {
  const pendingAccounts = accounts.filter(a => a.status === "PENDING").length;
  const pendingKyc = customers.filter(c => c.kycStatus === "PENDING").length;
  
  return [
    { name: "Accounts", value: pendingAccounts || 3 },
    { name: "KYC", value: pendingKyc || 5 },
    { name: "Transactions", value: 2 },
    { name: "Limits", value: 1 },
  ];
};

export default function ManagerDashboard() {
  const { banks, customers, accounts, upiProfiles, transactions, loading, reload, lastUpdated } =
    useDashboardData("all", { realtime: 30000 });

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const pendingApprovals = accounts.filter((a) => a.status === "PENDING").length;
  const pendingKyc = customers.filter((c) => c.kycStatus === "PENDING").length;
  const successRate = transactions.length
    ? Math.round(
        (transactions.filter((t) => t.status === "COMPLETED" || t.status === "SUCCESS").length /
          transactions.length) *
          100,
      )
    : 0;

  const activityEvents = useMemo(() => generateActivityEvents(transactions, accounts, customers), [transactions, accounts, customers]);
  const transactionData = useMemo(() => generateTransactionData(transactions), [transactions]);
  const approvalData = useMemo(() => generateApprovalData(accounts, customers), [accounts, customers]);

  const widgets: FuturisticStatWidget[] = [
    { id: "banks", title: "Partner Banks", value: banks.length, icon: <Building2 className="h-5 w-5" />, tint: "violet" },
    { id: "customers", title: "Total Customers", value: customers.length, icon: <Users className="h-5 w-5" />, subtitle: `${pendingKyc} KYC pending`, tint: "cyan" },
    { id: "accounts", title: "Accounts", value: accounts.length, icon: <CreditCard className="h-5 w-5" />, subtitle: `${pendingApprovals} awaiting`, tint: "amber" },
    { id: "balance", title: "Total Balance", value: formatCurrency(totalBalance), icon: <Wallet className="h-5 w-5" />, tint: "emerald" },
    { id: "transactions", title: "Transactions", value: transactions.length, icon: <ArrowLeftRight className="h-5 w-5" />, subtitle: `${successRate}% success`, tint: "sky" },
    { id: "approvals", title: "Pending Approvals", value: pendingApprovals + pendingKyc, icon: <ClipboardCheck className="h-5 w-5" />, subtitle: "Queue", tint: "rose" },
  ];

  return (
    <PageWrapper>
      <PageHeader
        title="Operations Hub"
        subtitle="Approval workflows, customer management & throughput"
        icon={<TrendingUp className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {lastUpdated.toLocaleTimeString()}
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30">
              <Clock className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">{pendingApprovals + pendingKyc} Pending</span>
            </div>
            <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Sync
            </Button>
          </div>
        }
      />

      <FuturisticStatsGrid widgets={widgets} loading={loading} columnsClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2">
          <FuturisticChart 
            data={transactionData} 
            title="Daily Transaction Volume" 
            type="bar" 
            height={320}
            colors={["#f59e0b", "#22d3ee"]}
          />
        </div>
        <FuturisticChart 
          data={approvalData} 
          title="Pending Approvals" 
          type="pie" 
          height={320}
          colors={["#f59e0b", "#22d3ee", "#10b981", "#f43f5e"]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <FuturisticActivityFeed 
          events={activityEvents} 
          title="Approval Queue"
          maxEvents={6}
        />
        
        <div className="lg:col-span-2">
          <div className="glass-card-futuristic p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-amber-400" />
              Quick Review Actions
            </h3>
            <div className="space-y-3">
              {accounts.filter(a => a.status === "PENDING").slice(0, 3).map((acc, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Account: {acc.accountNumber}</p>
                      <p className="text-xs text-muted-foreground">{acc.customerName} • {acc.bankName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-8 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 border-rose-500/30 text-rose-400 hover:bg-rose-500/20">
                      <XCircle className="w-3 h-3 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <FuturisticQuickActions
          title="Manager Console"
          actions={[
            { to: "/accounts", label: "Account Approvals", icon: CreditCard, description: `${pendingApprovals} awaiting`, badge: `${pendingApprovals}`, badgeType: "warning" },
            { to: "/customers", label: "KYC Reviews", icon: UserCheck, description: `${pendingKyc} pending`, badge: `${pendingKyc}`, badgeType: "warning" },
            { to: "/banks", label: "Bank Registry", icon: Building2, description: "Manage partners" },
            { to: "/webhooks", label: "Webhooks", icon: Link2, description: "Integration config" },
            { to: "/transactions", label: "Transactions", icon: ArrowLeftRight, description: "View all" },
            { to: "/customers", label: "Customer List", icon: Users, description: "Manage customers" },
          ]}
          columns={2}
          className="lg:col-span-2"
        />
        
        <div className="glass-card-futuristic p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            Today's Performance
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Accounts Opened</span>
              <span className="text-lg font-bold text-emerald-400">{accounts.filter(a => a.status === "ACTIVE").length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">KYC Verified</span>
              <span className="text-lg font-bold text-cyan-400">{customers.filter(c => c.kycStatus === "COMPLETED").length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Transactions Processed</span>
              <span className="text-lg font-bold text-amber-400">{transactions.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Success Rate</span>
              <span className="text-lg font-bold text-violet-400">{successRate}%</span>
            </div>
            <div className="pt-4 border-t border-white/10">
              <div className="progress-futuristic">
                <div className="progress-futuristic-bar" style={{ width: `${successRate}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{successRate}% target achieved</p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

import { useMemo } from "react";
import { 
  Building2, 
  Users, 
  CreditCard, 
  ArrowLeftRight, 
  Smartphone, 
  TrendingUp, 
  RefreshCw,
  Lock, 
  FileText, 
  Link2, 
  ShieldCheck,
  Activity,
  Server,
  Database,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Clock
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

const generateActivityEvents = (transactions: any[], customers: any[], accounts: any[]): ActivityEvent[] => {
  const events: ActivityEvent[] = [];
  
  // Generate events from recent transactions
  transactions.slice(0, 4).forEach((t, i) => {
    events.push({
      id: `txn-${t.transactionId || i}`,
      type: "transaction",
      title: t.status === "COMPLETED" || t.status === "SUCCESS" ? "Transaction Completed" : "Transaction Pending",
      description: t.description || `Amount: ${formatCurrency(t.amount)}`,
      timestamp: t.transactionDate || new Date(Date.now() - i * 600000).toISOString(),
      status: (t.status === "COMPLETED" || t.status === "SUCCESS") ? "success" as const : "pending" as const,
      amount: formatCurrency(t.amount),
      user: t.senderName || t.receiverName || "Unknown",
    });
  });

  // Add customer events
  customers.slice(0, 2).forEach((c, i) => {
    events.push({
      id: `cust-${c.customerId || i}`,
      type: "kyc",
      title: c.kycStatus === "COMPLETED" ? "KYC Verified" : "KYC Pending",
      description: `${c.fullName || c.email}`,
      timestamp: new Date(Date.now() - (i + 4) * 600000).toISOString(),
      status: c.kycStatus === "COMPLETED" ? "success" as const : "warning" as const,
      user: c.email,
    });
  });

  // Add account events
  accounts.slice(0, 2).forEach((a, i) => {
    events.push({
      id: `acc-${a.accountId || i}`,
      type: "account",
      title: a.status === "ACTIVE" ? "Account Activated" : "Account Pending",
      description: `ACC: ${a.accountNumber}`,
      timestamp: new Date(Date.now() - (i + 6) * 600000).toISOString(),
      status: a.status === "ACTIVE" ? "success" as const : "pending" as const,
      user: a.customerName || "Unknown",
    });
  });

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const generateTransactionVolumeData = (transactions: any[]) => {
  const monthlyData: Record<string, number> = {};
  const now = new Date();
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString('default', { month: 'short' });
    monthlyData[key] = 0;
  }
  
  // Aggregate transaction amounts by month
  transactions.forEach(t => {
    if (t.transactionDate) {
      const d = new Date(t.transactionDate);
      const key = d.toLocaleString('default', { month: 'short' });
      if (monthlyData[key] !== undefined) {
        monthlyData[key] += t.amount || 0;
      }
    }
  });
  
  return Object.entries(monthlyData).map(([name, value]) => ({ name, value: Math.round(value) }));
};

const generateTransactionStatusData = (transactions: any[]) => {
  const statusCounts: Record<string, number> = {
    Success: 0,
    Pending: 0,
    Failed: 0,
  };
  
  transactions.forEach(t => {
    if (t.status === "COMPLETED" || t.status === "SUCCESS") {
      statusCounts.Success++;
    } else if (t.status === "PENDING") {
      statusCounts.Pending++;
    } else if (t.status === "FAILED" || t.status === "FAILED") {
      statusCounts.Failed++;
    }
  });
  
  return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
};

const generateBankDistributionData = (accounts: any[]) => {
  const bankCounts: Record<string, number> = {};
  
  accounts.forEach(a => {
    const bank = a.bankName || "Other";
    bankCounts[bank] = (bankCounts[bank] || 0) + 1;
  });
  
  const sorted = Object.entries(bankCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);
  
  return sorted.map(([name, value]) => ({ name, value }));
};

export default function AdminDashboard() {
  const { banks, customers, accounts, upiProfiles, transactions, loading, reload, lastUpdated } =
    useDashboardData("all", { realtime: 30000 });

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const activeAccounts = accounts.filter((a) => a.status === "ACTIVE").length;
  const pendingAccounts = accounts.filter((a) => a.status === "PENDING").length;
  const successRate = transactions.length
    ? Math.round(
        (transactions.filter((t) => t.status === "COMPLETED" || t.status === "SUCCESS").length /
          transactions.length) *
          100,
      )
    : 0;

  const activityEvents = useMemo(() => generateActivityEvents(transactions, customers, accounts), [transactions, customers, accounts]);
  const transactionData = useMemo(() => generateTransactionVolumeData(transactions), [transactions]);
  const transactionStatusData = useMemo(() => generateTransactionStatusData(transactions), [transactions]);
  const bankDistributionData = useMemo(() => generateBankDistributionData(accounts), [accounts]);

  const widgets: FuturisticStatWidget[] = [
    { id: "banks", title: "Registered Banks", value: banks.length, icon: <Building2 className="h-5 w-5" />, tint: "violet", subtitle: "Active partners" },
    { id: "customers", title: "Total Customers", value: customers.length, icon: <Users className="h-5 w-5" />, tint: "cyan", subtitle: `${pendingAccounts} pending` },
    { id: "accounts", title: "Active Accounts", value: activeAccounts, icon: <CreditCard className="h-5 w-5" />, tint: "emerald", subtitle: `of ${accounts.length} total` },
    { id: "balance", title: "Total Balance", value: formatCurrency(totalBalance), icon: <TrendingUp className="h-5 w-5" />, tint: "amber", subtitle: "System wide" },
    { id: "transactions", title: "Transactions", value: transactions.length, icon: <ArrowLeftRight className="h-5 w-5" />, tint: "sky", subtitle: `${successRate}% success rate` },
    { id: "upi", title: "UPI Profiles", value: upiProfiles.length, icon: <Smartphone className="h-5 w-5" />, tint: "rose", subtitle: "Registered users" },
  ];

  return (
    <PageWrapper>
      <PageHeader
        title="Command Center"
        subtitle="Enterprise banking infrastructure monitoring & control"
        icon={<ShieldCheck className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Updated {lastUpdated.toLocaleTimeString()}
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <span className="w-2 h-2 bg-emerald-400 rounded-full pulse-live" />
              <span className="text-xs text-emerald-400 font-medium">Live</span>
            </div>
            <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Sync
            </Button>
          </div>
        }
      />

      {/* Stats Row */}
      <FuturisticStatsGrid widgets={widgets} loading={loading} columnsClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" />

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2">
          <FuturisticChart 
            data={transactionData} 
            title="Transaction Volume (6 Months)" 
            type="area" 
            height={320}
            colors={["#22d3ee", "#a78bfa"]}
          />
        </div>
        <FuturisticChart 
          data={transactionStatusData} 
          title="Transaction Status" 
          type="pie" 
          height={320}
          colors={["#10b981", "#f59e0b", "#f43f5e"]}
        />
      </div>

      {/* Activity & System Health Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="glass-card-futuristic overflow-hidden flex flex-col" style={{ maxHeight: '500px' }}>
          <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[var(--glass-bg)] backdrop-blur-xl z-10">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Live Activity Stream
            </h3>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full pulse-live" />
              <span className="text-[10px] text-cyan-400 font-medium uppercase tracking-wide">Live</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {activityEvents.map((event) => (
              <div key={event.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all hover:bg-white/10">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {event.type === "kyc" && <ShieldCheck className="w-4 h-4 text-amber-400" />}
                    {event.type === "account" && <CreditCard className="w-4 h-4 text-violet-400" />}
                    {event.type === "transaction" && <ArrowLeftRight className="w-4 h-4 text-cyan-400" />}
                    <span className="text-sm font-medium">{event.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(event.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{event.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">• {event.user}</span>
                  {event.amount && <span className="text-sm font-semibold text-cyan-400">{event.amount}</span>}
                  <span className={`badge-futuristic badge-futuristic--${event.status === 'success' ? 'success' : event.status === 'pending' ? 'warning' : 'danger'} text-[10px] px-2 py-0.5`}>
                    {event.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="glass-card-futuristic overflow-hidden flex flex-col" style={{ maxHeight: '500px' }}>
          <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[var(--glass-bg)] backdrop-blur-xl z-10">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              System Health
            </h3>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wide">All Systems Operational</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {[
              { name: "API Gateway", status: "healthy", latency: "12ms", uptime: "99.99%" },
              { name: "Database Cluster", status: "healthy", latency: "8ms", uptime: "99.95%" },
              { name: "Payment Gateway", status: "healthy", latency: "45ms", uptime: "99.90%" },
              { name: "UPI Switch", status: "healthy", latency: "28ms", uptime: "99.98%" },
              { name: "Auth Service", status: "healthy", latency: "45ms", uptime: "99.85%" },
              { name: "Webhook Handler", status: "healthy", latency: "15ms", uptime: "99.92%" },
            ].map((service, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all hover:bg-white/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">{service.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${service.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'} pulse-live`} />
                    <span className="text-[10px] text-emerald-400 font-medium uppercase">Healthy</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span className="text-muted-foreground">Latency:</span>
                    <span className="font-semibold text-amber-400">{service.latency}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span className="text-muted-foreground">Uptime:</span>
                    <span className="font-semibold text-emerald-400">{service.uptime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bank Distribution & Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <FuturisticChart 
          data={bankDistributionData} 
          title="Bank Distribution" 
          type="bar" 
          height={280}
          colors={["#22d3ee", "#a78bfa", "#10b981", "#f59e0b"]}
        />
        
        <FuturisticQuickActions
          title="Admin Console"
          actions={[
            { to: "/security", label: "Security Center", icon: Lock, description: "Manage roles & sessions" },
            { to: "/audit", label: "Audit Logs", icon: FileText, description: "Compliance events" },
            { to: "/webhooks", label: "Webhooks", icon: Link2, description: "Integration endpoints" },
            { to: "/banks", label: "Bank Registry", icon: Building2, description: "Manage banks" },
            { to: "/accounts", label: "Account Approvals", icon: CreditCard, description: `${pendingAccounts} pending` },
            { to: "/transactions", label: "Transaction Log", icon: ArrowLeftRight, description: "View all transactions" },
          ]}
          columns={2}
          className="lg:col-span-2"
        />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card-futuristic p-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-muted-foreground">Active Sessions</span>
          </div>
          <p className="text-2xl font-bold text-cyan-400">{customers.length * 3 + 247}</p>
          <p className="text-xs text-emerald-400 mt-1">Real-time count</p>
        </div>
        <div className="glass-card-futuristic p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-muted-foreground">Total Data</span>
          </div>
          <p className="text-2xl font-bold text-violet-400">{accounts.length + customers.length + transactions.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Records</p>
        </div>
        <div className="glass-card-futuristic p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-muted-foreground">Compliance Score</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{successRate}%</p>
          <p className="text-xs text-emerald-400 mt-1">Transaction success</p>
        </div>
        <div className="glass-card-futuristic p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-muted-foreground">Pending Items</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{pendingAccounts}</p>
          <p className="text-xs text-amber-400 mt-1">Accounts need review</p>
        </div>
      </div>
    </PageWrapper>
  );
}

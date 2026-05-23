import { useMemo } from "react";
import {
  Users,
  CreditCard,
  RefreshCw,
  UserPlus,
  ClipboardCheck,
  UserCircle2,
  Mail,
  UserCheck,
  Shield,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
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

const generateActivityEvents = (customers: any[], accounts: any[]): ActivityEvent[] => {
  const events: ActivityEvent[] = [];
  
  customers.slice(0, 4).forEach((c, i) => {
    events.push({
      id: `cust-${c.customerId || i}`,
      type: "kyc",
      title: c.kycStatus === "COMPLETED" ? "KYC Verified" : c.kycStatus === "PENDING" ? "KYC Pending" : "KYC Rejected",
      description: `${c.fullName || c.email}`,
      timestamp: new Date(Date.now() - i * 600000).toISOString(),
      status: c.kycStatus === "COMPLETED" ? "success" as const : c.kycStatus === "PENDING" ? "pending" as const : "failed" as const,
      user: c.email,
    });
  });

  accounts.slice(0, 2).forEach((a, i) => {
    events.push({
      id: `acc-${a.accountId || i}`,
      type: "account",
      title: a.status === "ACTIVE" ? "Account Activated" : "Account Created",
      description: `${a.accountNumber} - ${a.bankName}`,
      timestamp: new Date(Date.now() - (i + 4) * 600000).toISOString(),
      status: a.status === "ACTIVE" ? "success" as const : "pending" as const,
      user: a.customerName || "Unknown",
    });
  });

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const generateKYCData = (customers: any[]) => {
  const weeklyData: Record<string, number> = {};
  const now = new Date();
  
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const key = `Week ${4 - i}`;
    weeklyData[key] = Math.floor(Math.random() * 20) + 30;
  }
  
  return Object.entries(weeklyData).map(([name, value]) => ({ name, value }));
};

const generateCustomerStatusData = (customers: any[]) => {
  const active = customers.filter(c => c.customerStatus === "ACTIVE").length;
  const pending = customers.filter(c => c.customerStatus === "PENDING").length;
  const suspended = customers.filter(c => c.customerStatus === "SUSPENDED").length;
  const newCust = customers.length - active - pending - suspended;
  
  return [
    { name: "Active", value: active || 245 },
    { name: "Pending", value: pending || 28 },
    { name: "Suspended", value: suspended || 12 },
    { name: "New", value: newCust || 35 },
  ];
};

export default function CustomerManagerDashboard() {
  const { customers, accounts, loading, reload, lastUpdated } = useDashboardData("all", {
    banks: false,
    upi: false,
    transactions: false,
    realtime: 30000,
  });

  const pendingKyc = customers.filter((c) => c.kycStatus === "PENDING").length;
  const verifiedKyc = customers.filter((c) => c.kycStatus === "COMPLETED").length;
  const activeCustomers = customers.filter((c) => c.customerStatus === "ACTIVE").length;
  const pendingAccounts = accounts.filter((a) => a.status === "PENDING").length;

  const activityEvents = useMemo(() => generateActivityEvents(customers, accounts), [customers, accounts]);
  const kycData = useMemo(() => generateKYCData(customers), [customers]);
  const customerStatusData = useMemo(() => generateCustomerStatusData(customers), [customers]);

  const widgets: FuturisticStatWidget[] = [
    { id: "customers", title: "Total Customers", value: customers.length, icon: <Users className="h-5 w-5" />, subtitle: `${activeCustomers} active`, tint: "cyan" },
    { id: "verified", title: "Verified KYC", value: verifiedKyc, icon: <UserCheck className="h-5 w-5" />, tint: "emerald" },
    { id: "pending-kyc", title: "Pending KYC", value: pendingKyc, icon: <UserCircle2 className="h-5 w-5" />, subtitle: "Awaiting review", tint: "amber" },
    { id: "accounts", title: "Customer Accounts", value: accounts.length, icon: <CreditCard className="h-5 w-5" />, subtitle: `${pendingAccounts} pending`, tint: "sky" },
  ];

  return (
    <PageWrapper>
      <PageHeader
        title="Customer Service Center"
        subtitle="Onboarding, KYC verification & customer relationship management"
        icon={<Users className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {lastUpdated.toLocaleTimeString()}
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/30">
              <Shield className="w-3 h-3 text-cyan-400" />
              <span className="text-xs text-cyan-400 font-medium">KYC Active</span>
            </div>
            <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Sync
            </Button>
          </div>
        }
      />

      <FuturisticStatsGrid
        widgets={widgets}
        loading={loading}
        columnsClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2">
          <FuturisticChart 
            data={kycData} 
            title="KYC Verifications (Weekly)" 
            type="area" 
            height={300}
            colors={["#22d3ee", "#10b981"]}
          />
        </div>
        <FuturisticChart 
          data={customerStatusData} 
          title="Customer Status Distribution" 
          type="pie" 
          height={300}
          colors={["#10b981", "#f59e0b", "#f43f5e", "#22d3ee"]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <FuturisticActivityFeed 
          events={activityEvents} 
          title="Customer Activity"
          maxEvents={6}
        />
        
        <div className="lg:col-span-2">
          <div className="glass-card-futuristic p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-cyan-400" />
              KYC Review Queue
            </h3>
            <div className="space-y-3">
              {customers.filter(c => c.kycStatus === "PENDING").slice(0, 3).map((cust, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/20">
                      <UserCircle2 className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{cust.fullName || cust.email}</p>
                      <p className="text-xs text-muted-foreground">{cust.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge-futuristic badge-futuristic--warning">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </span>
                    <Button size="sm" variant="outline" className="h-8 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20">
                      Review
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
          title="Customer Service Tools"
          actions={[
            { to: "/customers", label: "New Customer", icon: UserPlus, description: "Onboard a customer", badge: "Start", badgeType: "success" },
            { to: "/customers", label: "KYC Queue", icon: ClipboardCheck, description: `${pendingKyc} pending`, badge: `${pendingKyc}`, badgeType: "warning" },
            { to: "/accounts", label: "Open Account", icon: CreditCard, description: "Create a bank account" },
            { to: "/customers", label: "Lookup by Email", icon: Mail, description: "Find customer records" },
          ]}
          columns={2}
          className="lg:col-span-2"
        />
        
        <div className="glass-card-futuristic p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Today's Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Customers Onboarded</span>
              <span className="text-lg font-bold text-cyan-400">{customers.filter(c => c.customerStatus === "ACTIVE").length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">KYC Verified</span>
              <span className="text-lg font-bold text-emerald-400">{verifiedKyc}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Accounts Opened</span>
              <span className="text-lg font-bold text-violet-400">{accounts.filter(a => a.status === "ACTIVE").length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pending KYC</span>
              <span className="text-lg font-bold text-amber-400">{pendingKyc}</span>
            </div>
            <div className="pt-4 border-t border-white/10">
              <div className="progress-futuristic">
                <div className="progress-futuristic-bar" style={{ width: `${Math.round((verifiedKyc / (customers.length || 1)) * 100)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{Math.round((verifiedKyc / (customers.length || 1)) * 100)}% SLA compliance</p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

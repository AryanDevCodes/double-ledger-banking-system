import { useMemo } from "react";
import {
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Activity,
  TrendingUp,
  Search,
  Filter,
  Eye,
  Lock,
  Globe,
  Server,
  Database,
  Users,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PageWrapper from "@/components/PageWrapper";
import PageHeader from "@/components/PageHeader";
import { useDashboardData } from "@/hooks/useDashboardData";
import FuturisticStatsGrid, { type FuturisticStatWidget } from "@/components/dashboard/FuturisticStatsGrid";
import FuturisticChart from "@/components/dashboard/FuturisticChart";
import FuturisticActivityFeed, { type ActivityEvent } from "@/components/dashboard/FuturisticActivityFeed";
import FuturisticQuickActions from "@/components/dashboard/FuturisticQuickActions";

const generateAuditEvents = (): ActivityEvent[] => [
  { id: "1", type: "system", title: "Login Successful", description: "Admin accessed system from 192.168.1.100", timestamp: new Date(Date.now() - 180000).toISOString(), status: "success", user: "admin@bank.com" },
  { id: "2", type: "security", title: "Permission Changed", description: "User role updated from USER to MANAGER", timestamp: new Date(Date.now() - 600000).toISOString(), status: "warning", user: "admin@bank.com" },
  { id: "3", type: "transaction", title: "Large Transaction", description: "₹10,00,000 transfer flagged for review", timestamp: new Date(Date.now() - 900000).toISOString(), status: "warning", amount: "₹10,00,000" },
  { id: "4", type: "account", title: "Account Created", description: "New account ACC-2024-00915 created", timestamp: new Date(Date.now() - 1200000).toISOString(), status: "success", user: "manager@bank.com" },
  { id: "5", type: "security", title: "Failed Login", description: "Multiple failed attempts detected", timestamp: new Date(Date.now() - 1800000).toISOString(), status: "failed", user: "unknown" },
  { id: "6", type: "kyc", title: "KYC Approved", description: "Customer documents verified", timestamp: new Date(Date.now() - 2400000).toISOString(), status: "success", user: "customermanager@bank.com" },
];

const generateAuditData = () => [
  { name: "Mon", value: 45 },
  { name: "Tue", value: 52 },
  { name: "Wed", value: 38 },
  { name: "Thu", value: 61 },
  { name: "Fri", value: 55 },
  { name: "Sat", value: 28 },
  { name: "Sun", value: 15 },
];

const generateRiskData = () => [
  { name: "Low", value: 245 },
  { name: "Medium", value: 42 },
  { name: "High", value: 12 },
  { name: "Critical", value: 3 },
];

export default function AuditorDashboard() {
  const { banks, customers, accounts, transactions, loading, reload } = useDashboardData("all", {
    upi: false,
  });

  const totalTransactions = transactions.length;
const flaggedTransactions = transactions.filter((t) => t.status === "PENDING").length;  const activeAccounts = accounts.filter((a) => a.status === "ACTIVE").length;
  const pendingAccounts = accounts.filter((a) => a.status === "PENDING").length;

  const auditEvents = useMemo(() => generateAuditEvents(), []);
  const auditData = useMemo(() => generateAuditData(), []);
  const riskData = useMemo(() => generateRiskData(), []);

  const widgets: FuturisticStatWidget[] = [
    { id: "total", title: "Total Events", value: 1247, icon: <FileText className="h-5 w-5" />, tint: "violet", subtitle: "This week" },
    { id: "transactions", title: "Transactions", value: totalTransactions, icon: <Activity className="h-5 w-5" />, tint: "cyan" },
    { id: "flagged", title: "Flagged Items", value: flaggedTransactions, icon: <AlertTriangle className="h-5 w-5" />, tint: "amber", subtitle: "Requires review" },
    { id: "accounts", title: "Active Accounts", value: activeAccounts, icon: <CreditCard className="h-5 w-5" />, tint: "emerald" },
    { id: "pending", title: "Pending", value: pendingAccounts, icon: <Clock className="h-5 w-5" />, tint: "rose" },
    { id: "compliance", title: "Compliance", value: "98.2%", icon: <Shield className="h-5 w-5" />, tint: "sky" },
  ];

  return (
    <PageWrapper>
      <PageHeader
        title="Audit Command Center"
        subtitle="Compliance monitoring, security audit & risk analysis"
        icon={<Shield className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/30">
              <Eye className="w-3 h-3 text-violet-400" />
              <span className="text-xs text-violet-400 font-medium">Audit Mode</span>
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
            data={auditData} 
            title="Audit Events (Daily)" 
            type="bar" 
            height={320}
            
          />
        </div>
        <FuturisticChart 
          data={riskData} 
          title="Risk Distribution" 
          type="pie" 
          height={320}
          
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <FuturisticActivityFeed 
          events={auditEvents} 
          title="Recent Audit Events"
          maxEvents={6}
        />
        
        <div className="lg:col-span-2">
          <div className="glass-card-futuristic p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Search className="w-4 h-4 text-violet-400" />
              Compliance Checks
            </h3>
            <div className="space-y-3">
              {[
                { name: "KYC Compliance", status: "pass", score: "98.5%", issues: 2 },
                { name: "Transaction Monitoring", status: "pass", score: "99.2%", issues: 1 },
                { name: "Data Privacy", status: "warning", score: "95.0%", issues: 5 },
                { name: "Access Control", status: "pass", score: "97.8%", issues: 3 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.status === 'pass' ? 'bg-success/20' : 'bg-warning/20'}`}>
                      {item.status === 'pass' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.issues} issues found</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${item.status === 'pass' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {item.score}
                    </p>
                    <p className="text-xs text-muted-foreground">compliance</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <FuturisticQuickActions
          title="Audit Tools"
          actions={[
            { to: "/audit", label: "Audit Logs", icon: FileText, description: "View all events" },
            { to: "/transactions", label: "Transactions", icon: Activity, description: "Review transactions" },
            { to: "/accounts", label: "Accounts", icon: CreditCard, description: "Account registry" },
            { to: "/customers", label: "Customers", icon: Users, description: "Customer data" },
            { to: "/security", label: "Security", icon: Lock, description: "Security settings" },
            { to: "/webhooks", label: "Webhooks", icon: Globe, description: "Integration logs" },
          ]}
          columns={2}
          className="lg:col-span-2"
        />
        
        <div className="glass-card-futuristic p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Compliance Score
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overall Score</span>
              <span className="text-2xl font-bold text-violet-400">98.2%</span>
            </div>
            <div className="pt-4 border-t border-white/10">
              <div className="progress-futuristic">
                <div className="progress-futuristic-bar" style={{ width: "98%" }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">↑ 0.5% from last month</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-3 rounded-lg bg-white/5">
                <p className="text-lg font-bold text-emerald-400">247</p>
                <p className="text-xs text-muted-foreground">Events Today</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5">
                <p className="text-lg font-bold text-amber-400">3</p>
                <p className="text-xs text-muted-foreground">Open Alerts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

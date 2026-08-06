import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  AlertCircle,
  ArrowLeftRight,
  Building2,
  CalendarDays,
  CreditCard,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  UserCircle2,
  Users,
  Camera,
  Upload,
  X,
  Check,
  Edit2,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Link as LinkIcon,
  ExternalLink,
  Settings,
  Share2,
  Download,
  Printer,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import PageWrapper from "@/components/PageWrapper";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import { StatCardSkeleton, TableSkeleton } from "@/components/LoadingStates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import {
  accountApi,
  ApiError,
  authApi,
  transactionApi,
  upiApi,
  type AuthUserProfileResponse,
} from "@/lib/api-client";
import { ROLES, ROLE_LABELS, getPrimaryRole } from "@/lib/rbac";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { normalizeProfilePhotoUrl } from "@/lib/profile-photo";
import type {
  AccountResponseDTO,
  CustomerResponseDTO,
  TransactionResponseDTO,
  UpiProfileResponseDTO,
} from "@/types/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────

interface RoleScope {
  title: string;
  summary: string;
  highlights: string[];
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────

async function requestWithFallback<T>(request: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
      return fallback;
    }
    throw error;
  }
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export default function ProfilePage() {
  const { user, setAvatarUrl } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [profile, setProfile] = useState<AuthUserProfileResponse | null>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerResponseDTO | null>(null);
  const [myAccounts, setMyAccounts] = useState<AccountResponseDTO[]>([]);
  const [myTransactions, setMyTransactions] = useState<TransactionResponseDTO[]>([]);
  const [myUpiProfiles, setMyUpiProfiles] = useState<UpiProfileResponseDTO[]>([]);
  const [managedAccounts, setManagedAccounts] = useState<AccountResponseDTO[]>([]);
  const [managedTransactions, setManagedTransactions] = useState<TransactionResponseDTO[]>([]);
  const [managedUpiProfiles, setManagedUpiProfiles] = useState<UpiProfileResponseDTO[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState("overview");
  const [loadingManagedData, setLoadingManagedData] = useState(false);
  const [managedDataLoaded, setManagedDataLoaded] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState("");
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // ─── Derived ──────────────────────────────

  const effectiveRoles = profile?.roles?.length ? profile.roles : user?.roles ?? [];
  const roleSet = useMemo(() => new Set(effectiveRoles), [effectiveRoles]);
  const primaryRole = getPrimaryRole(effectiveRoles);
  const roleLabel = primaryRole ? ROLE_LABELS[primaryRole] : "User";
  const isRetailUser = primaryRole === ROLES.USER;
  const isAdmin = roleSet.has(ROLES.ADMIN);
  const isPrivilegedUser =
    roleSet.has(ROLES.ADMIN) ||
    roleSet.has(ROLES.MANAGER) ||
    roleSet.has(ROLES.CUSTOMER_MANAGER) ||
    roleSet.has(ROLES.AUDITOR);

  const canViewManagedAccounts =
    roleSet.has(ROLES.ADMIN) ||
    roleSet.has(ROLES.MANAGER) ||
    roleSet.has(ROLES.CUSTOMER_MANAGER) ||
    roleSet.has(ROLES.AUDITOR);

  const canViewManagedTransactions =
    roleSet.has(ROLES.ADMIN) || roleSet.has(ROLES.MANAGER) || roleSet.has(ROLES.AUDITOR);

  const canViewManagedUpi =
    roleSet.has(ROLES.ADMIN) || roleSet.has(ROLES.MANAGER) || roleSet.has(ROLES.AUDITOR);

  const accountsView = isRetailUser ? myAccounts : managedAccounts;
  const transactionsView = isRetailUser ? myTransactions : managedTransactions;
  const upiView = isRetailUser ? myUpiProfiles : managedUpiProfiles;

  const totalBalance = useMemo(
    () => accountsView.reduce((sum, acc) => sum + (acc.balance || 0), 0),
    [accountsView]
  );

  const personalTotalBalance =
    typeof profile?.totalBalance === "number"
      ? profile.totalBalance
      : myAccounts.reduce((sum, item) => sum + (Number(item.balance) || 0), 0);

  const finalBalance = isRetailUser ? personalTotalBalance : totalBalance;

  const stats = {
    accounts: accountsView.length,
    upi: upiView.length,
    transactions: transactionsView.length,
    balance: finalBalance,
  };

  // ─── Handlers ─────────────────────────────

  const getInitials = useCallback((name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const toCustomerProfile = useCallback(
    (currentUser: AuthUserProfileResponse | null): CustomerResponseDTO | null => {
      if (!currentUser) return null;
      const hasCustomerData =
        !!currentUser.customerId ||
        !!currentUser.kycStatus ||
        !!currentUser.customerStatus ||
        !!currentUser.address ||
        currentUser.age !== undefined;
      if (!hasCustomerData) return null;
      return {
        id: currentUser.customerId ?? "",
        fullName: currentUser.fullName ?? user?.fullName ?? "",
        email: currentUser.email ?? user?.email ?? "",
        phoneNumber: currentUser.phoneNumber ?? "",
        kycStatus: (currentUser.kycStatus as CustomerResponseDTO["kycStatus"]) ?? "PENDING",
        customerStatus: (currentUser.customerStatus as CustomerResponseDTO["customerStatus"]) ?? "ACTIVE",
        age: currentUser.age,
        address: currentUser.address,
      };
    },
    [user?.email, user?.fullName]
  );

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setManagedDataLoaded(false);
    try {
      const [currentUser, ownAccounts, ownTransactions, ownUpi] = await Promise.all([
        requestWithFallback(() => authApi.getCurrentUser(), null),
        requestWithFallback(() => accountApi.getMy(), [] as AccountResponseDTO[]),
        requestWithFallback(() => transactionApi.getMy(), [] as TransactionResponseDTO[]),
        requestWithFallback(() => upiApi.getMy(), [] as UpiProfileResponseDTO[]),
      ]);
      setProfile(currentUser);
      setCustomerProfile(toCustomerProfile(currentUser));
      setMyAccounts(ownAccounts);
      setMyTransactions(ownTransactions);
      setMyUpiProfiles(ownUpi);
      setManagedAccounts([]);
      setManagedTransactions([]);
      setManagedUpiProfiles([]);
    } catch (err) {
      console.error(err);
      setError("Unable to load full profile data. Please retry.");
    } finally {
      setLoading(false);
    }
  }, [toCustomerProfile, user]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    setAvatarDraft(user?.avatarUrl ?? "");
  }, [user?.avatarUrl]);

  const loadManagedData = useCallback(async () => {
    if (!user || isRetailUser || managedDataLoaded || loadingManagedData || !canViewManagedAccounts) return;
    setLoadingManagedData(true);
    try {
      const [accounts, transactions, upiProfiles] = await Promise.all([
        requestWithFallback(() => accountApi.getAll(), [] as AccountResponseDTO[]),
        canViewManagedTransactions
          ? requestWithFallback(() => transactionApi.getAll(), [] as TransactionResponseDTO[])
          : Promise.resolve([] as TransactionResponseDTO[]),
        canViewManagedUpi
          ? requestWithFallback(() => upiApi.getAll(), [] as UpiProfileResponseDTO[])
          : Promise.resolve([] as UpiProfileResponseDTO[]),
      ]);
      setManagedAccounts(accounts);
      setManagedTransactions(transactions);
      setManagedUpiProfiles(upiProfiles);
      setManagedDataLoaded(true);
    } catch (loadError) {
      console.error(loadError);
      toast.error("Unable to load managed profile data");
    } finally {
      setLoadingManagedData(false);
    }
  }, [
    canViewManagedAccounts,
    canViewManagedTransactions,
    canViewManagedUpi,
    isRetailUser,
    loadingManagedData,
    managedDataLoaded,
    user,
  ]);

  useEffect(() => {
    if (isRetailUser) return;
    if ((activeTab === "banking" || activeTab === "compliance") && !managedDataLoaded && !loadingManagedData) {
      void loadManagedData();
    }
  }, [activeTab, isRetailUser, loadManagedData, loadingManagedData, managedDataLoaded]);

  const saveAvatarUrl = () => {
    const normalizedUrl = normalizeProfilePhotoUrl(avatarDraft);
    if (avatarDraft.trim() && !normalizedUrl) {
      toast.error("Enter a valid image URL (http/https)");
      return;
    }
    setAvatarUrl(normalizedUrl);
    toast.success(normalizedUrl ? "Profile photo updated" : "Profile photo cleared");
    setIsEditingAvatar(false);
  };

  // ─── Memoized Data ─────────────────────────

  const roleScope: RoleScope = useMemo(() => {
    switch (primaryRole) {
      case ROLES.ADMIN:
        return {
          title: "Administrator Scope",
          summary: "Platform-wide control over banking operations, security, and compliance.",
          highlights: [
            "Manage banks, customers, accounts, and platform security",
            "Monitor audit and access events for governance",
            "Supervise operational health and policy enforcement",
          ],
        };
      case ROLES.MANAGER:
        return {
          title: "Manager Scope",
          summary: "Operational ownership of banking throughput and customer servicing.",
          highlights: [
            "Manage banks, accounts, and customer operations",
            "Track transaction and UPI activity at scale",
            "Maintain service quality across branches",
          ],
        };
      case ROLES.CUSTOMER_MANAGER:
        return {
          title: "Customer Manager Scope",
          summary: "Customer portfolio governance and onboarding/compliance support.",
          highlights: [
            "Maintain customer records and KYC lifecycle",
            "Support account compliance and customer readiness",
            "Coordinate with operations for customer resolution",
          ],
        };
      case ROLES.AUDITOR:
        return {
          title: "Auditor Scope",
          summary: "Independent oversight for compliance, traceability, and risk monitoring.",
          highlights: [
            "Review platform activity and access controls",
            "Assess audit trails for policy adherence",
            "Flag anomalies for operational follow-up",
          ],
        };
      default:
        return {
          title: "Customer Scope",
          summary: "Personal banking visibility across accounts, transactions, and UPI profile controls.",
          highlights: [
            "Track account balances and transaction history",
            "Manage UPI profiles and payment readiness",
            "Maintain customer profile and KYC details",
          ],
        };
    }
  }, [primaryRole]);

  const topBanks = useMemo(() => {
    const source = isRetailUser ? myAccounts : managedAccounts;
    const map = new Map<string, number>();
    source.forEach((item) => {
      map.set(item.bankName, (map.get(item.bankName) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [isRetailUser, managedAccounts, myAccounts]);

  const bankDistributionData = useMemo(
    () => topBanks.map(([name, value]) => ({ name, value })),
    [topBanks]
  );

  const recentTransactions = useMemo(
    () => transactionsView.slice(0, 6),
    [transactionsView]
  );

  // ─── Render ────────────────────────────────

  const renderSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-6">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );

  if (loading) {
    return (
      <PageWrapper>
        <div className="space-y-6">{renderSkeleton()}</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-8">
        {/* ── Hero Section ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-background to-secondary/5 border border-border/40 p-6 md:p-8"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 ring-4 ring-background shadow-xl border-2 border-primary/20">
                {user?.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={profile?.fullName ?? user?.fullName ?? "User"} />
                ) : null}
                <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                  {getInitials(profile?.fullName ?? user?.fullName ?? user?.username)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background shadow-sm" />
              <button
                onClick={() => setIsEditingAvatar(true)}
                className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 shadow-lg hover:scale-110 transition-transform"
              >
                <Camera className="h-3 w-3 text-white" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    {profile?.fullName ?? user?.fullName ?? "User"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    @{profile?.username ?? user?.username ?? "username"}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary" className="rounded-full">
                      {roleLabel}
                    </Badge>
                    {isAdmin && (
                      <Badge variant={profile?.isActive && !profile?.isLocked ? "default" : "destructive"} className="rounded-full">
                        {profile?.isActive && !profile?.isLocked ? "Active" : "Restricted"}
                      </Badge>
                    )}
                    <Badge variant="outline" className="rounded-full flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      {primaryRole === ROLES.ADMIN ? "Full Access" : "Limited"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => void loadProfile()} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user?.email ?? "")}>
                        <Mail className="h-4 w-4 mr-2" /> Copy Email
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" /> Export Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Printer className="h-4 w-4 mr-2" /> Print
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {profile?.email ?? user?.email ?? "-"}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {profile?.phoneNumber || "-"}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Joined {profile?.createdAt ? formatDateTime(profile.createdAt) : "-"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Last login {profile?.lastLogin ? formatDateTime(profile.lastLogin) : "-"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Metrics Row ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <StatCard
            title="Accounts"
            value={stats.accounts}
            icon={<CreditCard className="h-5 w-5" />}
            tint="indigo"
          />
          <StatCard
            title="Balance"
            value={formatCurrency(stats.balance)}
            icon={<Building2 className="h-5 w-5" />}
            tint="emerald"
          />
          <StatCard
            title="Transactions"
            value={stats.transactions}
            icon={<ArrowLeftRight className="h-5 w-5" />}
            tint="sky"
          />
          <StatCard
            title="UPI Profiles"
            value={stats.upi}
            icon={<Smartphone className="h-5 w-5" />}
            tint="rose"
          />
        </motion.div>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1 bg-muted/30 p-1 rounded-2xl">
            <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="banking" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Banking
            </TabsTrigger>
            <TabsTrigger value="identity" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Identity
            </TabsTrigger>
            <TabsTrigger value="compliance" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Compliance
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* ── Overview Tab ── */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="md:col-span-2 panel-luxe">
                    <CardHeader>
                      <CardTitle className="text-base">Role Mandate</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {roleScope.title}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">{roleScope.summary}</p>
                      </div>
                      <ul className="space-y-2">
                        {roleScope.highlights.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-sm"
                          >
                            <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="panel-luxe">
                    <CardHeader>
                      <CardTitle className="text-base">Live Signals</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { label: "KYC Compliance", value: profile?.kycCompliance ?? 0, icon: ShieldCheck },
                        { label: "Active Sessions", value: profile?.activeSessionCount ?? 0, icon: Lock },
                        { label: "Pending Reviews", value: profile?.pendingKycCount ?? 0, icon: AlertCircle },
                        { label: "Failed Logins", value: profile?.failedLoginCount ?? 0, icon: AlertTriangle },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/10 p-3"
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4 text-primary" />
                            <span className="text-sm">{item.label}</span>
                          </div>
                          <span className="text-sm font-bold">{item.value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <Card className="panel-luxe">
                  <CardHeader>
                    <CardTitle className="text-base">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentTransactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No recent activity.</p>
                    ) : (
                      <div className="space-y-3">
                        {recentTransactions.map((tx, idx) => (
                          <div
                            key={tx.transactionId}
                            className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/10 p-3 hover:bg-muted/20 transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={cn(
                                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                  tx.amount > 0 ? "bg-emerald-500/10" : "bg-red-500/10"
                                )}
                              >
                                {tx.amount > 0 ? (
                                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {tx.senderAccountNumber} → {tx.receiverAccountNumber}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDateTime(tx.transactionDate)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">
                                {formatCurrency(tx.amount)}
                              </span>
                              <StatusBadge status={tx.status} className="text-xs" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Banking Tab ── */}
              <TabsContent value="banking" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="panel-luxe">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Accounts ({accountsView.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {accountsView.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No accounts found.</p>
                      ) : (
                        <div className="space-y-3">
                          {accountsView.slice(0, 6).map((acc) => (
                            <div
                              key={acc.accountNumber}
                              className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/10 p-3"
                            >
                              <div>
                                <p className="font-mono text-sm font-medium">{acc.accountNumber}</p>
                                <p className="text-xs text-muted-foreground">{acc.bankName}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold">{formatCurrency(acc.balance)}</p>
                                <StatusBadge status={acc.status} className="text-xs" />
                              </div>
                            </div>
                          ))}
                          {accountsView.length > 6 && (
                            <p className="text-xs text-muted-foreground">+{accountsView.length - 6} more</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="panel-luxe">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        UPI Profiles ({upiView.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {upiView.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No UPI profiles.</p>
                      ) : (
                        <div className="space-y-2">
                          {upiView.map((upi) => (
                            <div
                              key={upi.upiId}
                              className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/10 p-3"
                            >
                              <div>
                                <p className="font-mono text-sm font-medium">{upi.upiId}</p>
                                <p className="text-xs text-muted-foreground">{upi.bankName}</p>
                              </div>
                              <StatusBadge status={upi.status} className="text-xs" />
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card className="panel-luxe">
                  <CardHeader>
                    <CardTitle className="text-base">Transaction History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transactionsView.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No transactions.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/60">
                              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Date</th>
                              <th className="text-left py-2 px-3 text-muted-foreground font-medium">From</th>
                              <th className="text-left py-2 px-3 text-muted-foreground font-medium">To</th>
                              <th className="text-right py-2 px-3 text-muted-foreground font-medium">Amount</th>
                              <th className="text-center py-2 px-3 text-muted-foreground font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactionsView.slice(0, 8).map((tx) => (
                              <tr key={tx.transactionId} className="border-b border-border/40 hover:bg-muted/10 transition">
                                <td className="py-2 px-3 text-xs">{formatDateTime(tx.transactionDate)}</td>
                                <td className="py-2 px-3 text-xs">{tx.senderAccountNumber}</td>
                                <td className="py-2 px-3 text-xs">{tx.receiverAccountNumber}</td>
                                <td className="py-2 px-3 text-right font-mono font-semibold">
                                  {formatCurrency(tx.amount)}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <StatusBadge status={tx.status} className="text-xs" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Identity Tab ── */}
              <TabsContent value="identity" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="panel-luxe">
                    <CardHeader>
                      <CardTitle className="text-base">Profile Photo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-32 w-32 ring-4 ring-primary/10">
                          {user?.avatarUrl ? (
                            <AvatarImage src={user.avatarUrl} alt="Profile" />
                          ) : null}
                          <AvatarFallback className="text-4xl font-bold bg-primary/10 text-primary">
                            {getInitials(profile?.fullName ?? user?.fullName ?? user?.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setIsEditingAvatar(true)}>
                            <Upload className="h-4 w-4 mr-2" /> Upload
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAvatarDraft("");
                              setAvatarUrl(null);
                              toast.success("Profile photo cleared");
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="panel-luxe">
                    <CardHeader>
                      <CardTitle className="text-base">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { label: "Full Name", value: profile?.fullName ?? user?.fullName, key: "fullName" },
                        { label: "Username", value: profile?.username ?? user?.username, key: "username" },
                        { label: "Email", value: profile?.email ?? user?.email, key: "email" },
                        { label: "Phone", value: profile?.phoneNumber || "-", key: "phone" },
                      ].map((field) => (
                        <div key={field.key} className="flex items-center justify-between border-b border-border/40 pb-2">
                          <span className="text-sm text-muted-foreground">{field.label}</span>
                          <span className="text-sm font-medium">{field.value || "-"}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {customerProfile && (
                  <Card className="panel-luxe">
                    <CardHeader>
                      <CardTitle className="text-base">Customer Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">KYC Status</p>
                          <StatusBadge status={customerProfile.kycStatus} />
                        </div>
                        <div>
                          <p className="text-muted-foreground">Customer Status</p>
                          <StatusBadge status={customerProfile.customerStatus} />
                        </div>
                        <div>
                          <p className="text-muted-foreground">Age</p>
                          <p className="font-medium">{customerProfile.age ?? "-"}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Address</p>
                          <p className="font-medium">{customerProfile.address || "-"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ── Compliance Tab ── */}
              <TabsContent value="compliance" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="panel-luxe">
                    <CardHeader>
                      <CardTitle className="text-base">Role Mandate</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {roleScope.title}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">{roleScope.summary}</p>
                      </div>
                      <ul className="space-y-2">
                        {roleScope.highlights.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-sm"
                          >
                            <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="panel-luxe">
                    <CardHeader>
                      <CardTitle className="text-base">Operational Context</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-border/40 p-3 text-center">
                          <p className="text-xs text-muted-foreground">Banks</p>
                          <p className="text-xl font-bold">{profile?.managedBankCount ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-border/40 p-3 text-center">
                          <p className="text-xs text-muted-foreground">Customers</p>
                          <p className="text-xl font-bold">{profile?.managedCustomerCount ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-border/40 p-3 text-center">
                          <p className="text-xs text-muted-foreground">Accounts</p>
                          <p className="text-xl font-bold">{profile?.managedAccountCount ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-border/40 p-3 text-center">
                          <p className="text-xs text-muted-foreground">UPI</p>
                          <p className="text-xl font-bold">{profile?.managedUpiProfileCount ?? 0}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">KYC Compliance</p>
                        <Progress value={profile?.kycCompliance ?? 0} className="h-2" />
                        <p className="text-xs text-right mt-1">{profile?.kycCompliance ?? 0}%</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="panel-luxe">
                  <CardHeader>
                    <CardTitle className="text-base">Bank Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bankDistributionData.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No bank distribution data.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={bankDistributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name }) => name}
                          >
                            {bankDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>

        {/* ── Avatar Edit Dialog ── */}
        <Dialog open={isEditingAvatar} onOpenChange={setIsEditingAvatar}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Profile Photo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-center p-6 border-2 border-dashed border-border rounded-2xl">
                <div className="text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Drag and drop or click to select</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter image URL"
                  value={avatarDraft}
                  onChange={(e) => setAvatarDraft(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={saveAvatarUrl}>Save</Button>
              </div>
              <p className="text-xs text-muted-foreground">Supports http/https URLs</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageWrapper>
  );
}
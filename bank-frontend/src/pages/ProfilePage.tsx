import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import PageWrapper from "@/components/PageWrapper";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { TableSkeleton } from "@/components/LoadingStates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface RoleScope {
  title: string;
  summary: string;
  highlights: string[];
}

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

export default function ProfilePage() {
  const { user, setAvatarUrl } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarDraft, setAvatarDraft] = useState("");

  const [profile, setProfile] = useState<AuthUserProfileResponse | null>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerResponseDTO | null>(null);

  const [myAccounts, setMyAccounts] = useState<AccountResponseDTO[]>([]);
  const [myTransactions, setMyTransactions] = useState<TransactionResponseDTO[]>([]);
  const [myUpiProfiles, setMyUpiProfiles] = useState<UpiProfileResponseDTO[]>([]);

  const [managedAccounts, setManagedAccounts] = useState<AccountResponseDTO[]>([]);
  const [managedTransactions, setManagedTransactions] = useState<TransactionResponseDTO[]>([]);
  const [managedUpiProfiles, setManagedUpiProfiles] = useState<UpiProfileResponseDTO[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loadingManagedData, setLoadingManagedData] = useState(false);
  const [managedDataLoaded, setManagedDataLoaded] = useState(false);

  const getInitials = useCallback((name?: string) => {
    if (!name) {
      return "U";
    }
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const toCustomerProfile = useCallback(
    (currentUser: AuthUserProfileResponse | null): CustomerResponseDTO | null => {
      if (!currentUser) {
        return null;
      }

      const hasCustomerData =
        !!currentUser.customerId ||
        !!currentUser.kycStatus ||
        !!currentUser.customerStatus ||
        !!currentUser.address ||
        currentUser.age !== undefined;

      if (!hasCustomerData) {
        return null;
      }

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
    [user?.email, user?.fullName],
  );

  const loadProfile = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    setError(null);
    setManagedDataLoaded(false);

    try {
      const [
        currentUser,
        ownAccounts,
        ownTransactions,
        ownUpi,
      ] = await Promise.all([
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
    roleSet.has(ROLES.ADMIN) ||
    roleSet.has(ROLES.MANAGER) ||
    roleSet.has(ROLES.AUDITOR);

  const canViewManagedUpi =
    roleSet.has(ROLES.ADMIN) ||
    roleSet.has(ROLES.MANAGER) ||
    roleSet.has(ROLES.AUDITOR);

  const loadManagedData = useCallback(async () => {
    if (!user || isRetailUser || managedDataLoaded || loadingManagedData || !canViewManagedAccounts) {
      return;
    }

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
    if (isRetailUser) {
      return;
    }

    if ((activeTab === "banking" || activeTab === "role-compliance") && !managedDataLoaded && !loadingManagedData) {
      void loadManagedData();
    }
  }, [activeTab, isRetailUser, loadManagedData, loadingManagedData, managedDataLoaded]);

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

  const accountsView = isRetailUser ? myAccounts : managedAccounts;
  const transactionsView = isRetailUser ? myTransactions : managedTransactions;
  const upiView = isRetailUser ? myUpiProfiles : managedUpiProfiles;

  const personalTotalBalance =
    typeof profile?.totalBalance === "number"
      ? profile.totalBalance
      : myAccounts.reduce((sum, item) => sum + (Number(item.balance) || 0), 0);

  const totalBalance = isRetailUser
    ? personalTotalBalance
    : accountsView.reduce((sum, item) => sum + (Number(item.balance) || 0), 0);

  const personalAccountCount = profile?.accountCount ?? myAccounts.length;
  const personalTransactionCount = profile?.transactionCount ?? myTransactions.length;
  const personalUpiProfileCount = profile?.upiProfileCount ?? myUpiProfiles.length;

  const managedBankCount = profile?.managedBankCount ?? 0;
  const managedCustomerCount = profile?.managedCustomerCount ?? 0;
  const managedAccountCount = profile?.managedAccountCount ?? 0;
  const managedTransactionCount = profile?.managedTransactionCount ?? 0;
  const managedUpiProfileCount = profile?.managedUpiProfileCount ?? 0;

  const pendingKycCount = profile?.pendingKycCount ?? 0;
  const failedAuditCount = profile?.auditFailureCount ?? 0;
  const successfulAuditCount = profile?.auditSuccessCount ?? 0;
  const failedLogins = profile?.failedLoginCount ?? 0;
  const activeSessions = profile?.activeSessionCount ?? 0;

  const saveAvatarUrl = () => {
    const normalizedUrl = normalizeProfilePhotoUrl(avatarDraft);

    if (avatarDraft.trim() && !normalizedUrl) {
      toast.error("Enter a valid image URL (http/https)");
      return;
    }

    setAvatarUrl(normalizedUrl);
    toast.success(normalizedUrl ? "Profile photo updated" : "Profile photo cleared");
  };

  const totalAuditsTracked = successfulAuditCount + failedAuditCount;

  const profileSignals = useMemo(() => {
    const signals: RoleScope["highlights"] = [];
    const cards: { label: string; value: string | number; note: string; icon: JSX.Element }[] = [];

    if (primaryRole === ROLES.ADMIN) {
      if (activeSessions !== null && activeSessions !== undefined) {
        cards.push({
          label: "Security Sessions",
          value: activeSessions,
          note: "Live admin sessions",
          icon: <Lock className="h-4 w-4" />,
        });
      }
      if (failedLogins !== null && failedLogins !== undefined) {
        cards.push({
          label: "Failed Login Alerts",
          value: failedLogins,
          note: "Current access-log view",
          icon: <AlertCircle className="h-4 w-4" />,
        });
      }
      if (failedAuditCount !== null && failedAuditCount !== undefined) {
        cards.push({
          label: "Audit Exceptions",
          value: failedAuditCount,
          note: "Failed audit events",
          icon: <ShieldCheck className="h-4 w-4" />,
        });
      }
      if (successfulAuditCount !== null && successfulAuditCount !== undefined) {
        cards.push({
          label: "Total Audit Logs",
          value: totalAuditsTracked,
          note: "Tracked compliance outcomes",
          icon: <ArrowLeftRight className="h-4 w-4" />,
        });
      }
      return cards;
    }

    if (primaryRole === ROLES.MANAGER) {
      return [
        {
          label: "Managed Customers",
          value: managedCustomerCount,
          note: "Current managed footprint",
          icon: <Users className="h-4 w-4" />,
        },
        {
          label: "Pending KYC",
          value: pendingKycCount,
          note: "Needs compliance follow-up",
          icon: <AlertCircle className="h-4 w-4" />,
        },
        {
          label: "Managed Accounts",
          value: managedAccountCount,
          note: "Total account records",
          icon: <CreditCard className="h-4 w-4" />,
        },
        {
          label: "Transactions",
          value: managedTransactionCount,
          note: "Operational throughput",
          icon: <ArrowLeftRight className="h-4 w-4" />,
        },
      ];
    }

    if (primaryRole === ROLES.CUSTOMER_MANAGER) {
      return [
        {
          label: "Customer Records",
          value: managedCustomerCount,
          note: "Managed profiles",
          icon: <Users className="h-4 w-4" />,
        },
        {
          label: "Pending KYC",
          value: pendingKycCount,
          note: "Needs resolution",
          icon: <AlertCircle className="h-4 w-4" />,
        },
        {
          label: "Linked Accounts",
          value: managedAccountCount,
          note: "Customer-linked accounts",
          icon: <CreditCard className="h-4 w-4" />,
        },
        {
          label: "UPI Profiles",
          value: managedUpiProfileCount,
          note: "Active payment identities",
          icon: <Smartphone className="h-4 w-4" />,
        },
      ];
    }

    if (primaryRole === ROLES.AUDITOR) {
      return [
        {
          label: "Audit Success",
          value: successfulAuditCount,
          note: "Passing audit events",
          icon: <ShieldCheck className="h-4 w-4" />,
        },
        {
          label: "Audit Failures",
          value: failedAuditCount,
          note: "Events requiring attention",
          icon: <AlertCircle className="h-4 w-4" />,
        },
        {
          label: "Reviewed Logs",
          value: totalAuditsTracked,
          note: "Current fetch scope",
          icon: <ArrowLeftRight className="h-4 w-4" />,
        },
      ];
    }

    return [
      {
        label: "Linked Accounts",
        value: personalAccountCount,
        note: "Personal account count",
        icon: <CreditCard className="h-4 w-4" />,
      },
      {
        label: "Portfolio Balance",
        value: formatCurrency(totalBalance),
        note: "Combined current balance",
        icon: <Building2 className="h-4 w-4" />,
      },
      {
        label: "Transactions",
        value: personalTransactionCount,
        note: "Recorded transaction history",
        icon: <ArrowLeftRight className="h-4 w-4" />,
      },
      {
        label: "UPI Profiles",
        value: personalUpiProfileCount,
        note: "Payment identities",
        icon: <Smartphone className="h-4 w-4" />,
      },
    ];
  }, [
    activeSessions,
    failedAuditCount,
    failedLogins,
    managedAccountCount,
    managedCustomerCount,
    managedTransactionCount,
    managedUpiProfileCount,
    pendingKycCount,
    personalAccountCount,
    personalTransactionCount,
    personalUpiProfileCount,
    primaryRole,
    successfulAuditCount,
    totalAuditsTracked,
    totalBalance,
  ]);

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

  return (
    <PageWrapper>
      <div className="space-y-6">
        <PageHeader
          title="Profile"
          subtitle="Role-based banking profile with identity, scope, and operational data"
          icon={<UserCircle2 className="h-5 w-5" />}
          actions={
            <Button variant="outline" size="sm" onClick={() => void loadProfile()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          }
        />

        {error ? (
          <Alert className="border-destructive/40 bg-destructive/5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <div className="panel-luxe rounded-2xl p-4">
            <TableSkeleton columns={2} rows={5} />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="tabs-luxe grid w-full grid-cols-2 gap-1 sm:grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="identity">Identity & Photo</TabsTrigger>
              <TabsTrigger value="banking">Banking Data</TabsTrigger>
              <TabsTrigger value="role-compliance">Role & Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                <Card className="panel-luxe">
                  <CardHeader>
                    <CardTitle className="text-base">Profile Snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-16 w-16 border border-[var(--glass-border)]">
                        {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={profile?.fullName ?? user?.fullName ?? "User"} /> : null}
                        <AvatarFallback className="text-sm font-semibold">
                          {getInitials(profile?.fullName ?? user?.fullName ?? user?.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-lg font-semibold truncate">{profile?.fullName ?? user?.fullName ?? "-"}</p>
                        <p className="text-xs text-muted-foreground truncate">@{profile?.username ?? user?.username ?? "-"}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="secondary" className="rounded-full">{roleLabel}</Badge>
                          {isAdmin ? (
                            <Badge variant={profile?.isActive && !profile?.isLocked ? "secondary" : "destructive"} className="rounded-full">
                              {profile?.isActive && !profile?.isLocked ? "Active" : "Restricted"}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {profile?.email ?? user?.email ?? "-"}</p>
                      <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {profile?.phoneNumber || "-"}</p>
                      <p className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-muted-foreground" /> Member since: {profile?.createdAt ? formatDateTime(profile.createdAt) : "-"}</p>
                      <p className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-muted-foreground" /> Last login: {profile?.lastLogin ? formatDateTime(profile.lastLogin) : "-"}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="panel-luxe">
                  <CardHeader>
                    <CardTitle className="text-base">Live Signals</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {profileSignals.map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-3 rounded-lg border border-[var(--glass-border)] glass-panel--subtle px-3 py-2 text-sm">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="mt-0.5 text-primary">{item.icon}</span>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.note}</p>
                          </div>
                        </div>
                        <span className="mono font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="identity" className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                <Card className="panel-luxe">
                  <CardHeader>
                    <CardTitle className="text-base">Photo & Identity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Avatar className="h-20 w-20 border border-[var(--glass-border)]">
                        {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={profile?.fullName ?? user?.fullName ?? "User"} /> : null}
                        <AvatarFallback className="text-base font-semibold">
                          {getInitials(profile?.fullName ?? user?.fullName ?? user?.username)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1 space-y-2">
                        <Input
                          placeholder="https://example.com/my-photo.png"
                          value={avatarDraft}
                          onChange={(event) => setAvatarDraft(event.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button type="button" size="sm" onClick={saveAvatarUrl}>Save Photo URL</Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAvatarDraft("");
                              setAvatarUrl(null);
                              toast.success("Profile photo cleared");
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Use an http or https image URL. If unavailable, initials placeholder will be shown.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <p><span className="text-muted-foreground">Full name:</span> {profile?.fullName ?? user?.fullName ?? "-"}</p>
                      <p><span className="text-muted-foreground">Username:</span> {profile?.username ?? user?.username ?? "-"}</p>
                      <p><span className="text-muted-foreground">Email:</span> {profile?.email ?? user?.email ?? "-"}</p>
                      <p><span className="text-muted-foreground">Phone:</span> {profile?.phoneNumber || "-"}</p>
                      {isPrivilegedUser ? (
                        <p><span className="text-muted-foreground">User ID:</span> {profile?.id ?? user?.userId ?? "-"}</p>
                      ) : null}
                      <p><span className="text-muted-foreground">Primary role:</span> {roleLabel}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {effectiveRoles.map((role) => (
                        <Badge key={role} variant="outline" className="rounded-full">
                          {ROLE_LABELS[role] ?? role.replace("ROLE_", "")}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {customerProfile ? (
                  <Card className="panel-luxe">
                    <CardHeader>
                      <CardTitle className="text-base">Customer Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Name:</span> {customerProfile.fullName}</p>
                      <p><span className="text-muted-foreground">Email:</span> {customerProfile.email}</p>
                      <p><span className="text-muted-foreground">Phone:</span> {customerProfile.phoneNumber}</p>
                      <p><span className="text-muted-foreground">KYC:</span> <StatusBadge status={customerProfile.kycStatus} /></p>
                      <p><span className="text-muted-foreground">Customer:</span> <StatusBadge status={customerProfile.customerStatus} /></p>
                      <p><span className="text-muted-foreground">Age:</span> {customerProfile.age ?? "-"}</p>
                      <p><span className="text-muted-foreground">Address:</span> {customerProfile.address || "-"}</p>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </TabsContent>

            <TabsContent value="banking" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="panel-luxe lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Account Portfolio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {accountsView.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No account records found for this profile scope.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-[var(--glass-border)]">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/30 text-left">
                            <tr>
                              <th className="px-3 py-2 font-medium">Account</th>
                              <th className="px-3 py-2 font-medium">Bank</th>
                              <th className="px-3 py-2 font-medium">Balance</th>
                              <th className="px-3 py-2 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {accountsView.slice(0, 10).map((item) => (
                              <tr key={item.accountNumber} className="border-t border-[var(--glass-border)]">
                                <td className="px-3 py-2 mono">{item.accountNumber}</td>
                                <td className="px-3 py-2">{item.bankName}</td>
                                <td className="px-3 py-2">{formatCurrency(Number(item.balance) || 0)}</td>
                                <td className="px-3 py-2"><StatusBadge status={item.status} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="panel-luxe">
                  <CardHeader>
                    <CardTitle className="text-base">UPI Profiles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {upiView.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No UPI profiles available in current scope.</p>
                    ) : (
                      <div className="space-y-2">
                        {upiView.slice(0, 8).map((item) => (
                          <div key={`${item.upiId}-${item.id}`} className="rounded-lg border border-[var(--glass-border)] glass-panel--subtle p-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium">{item.upiId}</p>
                              <StatusBadge status={item.status} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{item.accountHolderName} • {item.bankName}</p>
                            <p className="text-xs text-muted-foreground mt-1">Account: {item.accountNumber}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="panel-luxe">
                <CardHeader>
                  <CardTitle className="text-base">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactionsView.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No transaction history in current scope.</p>
                  ) : (
                    <div className="grid gap-2 md:grid-cols-2">
                      {transactionsView.slice(0, 8).map((item) => (
                        <div key={item.transactionId} className="rounded-lg border border-[var(--glass-border)] glass-panel--subtle p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">Txn #{item.transactionId}</p>
                            <StatusBadge status={item.status} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.senderAccountNumber} → {item.receiverAccountNumber}
                          </p>
                          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                            <span>{item.transactionDate ? formatDateTime(item.transactionDate) : "-"}</span>
                            <span className="font-semibold text-foreground">{formatCurrency(item.amount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="role-compliance" className="space-y-4">
              <Card className="panel-luxe">
                <CardHeader>
                  <CardTitle className="text-base">Role Mandate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{roleScope.title}</p>
                    <p className="mt-2 text-muted-foreground">{roleScope.summary}</p>
                  </div>

                  <ul className="space-y-2">
                    {roleScope.highlights.map((item) => (
                      <li key={item} className="rounded-lg border border-[var(--glass-border)] glass-panel--subtle px-3 py-2">
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {!isRetailUser ? (
                <Card className="panel-luxe">
                  <CardHeader>
                    <CardTitle className="text-base">Operational Context</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 lg:grid-cols-3 text-sm">
                      <div className="rounded-xl border border-[var(--glass-border)] glass-panel--subtle p-3 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Coverage</p>
                        <p><span className="text-muted-foreground">Banks:</span> {managedBankCount}</p>
                        <p><span className="text-muted-foreground">Customers:</span> {managedCustomerCount}</p>
                        <p><span className="text-muted-foreground">Accounts:</span> {managedAccountCount}</p>
                        <p><span className="text-muted-foreground">UPI Profiles:</span> {managedUpiProfileCount}</p>
                      </div>

                      <div className="rounded-xl border border-[var(--glass-border)] glass-panel--subtle p-3 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Risk & Compliance</p>
                        <p><span className="text-muted-foreground">Pending KYC:</span> {pendingKycCount}</p>
                        <p><span className="text-muted-foreground">Audit Success:</span> {successfulAuditCount}</p>
                        <p><span className="text-muted-foreground">Audit Failures:</span> {failedAuditCount}</p>
                        <p><span className="text-muted-foreground">Failed Logins:</span> {failedLogins}</p>
                      </div>

                      <div className="rounded-xl border border-[var(--glass-border)] glass-panel--subtle p-3 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Top Bank Distribution</p>
                        {topBanks.length === 0 ? (
                          <p className="text-muted-foreground">No bank distribution available yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {topBanks.map(([bankName, count]) => (
                              <div key={bankName} className="flex items-center justify-between rounded-lg border border-[var(--glass-border)] glass-panel--subtle px-3 py-2">
                                <span>{bankName}</span>
                                <Badge variant="secondary" className="rounded-full">{count}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="panel-luxe">
                  <CardHeader>
                    <CardTitle className="text-base">Personal Snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <p><span className="text-muted-foreground">Linked Accounts:</span> {accountsView.length}</p>
                    <p><span className="text-muted-foreground">Total Balance:</span> {formatCurrency(totalBalance)}</p>
                    <p><span className="text-muted-foreground">Transactions:</span> {transactionsView.length}</p>
                    <p><span className="text-muted-foreground">UPI Profiles:</span> {upiView.length}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PageWrapper>
  );
}

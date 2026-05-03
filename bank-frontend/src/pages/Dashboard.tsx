import { useEffect, useState } from "react";
import { Building2, Users, CreditCard, ArrowLeftRight, Smartphone, TrendingUp, ShieldCheck, AlertTriangle, RefreshCw, Wallet, Activity, CheckCircle2, Settings2, ArrowUp, ArrowDown, GripVertical, Save, Trash2 } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
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

type StatWidget = {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: JSX.Element;
};

type WidgetPreset = {
  id: "compact" | "executive" | "risk" | "ops";
  label: string;
  description: string;
  order: string[];
  hidden: string[];
};

type SavedWidgetLayout = {
  id: string;
  name: string;
  order: string[];
  hidden: string[];
  updatedAt: string;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [banks, setBanks] = useState<BankResponseDTO[]>([]);
  const [customers, setCustomers] = useState<CustomerResponseDTO[]>([]);
  const [accounts, setAccounts] = useState<AccountResponseDTO[]>([]);
  const [upiProfiles, setUpiProfiles] = useState<UpiProfileResponseDTO[]>([]);
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [widgetSettingsOpen, setWidgetSettingsOpen] = useState(false);
  const [statOrder, setStatOrder] = useState<string[]>([]);
  const [hiddenStats, setHiddenStats] = useState<string[]>([]);
  const [draggingWidgetId, setDraggingWidgetId] = useState<string | null>(null);
  const [savedLayouts, setSavedLayouts] = useState<SavedWidgetLayout[]>([]);
  const [layoutName, setLayoutName] = useState("");

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
  const roleKey = roles.length ? roles.slice().sort().join("_") : "guest";
  const statLayoutStorageKey = `sb.dashboard.stats.layout.${roleKey}.${isCustomer ? "customer" : "ops"}`;
  const savedLayoutsStorageKey = `sb.dashboard.stats.saved.${roleKey}.${isCustomer ? "customer" : "ops"}`;

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

  const allStatWidgets: StatWidget[] = isCustomer
    ? [
        {
          id: "my-accounts",
          title: "My Accounts",
          value: accounts.length,
          icon: <CreditCard className="h-5 w-5" />,
          subtitle: `${activeAccounts} active`,
        },
        {
          id: "my-balance",
          title: "Total Balance",
          value: formatCurrency(totalBalance),
          icon: <Wallet className="h-5 w-5" />,
        },
        {
          id: "my-upi",
          title: "UPI Profiles",
          value: upiProfiles.length,
          icon: <Smartphone className="h-5 w-5" />,
        },
        {
          id: "my-transactions",
          title: "Transactions",
          value: transactions.length,
          icon: <ArrowLeftRight className="h-5 w-5" />,
          subtitle: `${successRate}% success`,
        },
        {
          id: "my-total-sent",
          title: "Total Sent",
          value: formatCurrency(
            transactions
              .filter((t) => (t.transactionType || "TRANSFER") !== "CREDIT")
              .reduce((sum, t) => sum + t.amount, 0),
          ),
          icon: <TrendingUp className="h-5 w-5" />,
        },
        {
          id: "my-total-received",
          title: "Total Received",
          value: formatCurrency(
            transactions
              .filter((t) => (t.transactionType || "TRANSFER") === "CREDIT")
              .reduce((sum, t) => sum + t.amount, 0),
          ),
          icon: <Activity className="h-5 w-5" />,
        },
      ]
    : [
        {
          id: "ops-banks",
          title: "Banks",
          value: banks.length,
          icon: <Building2 className="h-5 w-5" />,
          subtitle: "Registered",
        },
        {
          id: "ops-customers",
          title: "Customers",
          value: customers.length,
          icon: <Users className="h-5 w-5" />,
          subtitle: "Total",
        },
        {
          id: "ops-accounts",
          title: "Accounts",
          value: activeAccounts,
          icon: <CreditCard className="h-5 w-5" />,
          subtitle: "Active",
        },
        {
          id: "ops-balance",
          title: "Total Balance",
          value: formatCurrency(totalBalance),
          icon: <TrendingUp className="h-5 w-5" />,
        },
        {
          id: "ops-transactions",
          title: "Transactions",
          value: transactions.length,
          icon: <ArrowLeftRight className="h-5 w-5" />,
          subtitle: `${successRate}% success`,
        },
        {
          id: "ops-upi",
          title: "UPI Profiles",
          value: upiProfiles.length,
          icon: <Smartphone className="h-5 w-5" />,
          subtitle: "Registered",
        },
      ];

  const defaultOrder = allStatWidgets.map((item) => item.id);

  const widgetPresets: WidgetPreset[] = isCustomer
    ? [
        {
          id: "compact",
          label: "Compact",
          description: "Minimal personal essentials",
          order: ["my-balance", "my-accounts", "my-transactions", "my-upi", "my-total-sent", "my-total-received"],
          hidden: ["my-upi", "my-total-received"],
        },
        {
          id: "executive",
          label: "Executive",
          description: "Net position and cashflow first",
          order: ["my-balance", "my-total-sent", "my-total-received", "my-transactions", "my-accounts", "my-upi"],
          hidden: [],
        },
        {
          id: "risk",
          label: "Risk",
          description: "Payment activity first",
          order: ["my-transactions", "my-upi", "my-accounts", "my-balance", "my-total-sent", "my-total-received"],
          hidden: ["my-total-received"],
        },
        {
          id: "ops",
          label: "Ops",
          description: "Default operational layout",
          order: defaultOrder,
          hidden: [],
        },
      ]
    : [
        {
          id: "compact",
          label: "Compact",
          description: "High-signal minimal overview",
          order: ["ops-balance", "ops-transactions", "ops-accounts", "ops-customers", "ops-upi", "ops-banks"],
          hidden: ["ops-upi", "ops-banks"],
        },
        {
          id: "executive",
          label: "Executive",
          description: "Business KPIs first",
          order: ["ops-balance", "ops-transactions", "ops-customers", "ops-accounts", "ops-upi", "ops-banks"],
          hidden: [],
        },
        {
          id: "risk",
          label: "Risk",
          description: "Exposure and throughput focus",
          order: ["ops-transactions", "ops-accounts", "ops-customers", "ops-upi", "ops-balance", "ops-banks"],
          hidden: ["ops-banks"],
        },
        {
          id: "ops",
          label: "Ops",
          description: "Default operational layout",
          order: defaultOrder,
          hidden: [],
        },
      ];

  useEffect(() => {
    try {
      const raw = localStorage.getItem(statLayoutStorageKey);
      if (!raw) {
        setStatOrder(defaultOrder);
        setHiddenStats([]);
        return;
      }

      const parsed = JSON.parse(raw) as { order?: string[]; hidden?: string[] };
      const parsedOrder = Array.isArray(parsed.order) ? parsed.order : [];
      const parsedHidden = Array.isArray(parsed.hidden) ? parsed.hidden : [];

      const validSet = new Set(defaultOrder);
      const mergedOrder = [...parsedOrder.filter((id) => validSet.has(id)), ...defaultOrder.filter((id) => !parsedOrder.includes(id))];
      const mergedHidden = parsedHidden.filter((id) => validSet.has(id));

      setStatOrder(mergedOrder);
      setHiddenStats(mergedHidden);
    } catch {
      setStatOrder(defaultOrder);
      setHiddenStats([]);
    }
  }, [statLayoutStorageKey, isCustomer]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(savedLayoutsStorageKey);
      if (!raw) {
        setSavedLayouts([]);
        return;
      }

      const parsed = JSON.parse(raw) as SavedWidgetLayout[];
      if (!Array.isArray(parsed)) {
        setSavedLayouts([]);
        return;
      }

      setSavedLayouts(parsed);
    } catch {
      setSavedLayouts([]);
    }
  }, [savedLayoutsStorageKey]);

  useEffect(() => {
    if (!statOrder.length) {
      return;
    }

    localStorage.setItem(
      statLayoutStorageKey,
      JSON.stringify({
        order: statOrder,
        hidden: hiddenStats,
      }),
    );
  }, [statOrder, hiddenStats, statLayoutStorageKey]);

  useEffect(() => {
    localStorage.setItem(savedLayoutsStorageKey, JSON.stringify(savedLayouts));
  }, [savedLayouts, savedLayoutsStorageKey]);

  const statById = new Map(allStatWidgets.map((item) => [item.id, item]));
  const visibleStatWidgets = statOrder
    .map((id) => statById.get(id))
    .filter((item): item is StatWidget => !!item)
    .filter((item) => !hiddenStats.includes(item.id));

  const orderedWidgetMeta = statOrder
    .map((id) => statById.get(id))
    .filter((item): item is StatWidget => !!item);

  const moveStatWidget = (id: string, direction: "up" | "down") => {
    setStatOrder((current) => {
      const index = current.indexOf(id);
      if (index === -1) return current;

      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= current.length) return current;

      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const moveStatWidgetToIndex = (id: string, targetIndex: number) => {
    setStatOrder((current) => {
      const sourceIndex = current.indexOf(id);
      if (sourceIndex === -1 || sourceIndex === targetIndex) {
        return current;
      }

      const safeTargetIndex = Math.max(0, Math.min(targetIndex, current.length - 1));
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(safeTargetIndex, 0, moved);
      return next;
    });
  };

  const toggleWidgetVisibility = (id: string, visible: boolean) => {
    setHiddenStats((current) => {
      if (visible) {
        return current.filter((item) => item !== id);
      }
      if (current.includes(id)) {
        return current;
      }
      return [...current, id];
    });
  };

  const applyPreset = (preset: WidgetPreset) => {
    const validSet = new Set(defaultOrder);
    const mergedOrder = [...preset.order.filter((id) => validSet.has(id)), ...defaultOrder.filter((id) => !preset.order.includes(id))];
    const mergedHidden = preset.hidden.filter((id) => validSet.has(id));
    setStatOrder(mergedOrder);
    setHiddenStats(mergedHidden);
    toast.success(`Applied ${preset.label} layout`);
  };

  const applySavedLayout = (layout: SavedWidgetLayout) => {
    const validSet = new Set(defaultOrder);
    const mergedOrder = [...layout.order.filter((id) => validSet.has(id)), ...defaultOrder.filter((id) => !layout.order.includes(id))];
    const mergedHidden = layout.hidden.filter((id) => validSet.has(id));
    setStatOrder(mergedOrder);
    setHiddenStats(mergedHidden);
    toast.success(`Applied \"${layout.name}\"`);
  };

  const saveCurrentLayout = () => {
    const trimmedName = layoutName.trim();
    if (!trimmedName) {
      toast.error("Enter a layout name");
      return;
    }

    if (savedLayouts.some((layout) => layout.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error("A layout with this name already exists");
      return;
    }

    const next: SavedWidgetLayout = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
      name: trimmedName,
      order: statOrder,
      hidden: hiddenStats,
      updatedAt: new Date().toISOString(),
    };

    setSavedLayouts((current) => [next, ...current].slice(0, 12));
    setLayoutName("");
    toast.success(`Saved layout \"${trimmedName}\"`);
  };

  const deleteSavedLayout = (id: string) => {
    setSavedLayouts((current) => current.filter((layout) => layout.id !== id));
    toast.success("Layout removed");
  };

  const resetWidgetLayout = () => {
    setStatOrder(defaultOrder);
    setHiddenStats([]);
    toast.success("Widget layout reset to default");
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setWidgetSettingsOpen(true)}>
              <Settings2 className="h-4 w-4 mr-2" />
              Customize Widgets
            </Button>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
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
          {visibleStatWidgets.map((widget) => (
            <StatCard
              key={widget.id}
              title={widget.title}
              value={widget.value}
              icon={widget.icon}
              subtitle={widget.subtitle}
            />
          ))}
        </div>
      )}

      <Dialog open={widgetSettingsOpen} onOpenChange={setWidgetSettingsOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-border/70 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Customize Stat Widgets</DialogTitle>
            <DialogDescription>
              Reorder (drag and drop) and toggle visibility. Layout is saved for your current role profile.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Quick Presets</p>
            <div className="grid grid-cols-2 gap-2">
              {widgetPresets.map((preset) => (
                <Button
                  key={preset.id}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => applyPreset(preset)}
                >
                  <span className="truncate">{preset.label}</span>
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isCustomer
                ? "Presets tune personal finance visibility for different workflows."
                : "Presets optimize the operations cockpit for different monitoring styles."}
            </p>
            <div className="mt-3">
              <Button variant="ghost" size="sm" onClick={resetWidgetLayout}>
                Reset to default layout
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Saved Layouts</p>
            <div className="flex gap-2">
              <Input
                value={layoutName}
                onChange={(event) => setLayoutName(event.target.value)}
                placeholder="Layout name"
                className="h-9"
              />
              <Button size="sm" onClick={saveCurrentLayout}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>

            {savedLayouts.length > 0 ? (
              <div className="mt-3 space-y-2 max-h-48 overflow-auto pr-1">
                {savedLayouts.map((layout) => (
                  <div key={layout.id} className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 p-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{layout.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Updated {new Date(layout.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => applySavedLayout(layout)}>
                      Apply
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteSavedLayout(layout.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-3">No saved layouts yet.</p>
            )}
          </div>

          <div className="space-y-3">
            {orderedWidgetMeta.map((widget, index) => {
              const isVisible = !hiddenStats.includes(widget.id);
              const isDragging = draggingWidgetId === widget.id;
              return (
                <div
                  key={widget.id}
                  draggable
                  onDragStart={() => setDraggingWidgetId(widget.id)}
                  onDragEnd={() => setDraggingWidgetId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (!draggingWidgetId || draggingWidgetId === widget.id) {
                      return;
                    }
                    moveStatWidgetToIndex(draggingWidgetId, index);
                    setDraggingWidgetId(null);
                  }}
                  className={`flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-2 transition ${isDragging ? "opacity-60 ring-1 ring-primary/40" : ""}`}
                >
                  <div className="cursor-grab text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{widget.title}</p>
                    <p className="text-xs text-muted-foreground">{widget.id}</p>
                  </div>

                  <Switch
                    checked={isVisible}
                    onCheckedChange={(checked) => toggleWidgetVisibility(widget.id, checked)}
                    aria-label={`Toggle ${widget.title}`}
                  />

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === 0}
                      onClick={() => moveStatWidget(widget.id, "up")}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === orderedWidgetMeta.length - 1}
                      onClick={() => moveStatWidget(widget.id, "down")}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="glass-elevated p-4 xl:col-span-2">
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

        <div className="glass-elevated p-4">
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
        <div className="glass-elevated p-4 mb-6">
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
        <div className="glass-elevated p-5 transition-shadow">
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
                <div className="p-3.5 rounded-xl border border-emerald-300/40 bg-gradient-to-br from-emerald-50/95 to-emerald-100/80 dark:from-emerald-950/45 dark:to-emerald-900/35">
                  <p className="text-xl font-bold text-emerald-600">{customers.filter(c => c.kycStatus === "COMPLETED").length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Verified KYC</p>
                </div>
                <div className="p-3.5 rounded-xl border border-amber-300/40 bg-gradient-to-br from-amber-50/95 to-amber-100/80 dark:from-amber-950/45 dark:to-amber-900/35">
                  <p className="text-xl font-bold text-amber-600">{pendingKyc}</p>
                  <p className="text-xs text-muted-foreground mt-1">Pending Reviews</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="glass-elevated p-5 transition-shadow">
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
                <div className="flex items-start gap-3 rounded-xl border border-amber-300/40 bg-amber-50/90 p-4 dark:border-amber-700/60 dark:bg-amber-950/20">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                      {pendingKyc} Pending KYC Verification{pendingKyc > 1 && "s"}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Action required for customer onboarding</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-300/40 bg-emerald-50/90 p-4 dark:border-emerald-700/60 dark:bg-emerald-950/20">
                  <ShieldCheck className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">All Systems Operational</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">No pending actions required</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 rounded-xl border border-blue-300/40 bg-blue-50/90 p-4 dark:border-blue-700/60 dark:bg-blue-950/20">
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
      <div className="glass-elevated transition-shadow">
        <div className="flex items-center justify-between border-b border-border/70 bg-gradient-to-r from-primary/10 to-transparent p-4">
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
      <div className="glass-elevated mt-5 transition-shadow">
        <div className="flex items-center justify-between border-b border-border/70 bg-gradient-to-r from-primary/10 to-transparent p-4">
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

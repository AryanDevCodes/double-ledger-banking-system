import { useEffect, useState, useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PageWrapper from "@/components/PageWrapper";
import PageHeader from "@/components/PageHeader";
import { accountApi, bankApi } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Wallet,
  RefreshCw,
  Users,
  Landmark,
  ShieldCheck,
  Copy,
  Clock,
  FileText,
  Download,
  Eye,
  EyeOff,
  Plus,
  Search,
  X,
  TrendingUp,
  CreditCard,
  Building2,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PasswordStrength } from "@/components/PasswordStrength";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { AccountResponseDTO, BankResponseDTO } from "@/types/api";
import { toast } from "sonner";
import FuturisticStatsGrid, { type FuturisticStatWidget } from "@/components/dashboard/FuturisticStatsGrid";
import FuturisticChart from "@/components/dashboard/FuturisticChart";
import FuturisticActivityFeed, { type ActivityEvent } from "@/components/dashboard/FuturisticActivityFeed";

const accountSchema = z.object({
  bankName: z.string().min(1, "Please select a bank"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  username: z.string().optional(),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 8, { message: "Password must be at least 8 characters" }),
  age: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 18 && Number(val) <= 120), {
      message: "Age must be between 18 and 120",
    }),
  address: z.string().optional(),
  initialDeposit: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: "Initial deposit must be a positive number",
    }),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

type AccountValues = z.infer<typeof accountSchema>;

const complianceSchema = z.object({
  accountStatus: z.enum(["ACTIVE", "INACTIVE", "CLOSED"]),
  kycStatus: z.enum(["PENDING", "COMPLETED", "FAILED"]),
  customerStatus: z.enum(["ACTIVE", "INACTIVE"]),
});

type ComplianceValues = z.infer<typeof complianceSchema>;

const STEPS = ["bank", "setup", "extra"] as const;
type Step = (typeof STEPS)[number];

// Fields that must be valid before the user can move off a given step.
const STEP_FIELDS: Record<Step, (keyof AccountValues)[]> = {
  bank: ["bankName", "fullName", "email", "phoneNumber", "username"],
  setup: ["password", "initialDeposit"],
  extra: ["age", "address", "termsAccepted"],
};

const generateActivityEvents = (accounts: AccountResponseDTO[]): ActivityEvent[] => {
  return accounts.slice(0, 8).map((a, i) => ({
    id: String(i + 1),
    type: "account" as const,
    title: a.status === "ACTIVE" ? "Account Activated" : a.status === "PENDING" ? "Account Pending" : "Account Updated",
    description: `${a.accountNumber} - ${a.bankName}`,
    timestamp: new Date(Date.now() - i * 600000).toISOString(),
    status: a.status === "ACTIVE" ? "success" as const : a.status === "PENDING" ? "pending" as const : "warning" as const,
    user: a.customerName,
  }));
};

const generateStatusData = (accounts: AccountResponseDTO[]) => {
  const active = accounts.filter(a => a.status === "ACTIVE").length;
  const inactive = accounts.filter(a => a.status === "INACTIVE").length;
  const pending = accounts.filter(a => a.status === "PENDING").length;
  return [
    { name: "Active", value: active },
    { name: "Inactive", value: inactive },
    { name: "Pending", value: pending },
  ];
};

const generateBankData = (accounts: AccountResponseDTO[]) => {
  const bankCounts: Record<string, number> = {};
  accounts.forEach(a => {
    bankCounts[a.bankName] = (bankCounts[a.bankName] || 0) + 1;
  });
  return Object.entries(bankCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountResponseDTO[]>([]);
  const [banks, setBanks] = useState<BankResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [bankFilter, setBankFilter] = useState<string>("all");
  const [openAccountDialog, setOpenAccountDialog] = useState(false);
  const [step, setStep] = useState<Step>("bank");
  const [complianceDialogOpen, setComplianceDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountResponseDTO | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const form = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      bankName: "",
      fullName: "",
      email: "",
      phoneNumber: "",
      username: "",
      password: "",
      age: "",
      address: "",
      initialDeposit: "",
      termsAccepted: false,
    },
    mode: "onChange",
  });

  const complianceForm = useForm<ComplianceValues>({
    resolver: zodResolver(complianceSchema),
    defaultValues: {
      accountStatus: "ACTIVE",
      kycStatus: "PENDING",
      customerStatus: "ACTIVE",
    },
  });

  const passwordValue = form.watch("password") || "";

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsData, banksData] = await Promise.all([
        accountApi.getAll(),
        bankApi.getAll()
      ]);
      setAccounts(accountsData);
      setBanks(banksData);
      setLastUpdated(new Date());
    } catch (error) {
      toast.error("Failed to load data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase();
    return accounts.filter(a => {
      const matchesSearch = !search ||
        a.accountNumber.toLowerCase().includes(searchLower) ||
        a.customerName.toLowerCase().includes(searchLower) ||
        a.bankName.toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      const matchesBank = bankFilter === "all" || a.bankName === bankFilter;
      return matchesSearch && matchesStatus && matchesBank;
    });
  }, [accounts, search, statusFilter, bankFilter]);

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const activeAccounts = accounts.filter((a) => a.status === "ACTIVE").length;
  const pendingKYC = accounts.filter((a) => a.kycStatus === "PENDING").length;
  const avgBalance = accounts.length ? totalBalance / accounts.length : 0;
  const uniqueBanks = Array.from(new Set(accounts.map((a) => a.bankName).filter(Boolean))).sort();

  const activityEvents = useMemo(() => generateActivityEvents(accounts), [accounts]);
  const statusData = useMemo(() => generateStatusData(accounts), [accounts]);
  const bankData = useMemo(() => generateBankData(accounts), [accounts]);

  const widgets: FuturisticStatWidget[] = [
    { id: "total", title: "Total Accounts", value: accounts.length, icon: <CreditCard className="h-5 w-5" />, tint: "cyan", subtitle: `${activeAccounts} active` },
    { id: "balance", title: "Total Balance", value: formatCurrency(totalBalance), icon: <Wallet className="h-5 w-5" />, tint: "emerald" },
    { id: "avg", title: "Average Balance", value: formatCurrency(avgBalance), icon: <TrendingUp className="h-5 w-5" />, tint: "violet" },
    { id: "pending", title: "Pending KYC", value: pendingKYC, icon: <ShieldCheck className="h-5 w-5" />, tint: "amber" },
  ];

  const resetAccountDialog = () => {
    form.reset();
    setStep("bank");
    setShowPassword(false);
  };

  const goToStep = async (target: Step) => {
    const targetIndex = STEPS.indexOf(target);
    const currentIndex = STEPS.indexOf(step);
    // Only validate when moving forward — always allow going back.
    if (targetIndex > currentIndex) {
      const valid = await form.trigger(STEP_FIELDS[step]);
      if (!valid) return;
    }
    setStep(target);
  };

  const handleAdd = async (values: AccountValues) => {
    try {
      const response = await accountApi.create(values.bankName, {
        initialDeposit: values.initialDeposit ? parseFloat(values.initialDeposit) : undefined,
        customer: {
          fullName: values.fullName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          username: values.username || undefined,
          password: values.password || undefined,
          age: values.age ? parseInt(values.age) : undefined,
          address: values.address || undefined,
        }
      });
      resetAccountDialog();
      setOpenAccountDialog(false);

      if (response?.temporaryPassword) {
        toast.success("Account created successfully!", {
          description: `Temporary password: ${response.temporaryPassword}`,
          action: {
            label: "Copy",
            onClick: () => navigator.clipboard.writeText(response.temporaryPassword!),
          },
          duration: 10000,
        });
      } else {
        toast.success("Account created successfully!");
      }
      loadData();
    } catch (error: any) {
      const description = error?.data?.message || error?.data?.error || error?.message || "An unexpected error occurred";
      toast.error("Failed to create account", { description });
      console.error(error);
    }
  };

  const openComplianceEditor = (account: AccountResponseDTO) => {
    setSelectedAccount(account);
    complianceForm.reset({
      accountStatus: (account.status as "ACTIVE" | "INACTIVE" | "CLOSED") || "ACTIVE",
      kycStatus: (account.kycStatus as "PENDING" | "COMPLETED" | "FAILED") || "PENDING",
      customerStatus: (account.customerStatus as "ACTIVE" | "INACTIVE") || "ACTIVE",
    });
    setComplianceDialogOpen(true);
  };

  const handleComplianceUpdate = async (values: ComplianceValues) => {
    if (!selectedAccount) return;
    try {
      await accountApi.updateCompliance(selectedAccount.accountNumber, {
        accountStatus: values.accountStatus,
        kycStatus: values.kycStatus,
        customerStatus: values.customerStatus,
      });
      toast.success("Compliance details updated successfully");
      setComplianceDialogOpen(false);
      setSelectedAccount(null);
      await loadData();
    } catch (error) {
      toast.error("Failed to update compliance details");
      console.error(error);
    }
  };

  const downloadStatement = async (accountNumber: string, format: "csv" | "pdf") => {
    try {
      const loadingToast = toast.loading("Downloading statement...");
      const blob = await accountApi.exportStatement(accountNumber, format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `statement-${accountNumber}-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.dismiss(loadingToast);
      toast.success(`Statement downloaded (${format.toUpperCase()})`);
    } catch (error) {
      toast.error("Failed to download statement");
      console.error(error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setBankFilter("all");
  };

  const hasFilters = search || statusFilter !== "all" || bankFilter !== "all";

  const stepIndex = STEPS.indexOf(step);

  return (
    <PageWrapper>
      <PageHeader
        title="Account Registry"
        subtitle="Manage customer accounts, KYC verification & compliance"
        icon={<Building2 className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {lastUpdated.toLocaleTimeString()}
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <span className="w-2 h-2 bg-emerald-400 rounded-full pulse-live" />
              <span className="text-xs text-emerald-400 font-medium">Live</span>
            </div>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Sync
            </Button>
            <Button
              onClick={() => {
                resetAccountDialog();
                setOpenAccountDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Open Account
            </Button>
          </div>
        }
      />

      <FuturisticStatsGrid widgets={widgets} loading={loading} columnsClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" />

      {/* Different layout: charts + activity feed side by side instead of
          charts spanning the full width with the feed computed but unused. */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FuturisticChart data={statusData} title="Account Status" type="pie" height={240} colors={["#10b981", "#f59e0b", "#f43f5e"]} />
          <FuturisticChart data={bankData} title="Accounts by Bank" type="bar" height={240} colors={["#22d3ee", "#a78bfa", "#10b981", "#f59e0b", "#f43f5e"]} />
        </div>
        <FuturisticActivityFeed events={activityEvents} title="Recent Activity" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-white/5 border-white/10"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={bankFilter} onValueChange={setBankFilter}>
            <SelectTrigger className="w-[160px] bg-white/5 border-white/10"><SelectValue placeholder="Bank" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Banks</SelectItem>
              {uniqueBanks.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="w-4 h-4 mr-1" /> Clear
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{filtered.length} accounts</span>
          {hasFilters && <span className="text-amber-400">(filtered)</span>}
        </div>
      </div>

      {/* Card grid instead of a wide table — no horizontal scroll needed,
          reads better on narrow screens. */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card-futuristic p-4 space-y-3">
              <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
              <div className="h-8 w-full bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card-futuristic p-10 text-center text-muted-foreground">
          {hasFilters ? "No accounts match your filters" : "No accounts yet"}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((account) => (
            <div key={account.accountNumber} className="glass-card-futuristic p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm text-cyan-400 truncate">{account.accountNumber}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => copyToClipboard(account.accountNumber)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="font-medium truncate mt-0.5">{account.customerName}</p>
                </div>
                <Badge variant="outline" className="bg-white/5 shrink-0">{account.bankName}</Badge>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="font-mono font-semibold text-emerald-400 text-lg">
                  {formatCurrency(account.balance)}
                </span>
                <span className="text-xs text-muted-foreground">{account.currencyCode}</span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className={`badge-futuristic ${account.status === "ACTIVE" ? "badge-futuristic--success" : account.status === "PENDING" ? "badge-futuristic--warning" : "badge-futuristic--default"}`}>
                  {account.status}
                </span>
                <span className={`badge-futuristic ${account.kycStatus === "COMPLETED" ? "badge-futuristic--success" : account.kycStatus === "PENDING" ? "badge-futuristic--warning" : "badge-futuristic--danger"}`}>
                  {account.kycStatus || "PENDING"}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 flex-1 border-violet-500/30 text-violet-400 hover:bg-violet-500/20" onClick={() => openComplianceEditor(account)}>
                  <ShieldCheck className="w-3 h-3 mr-1" /> Verify
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <Download className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[180px]">
                    <DropdownMenuItem onClick={() => downloadStatement(account.accountNumber, "csv")}>
                      <FileText className="w-4 h-4 mr-2" /> CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadStatement(account.accountNumber, "pdf")}>
                      <FileText className="w-4 h-4 mr-2" /> PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------------
          OPEN ACCOUNT DIALOG
          ------------------------------------------------------------------
          Height and scroll are set explicitly on this element instead of
          relying on the base Sheet/Dialog component's own CSS. Structure:
            - outer: fixed height (h-[85vh]), flex-col, nothing scrolls here
            - header: shrink-0 (never scrolls, never shrinks)
            - middle: flex-1 + overflow-y-auto  <-- the ONLY scroll region
            - footer: shrink-0 (always visible, no "sticky" hacks needed)
          This guarantees a scrollbar appears whenever content overflows,
          regardless of what ui/dialog.tsx or ui/sheet.tsx do internally. */}
      <Dialog
        open={openAccountDialog}
        onOpenChange={(o) => {
          setOpenAccountDialog(o);
          if (!o) resetAccountDialog();
        }}
      >
        <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="shrink-0 px-6 py-4 border-b border-white/10">
            <DialogTitle className="text-xl">Open New Account</DialogTitle>
            <DialogDescription>Step {stepIndex + 1} of {STEPS.length}</DialogDescription>
          </DialogHeader>

          {/* Step indicator */}
          <div className="shrink-0 px-6 pt-4">
            <Tabs value={step} onValueChange={(v) => goToStep(v as Step)}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="bank">Bank & Customer</TabsTrigger>
                <TabsTrigger value="setup">Account Setup</TabsTrigger>
                <TabsTrigger value="extra">Additional</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAdd)} className="flex flex-col flex-1 min-h-0">
              {/* THE scroll region — everything else in this dialog is fixed */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {step === "bank" && (
                  <>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>Each customer is allowed <strong>one bank account only</strong>. The selected bank is permanent.</AlertDescription>
                    </Alert>

                    <div>
                      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                        <Landmark className="h-4 w-4" /> Bank Information
                      </h3>
                      <FormField control={form.control} name="bankName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a bank..." /></SelectTrigger></FormControl>
                            <SelectContent>
                              {banks.map((b) => (<SelectItem key={b.id} value={b.bankName}><div className="flex items-center gap-2"><span>{b.bankName}</span><Badge variant="outline" className="text-xs">{b.branch}</Badge></div></SelectItem>))}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">Permanent — cannot change later.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4" /> Customer Information
                      </h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>Full Name *</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="phoneNumber" render={({ field }) => (<FormItem><FormLabel>Phone Number *</FormLabel><FormControl><Input placeholder="+1 (555) 000-0000" type="tel" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email Address *</FormLabel><FormControl><Input placeholder="john@example.com" type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="username" render={({ field }) => (<FormItem><FormLabel>Username</FormLabel><FormControl><Input placeholder="Leave empty to use email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {step === "setup" && (
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <ShieldCheck className="h-4 w-4" /> Account Setup
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" {...field} />
                              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </FormControl>
                          <PasswordStrength password={passwordValue} />
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="initialDeposit" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Initial Deposit</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                              <Input type="number" className="pl-7" placeholder="0.00" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                )}

                {step === "extra" && (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                        <Info className="h-4 w-4" /> Additional Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="age" render={({ field }) => (<FormItem><FormLabel>Age</FormLabel><FormControl><Input type="number" min="18" max="120" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="123 Main St, City" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                    </div>

                    <Separator />

                    <FormField control={form.control} name="termsAccepted" render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          <FormLabel className="!mt-0">I accept the terms and conditions</FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </>
                )}
              </div>

              {/* Footer is a normal shrink-0 flex item now — no `sticky`
                  needed, and it can never be scrolled out of view. */}
              <DialogFooter className="shrink-0 px-6 py-4 border-t border-white/10 flex-row items-center justify-between sm:justify-between">
                <div>
                  {stepIndex > 0 && (
                    <Button type="button" variant="ghost" onClick={() => goToStep(STEPS[stepIndex - 1])}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpenAccountDialog(false)}>Cancel</Button>
                  {stepIndex < STEPS.length - 1 ? (
                    <Button type="button" onClick={() => goToStep(STEPS[stepIndex + 1])}>
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isValid}>
                      {form.formState.isSubmitting ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Creating...</> : <><Plus className="h-4 w-4 mr-2" />Create Account</>}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={complianceDialogOpen} onOpenChange={setComplianceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Compliance</DialogTitle>
            <DialogDescription>Update account status and KYC verification for {selectedAccount?.accountNumber}</DialogDescription>
          </DialogHeader>
          <Form {...complianceForm}>
            <form onSubmit={complianceForm.handleSubmit(handleComplianceUpdate)} className="space-y-4">
              <FormField control={complianceForm.control} name="accountStatus" render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={complianceForm.control} name="kycStatus" render={({ field }) => (
                <FormItem>
                  <FormLabel>KYC Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={complianceForm.control} name="customerStatus" render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setComplianceDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
import { useEffect, useState, useMemo } from "react";
import { 
  Building2, 
  Users, 
  CreditCard, 
  ArrowLeftRight, 
  Smartphone, 
  TrendingUp, 
  ShieldCheck, 
  RefreshCw, 
  Wallet, 
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  QrCode,
  PlusCircle,
  Search,
  Filter,
  X,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Shield,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Download,
  Copy,
  Eye,
  EyeOff
} from "lucide-react";
import PageWrapper from "@/components/PageWrapper";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PasswordStrength } from "@/components/PasswordStrength";
import { toast } from "sonner";
import { accountApi, bankApi } from "@/lib/api-client";
import FuturisticStatsGrid, { type FuturisticStatWidget } from "@/components/dashboard/FuturisticStatsGrid";
import FuturisticChart from "@/components/dashboard/FuturisticChart";
import FuturisticActivityFeed, { type ActivityEvent } from "@/components/dashboard/FuturisticActivityFeed";
import FuturisticQuickActions from "@/components/dashboard/FuturisticQuickActions";
import type { BankResponseDTO } from "@/types/api";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getApiErrorMessage } from "@/lib/api-client";

const accountSchema = z.object({
  bankName: z.string().min(1, "Please select a bank"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  username: z.string().optional(),
  password: z.string().optional().refine((val) => !val || val.length >= 8, { message: "Password must be at least 8 characters" }),
  age: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 18 && Number(val) <= 120), { message: "Age must be between 18 and 120" }),
  address: z.string().optional(),
  initialDeposit: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), { message: "Initial deposit must be a positive number" }),
  termsAccepted: z.boolean().refine((val) => val === true, { message: "You must accept the terms and conditions" }),
});

type AccountValues = z.infer<typeof accountSchema>;

const generateActivityEvents = (transactions: any[], accounts: any[]): ActivityEvent[] => {
  const myAccountNumbers = new Set(accounts.map((a) => a.accountNumber));
  
  return transactions.slice(0, 8).map((t, i) => {
    const isSent = t.senderAccountNumber && myAccountNumbers.has(t.senderAccountNumber);
    return {
      id: String(i + 1),
      type: "transaction" as const,
      title: isSent ? "Money Sent" : "Money Received",
      description: t.description || `Transaction #${t.transactionId}`,
      timestamp: t.transactionDate || new Date(Date.now() - i * 600000).toISOString(),
      status: (t.status === "COMPLETED" || t.status === "SUCCESS") ? "success" as const : "pending" as const,
      amount: formatCurrency(t.amount),
      user: isSent ? t.receiverName : t.senderName,
    };
  });
};

const generateSpendingData = (transactions: any[], accountNumbers: Set<string>) => {
  const monthlyData: Record<string, number> = {};
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString('default', { month: 'short' });
    monthlyData[key] = 0;
  }
  
  transactions.forEach(t => {
    if (t.senderAccountNumber && accountNumbers.has(t.senderAccountNumber) && t.transactionDate) {
      const d = new Date(t.transactionDate);
      const key = d.toLocaleString('default', { month: 'short' });
      if (monthlyData[key] !== undefined) {
        monthlyData[key] += t.amount || 0;
      }
    }
  });
  
  return Object.entries(monthlyData).map(([name, value]) => ({ name, value: Math.round(value) }));
};

const generateCategoryData = () => [
  { name: "Shopping", value: 35 },
  { name: "Food", value: 25 },
  { name: "Transfer", value: 20 },
  { name: "Bills", value: 15 },
  { name: "Other", value: 5 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { accounts, upiProfiles, transactions, loading, reload, lastUpdated } = useDashboardData("self", {
    banks: false,
    customers: false,
    realtime: 30000,
  });

  const [banks, setBanks] = useState<BankResponseDTO[]>([]);
  const [openAccountSheet, setOpenAccountSheet] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const passwordValue = form.watch("password") || "";

  useEffect(() => {
    bankApi.getAll().then(setBanks).catch(console.error);
  }, []);

  const myAccountNumbers = new Set(accounts.map((a) => a.accountNumber));
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const totalBalance = round2(accounts.reduce((s, a) => s + (a.balance || 0), 0));
  const activeAccounts = accounts.filter((a) => a.status === "ACTIVE").length;

  const sent = round2(
    transactions
      .filter((t) => t.senderAccountNumber && myAccountNumbers.has(t.senderAccountNumber))
      .reduce((sum, t) => sum + (t.amount || 0), 0)
  );
  const received = round2(
    transactions
      .filter((t) => t.receiverAccountNumber && myAccountNumbers.has(t.receiverAccountNumber))
      .reduce((sum, t) => sum + (t.amount || 0), 0)
  );

  const successRate = transactions.length
    ? Math.round(
        (transactions.filter((t) => t.status === "COMPLETED" || t.status === "SUCCESS").length /
          transactions.length) *
          100,
      )
    : 0;

  const activityEvents = useMemo(() => generateActivityEvents(transactions, accounts), [transactions, accounts]);
  const spendingData = useMemo(() => generateSpendingData(transactions, myAccountNumbers), [transactions, myAccountNumbers]);
  const categoryData = useMemo(() => generateCategoryData(), []);

  const widgets: FuturisticStatWidget[] = [
    { id: "balance", title: "Total Balance", value: formatCurrency(totalBalance), icon: <Wallet className="h-5 w-5" />, tint: "emerald", subtitle: "Available" },
    { id: "accounts", title: "My Accounts", value: accounts.length, icon: <CreditCard className="h-5 w-5" />, subtitle: `${activeAccounts} active`, tint: "violet" },
    { id: "upi", title: "UPI Profiles", value: upiProfiles.length, icon: <Smartphone className="h-5 w-5" />, tint: "cyan" },
    { id: "txns", title: "Transactions", value: transactions.length, icon: <ArrowLeftRight className="h-5 w-5" />, subtitle: `${successRate}% success`, tint: "amber" },
    { id: "sent", title: "Total Sent", value: formatCurrency(sent), icon: <ArrowUpRight className="h-5 w-5" />, tint: "rose", subtitle: "This month" },
    { id: "received", title: "Total Received", value: formatCurrency(received), icon: <ArrowDownLeft className="h-5 w-5" />, tint: "emerald", subtitle: "This month" },
  ];

  const displayName = user?.fullName?.split(" ")[0] || user?.username || "there";

  const handleAddAccount = async (values: AccountValues) => {
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
      form.reset();
      setOpenAccountSheet(false);
      
      if (response?.temporaryPassword) {
        toast.success("Account created successfully!", {
          description: `Temporary password: ${response.temporaryPassword}`,
          action: { label: "Copy", onClick: () => navigator.clipboard.writeText(response.temporaryPassword!) },
          duration: 10000,
        });
      } else {
        toast.success("Account created successfully!");
      }
      reload();
    } catch (error: any) {
      toast.error("Failed to create account", { description: getApiErrorMessage(error, "An error occurred") });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <PageWrapper>
      <PageHeader
        title={`Welcome back, ${displayName}`}
        subtitle="Your personal finance command center"
        icon={<Wallet className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {lastUpdated.toLocaleTimeString()}
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">Secure Session</span>
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
            data={spendingData} 
            title="Spending Overview (6 Months)" 
            type="area" 
            height={320}
            colors={["#10b981", "#22d3ee"]}
          />
        </div>
        <FuturisticChart 
          data={categoryData} 
          title="Spending by Category" 
          type="pie" 
          height={320}
          colors={["#f43f5e", "#f59e0b", "#22d3ee", "#10b981", "#a78bfa"]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <FuturisticActivityFeed 
          events={activityEvents} 
          title="Recent Transactions"
          maxEvents={6}
        />
        
        <div className="lg:col-span-2">
          <FuturisticQuickActions
            title="Quick Actions"
            actions={[
              { to: "/send-money", label: "Send Money", icon: Send, description: "Bank transfer" },
              { to: "/upi-pay", label: "UPI Pay", icon: Smartphone, description: "Pay via UPI ID" },
              { to: "/my-transactions", label: "Transactions", icon: ArrowLeftRight, description: "History & receipts" },
              { to: "/upi-pay", label: "My QR Code", icon: QrCode, description: "Receive payments" },
              { to: "/upi-pay", label: "Add UPI", icon: PlusCircle, description: "Link new UPI" },
              { to: "/accounts", label: "My Accounts", icon: CreditCard, description: "Balance & details" },
            ]}
            columns={3}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="glass-card-futuristic p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Account Summary
          </h3>
          <div className="space-y-4">
            {accounts.slice(0, 3).map((acc, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/20">
                    <CreditCard className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{acc.bankName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{acc.accountNumber?.slice(-4)}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-400">{formatCurrency(acc.balance)}</span>
              </div>
            ))}
            {accounts.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">No accounts yet</p>
                <Button size="sm" onClick={() => setOpenAccountSheet(true)}>
                  <PlusCircle className="w-4 h-4 mr-2" /> Open Account
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="glass-card-futuristic p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            UPI Profiles
          </h3>
          <div className="space-y-3">
            {upiProfiles.slice(0, 4).map((upi, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{upi.upiId}</p>
                    <p className="text-xs text-muted-foreground">{upi.bankName}</p>
                  </div>
                </div>
                <span className="badge-futuristic badge-futuristic--success">Active</span>
              </div>
            ))}
            {upiProfiles.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No UPI profiles</p>
            )}
          </div>
        </div>

        <div className="glass-card-futuristic p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            This Month
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Spent</span>
              <span className="text-lg font-bold text-rose-400">{formatCurrency(sent)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Received</span>
              <span className="text-lg font-bold text-emerald-400">{formatCurrency(received)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Net Flow</span>
              <span className={`text-lg font-bold ${received - sent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {received - sent >= 0 ? "+" : ""}{formatCurrency(received - sent)}
              </span>
            </div>
            <div className="pt-4 border-t border-white/10">
              <div className="progress-futuristic">
                <div className="progress-futuristic-bar" style={{ width: "65%" }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">65% of monthly budget used</p>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={openAccountSheet} onOpenChange={setOpenAccountSheet}>
        <SheetTrigger asChild />
        <SheetContent side="right" className="w-full sm:w-[600px] lg:w-[700px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl">Open New Account</SheetTitle>
            <SheetDescription>Create a new bank account</SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddAccount)} className="space-y-6">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5" /> Bank Information</CardTitle></CardHeader>
                <CardContent>
                  <FormField control={form.control} name="bankName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a bank..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          {banks.map((b) => (<SelectItem key={b.id} value={b.bankName}>{b.bankName}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <FormField control={form.control} name="termsAccepted" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="!mt-0">I accept the terms and conditions</FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
              <Separator />
              <div className="flex gap-3 justify-end sticky bottom-0 bg-background pt-4 pb-2">
                <Button type="button" variant="outline" onClick={() => setOpenAccountSheet(false)}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isValid}>
                  {form.formState.isSubmitting ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Creating...</> : <><PlusCircle className="h-4 w-4 mr-2" />Create Account</>}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </PageWrapper>
  );
}

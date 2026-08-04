import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, History, Smartphone, CreditCard, ArrowUpRight, ArrowDownLeft, ArrowRight, RefreshCcw, Wallet, TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react";
import PageWrapper from "@/components/PageWrapper";
import PageHeader from "@/components/PageHeader";
import ExportMenu from "@/components/ExportMenu";
import StatCard from "@/components/StatCard";
import DataTableToolbar from "@/components/DataTableToolbar";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import TransactionReceipt from "@/components/TransactionReceipt";
import { accountApi, transactionApi, upiApi, compositeApi, ApiError } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/api-client";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/rbac";
import type { AccountResponseDTO, TransactionResponseDTO, UpiProfileResponseDTO, Status } from "@/types/api";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { TableSkeleton } from "@/components/LoadingStates";

const upiPaymentSchema = z.object({
  fromUpi: z.string().min(1, "Select a sender UPI"),
  toUpi: z.string().min(3, "Enter a valid receiver UPI"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((value) => !isNaN(Number(value)) && Number(value) > 0, "Amount must be greater than 0"),
});

const bankTransferSchema = z.object({
  senderAccount: z.string().min(1, "Select sender account"),
  receiverAccount: z.string().min(1, "Select receiver account"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((value) => !isNaN(Number(value)) && Number(value) > 0, "Amount must be greater than 0"),
}).refine((data) => data.senderAccount !== data.receiverAccount, {
  message: "Sender and receiver cannot be the same",
  path: ["receiverAccount"],
});

const upiRegistrationSchema = z.object({
  upiId: z.string().min(3, "UPI ID is required"),
  accountNumber: z.string().min(1, "Select an account"),
});

type UpiPaymentValues = z.infer<typeof upiPaymentSchema>;
type BankTransferValues = z.infer<typeof bankTransferSchema>;
type UpiRegistrationValues = z.infer<typeof upiRegistrationSchema>;

type PaymentTransaction = TransactionResponseDTO & {
  transactionType?: string;
  timestamp?: string;
  id?: string | number;
  fromAccountNumber?: string;
  toAccountNumber?: string;
};

type Direction = "DEBIT" | "CREDIT" | "TRANSFER";

const KNOWN_STATUSES: Status[] = [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "ACTIVE",
  "INACTIVE",
  "CLOSED",
  "INITIATED",
  "PROCESSING",
  "SUCCESS",
  "REVERSED",
];

export default function PaymentsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AccountResponseDTO[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [upiProfiles, setUpiProfiles] = useState<UpiProfileResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilters, setHistoryFilters] = useState<Record<string, string | Date | undefined>>({
    status: undefined,
    type: undefined,
    date: undefined,
  });
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionResponseDTO | null>(null);
  const [receiptBalances, setReceiptBalances] = useState<{ sender?: number; receiver?: number }>({});

  const upiPaymentForm = useForm<UpiPaymentValues>({
    resolver: zodResolver(upiPaymentSchema),
    defaultValues: { fromUpi: "", toUpi: "", amount: "" },
  });

  const upiRegistrationForm = useForm<UpiRegistrationValues>({
    resolver: zodResolver(upiRegistrationSchema),
    defaultValues: { upiId: "", accountNumber: "" },
  });

  const bankTransferForm = useForm<BankTransferValues>({
    resolver: zodResolver(bankTransferSchema),
    defaultValues: { senderAccount: "", receiverAccount: "", amount: "" },
  });

  const getErrorMessage = (error: unknown, fallback: string) => {
    return getApiErrorMessage(error, fallback);
  };

  const roles = user?.roles || [];
  const staffRoleSet = new Set<string>([ROLES.ADMIN, ROLES.MANAGER, ROLES.CUSTOMER_MANAGER, ROLES.AUDITOR]);
  const isCustomerOnly = roles.includes(ROLES.USER) && !roles.some((role) => staffRoleSet.has(role));
  const canInitiatePayments = isCustomerOnly;

  useEffect(() => {
    loadData();
  }, []);

  const buildIdempotencyKey = (fromUpi: string) => {
    const userPrefix = (user?.username || user?.email || "user")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 4)
      .padEnd(4, "X")
      .toUpperCase();

    const bankName =
      upiProfiles.find((profile) => profile.upiId === fromUpi)?.bankName || "BANK";
    const bankPart = bankName
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 10)
      .toUpperCase();

    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const randomPart = Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");

    return `${userPrefix}${bankPart}${datePart}${randomPart}`;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (isCustomerOnly) {
        const overview = await compositeApi.getMyOverview();
        setAccounts(overview.accounts);
        setUpiProfiles(overview.upiProfiles);
        setTransactions(overview.recentTransactions as PaymentTransaction[]);
      } else {
        // Load all data for staff
        const [accountsData, upiData, transactionsData] = await Promise.all([
          accountApi.getAll(),
          upiApi.getAll(),
          transactionApi.getAll(),
        ]);
        setAccounts(accountsData);
        setUpiProfiles(upiData);
        setTransactions(transactionsData);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load payment data"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpiPayment = async (values: UpiPaymentValues) => {
    if (!canInitiatePayments) {
      toast.error("Payment initiation is restricted to customer accounts only");
      return;
    }
    try {
      setLoading(true);
      const idempotencyKey = values.fromUpi ? buildIdempotencyKey(values.fromUpi) : undefined;
      await upiApi.pay({
        fromUpi: values.fromUpi,
        toUpi: values.toUpi,
        amount: parseFloat(values.amount),
        idempotencyKey,
      });
      toast.success("UPI payment successful!");
      upiPaymentForm.reset();
      loadData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Payment failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleBankTransfer = async (values: BankTransferValues) => {
    if (!canInitiatePayments) {
      toast.error("Payment initiation is restricted to customer accounts only");
      return;
    }
    try {
      setLoading(true);
      const receipt = await compositeApi.comprehensiveTransfer({
        senderAccount: values.senderAccount,
        receiverAccount: values.receiverAccount,
        amount: parseFloat(values.amount),
      });
      setSelectedTransaction(receipt.transaction);
      setReceiptBalances({ sender: receipt.senderNewBalance, receiver: receipt.receiverNewBalance });
      setReceiptOpen(true);
      bankTransferForm.reset();
      loadData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Transfer failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpiRegistration = async (values: UpiRegistrationValues) => {
    if (!canInitiatePayments) {
      toast.error("UPI registration is restricted to customer accounts only");
      return;
    }
    const countForAccount = upiProfiles.filter((p) => p.accountNumber === values.accountNumber).length;
    if (countForAccount >= 4) {
      toast.error("UPI limit reached for this account (max 4)");
      return;
    }

    try {
      setLoading(true);
      await upiApi.register({
        upiId: values.upiId,
        accountNumber: values.accountNumber,
      });
      toast.success("UPI ID registered");
      upiRegistrationForm.reset();
      loadData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to register UPI ID"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpiStatusToggle = async (upiId: string, currentStatus: string) => {
    if (!canInitiatePayments) {
      toast.error("UPI status changes are restricted to customer accounts only");
      return;
    }
    try {
      setLoading(true);
      const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await upiApi.updateStatus(upiId, nextStatus);
      toast.success("UPI status updated");
      loadData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to update status"));
    } finally {
      setLoading(false);
    }
  };

  const upiByAccount = new Map<string, string[]>();
  upiProfiles.forEach((profile) => {
    if (!upiByAccount.has(profile.accountNumber)) {
      upiByAccount.set(profile.accountNumber, []);
    }
    upiByAccount.get(profile.accountNumber)?.push(profile.upiId);
  });

  const activeUpiProfiles = upiProfiles.filter((p) => p.status === "ACTIVE");

  const ownAccountNumberSet = isCustomerOnly ? new Set(accounts.map((acc) => acc.accountNumber)) : new Set<string>();

  const normalizeDirection = (value?: string): Direction | null => {
    const upper = (value || "").trim().toUpperCase();
    if (upper === "DEBIT" || upper === "CREDIT" || upper === "TRANSFER") {
      return upper;
    }
    return null;
  };

  const normalizeStatus = (value?: string): Status => {
    const upper = (value || "").trim().toUpperCase() as Status;
    return KNOWN_STATUSES.includes(upper) ? upper : "PENDING";
  };

  const resolveDirection = (txn: PaymentTransaction): Direction => {
    const fromType = normalizeDirection(txn.transactionType);
    if (fromType) return fromType;

    const sender = txn.senderAccountNumber || txn.fromAccountNumber;
    const receiver = txn.receiverAccountNumber || txn.toAccountNumber;

    if (ownAccountNumberSet.size > 0) {
      if (sender && ownAccountNumberSet.has(sender)) return "DEBIT";
      if (receiver && ownAccountNumberSet.has(receiver)) return "CREDIT";
    }

    return "TRANSFER";
  };

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

  const historySearchTerm = historySearch.trim().toLowerCase();
  const filteredHistory = transactions.filter((txn) => {
    const dateValue = txn.transactionDate || txn.timestamp;
    const type = resolveDirection(txn);
    const fromAccount = txn.senderAccountNumber || txn.fromAccountNumber || "-";
    const toAccount = txn.receiverAccountNumber || txn.toAccountNumber || "-";
    const filterDate = historyFilters.date as Date | undefined;

    const matchesSearch =
      !historySearchTerm ||
      txn.senderName?.toLowerCase().includes(historySearchTerm) ||
      txn.receiverName?.toLowerCase().includes(historySearchTerm) ||
      fromAccount.toLowerCase().includes(historySearchTerm) ||
      toAccount.toLowerCase().includes(historySearchTerm) ||
      String(txn.transactionId || txn.id).includes(historySearchTerm) ||
      (upiByAccount.get(fromAccount)?.[0] || "").toLowerCase().includes(historySearchTerm) ||
      (upiByAccount.get(toAccount)?.[0] || "").toLowerCase().includes(historySearchTerm);

    const matchesStatus = !historyFilters.status || txn.status === historyFilters.status;
    const matchesType = !historyFilters.type || type === historyFilters.type;
    const matchesDate = !filterDate
      ? true
      : dateValue
        ? new Date(dateValue).toDateString() === filterDate.toDateString()
        : false;

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const totalSent = transactions
    .filter((t) => resolveDirection(t) === "DEBIT")
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalReceived = transactions
    .filter((t) => resolveDirection(t) === "CREDIT")
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const successCount = transactions.filter((t) => {
    const s = normalizeStatus(t.status);
    return s === "SUCCESS" || s === "COMPLETED";
  }).length;
  const successRate = transactions.length ? Math.round((successCount / transactions.length) * 100) : 0;

  const handleExportHistory = (format: "csv" | "excel" | "pdf") => {
    try {
      const exportData = filteredHistory.map((txn) => {
        const dateValue = txn.transactionDate || txn.timestamp;
        const type = resolveDirection(txn);
        const fromAccount = txn.senderAccountNumber || txn.fromAccountNumber || "-";
        const toAccount = txn.receiverAccountNumber || txn.toAccountNumber || "-";
        return {
          "Transaction ID": `TXN_${txn.transactionId || txn.id}`,
          Type: type,
          From: txn.senderName || "Unknown",
          "From Account": fromAccount,
          To: txn.receiverName || "Unknown",
          "To Account": toAccount,
          Amount: txn.amount,
          Status: normalizeStatus(txn.status),
          Date: dateValue ? formatDateTime(dateValue) : "-",
        };
      });

      if (format === "csv") {
        exportToCSV(exportData, `payment-history-${new Date().toISOString().split("T")[0]}.csv`);
      } else if (format === "excel") {
        exportToExcel(exportData, `payment-history-${new Date().toISOString().split("T")[0]}.xlsx`, "Payments");
      } else {
        exportToPDF(exportData, "Payments History");
      }
      toast.success(`Exported ${filteredHistory.length} transactions`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to export history"));
      console.error(error);
    }
  };

  return (
    <>
    <PageWrapper>
      <PageHeader
        title="Payments & Transfers"
        subtitle={canInitiatePayments ? "Send money via UPI or bank transfer" : "View payment history and account activity"}
        icon={<Send className="h-5 w-5" />}
        actions={
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="module-hero module-hero--payments mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Payment Console</p>
            <p className="text-sm text-foreground/90 mt-1">Unified rails for UPI and bank transfers with transparent outcomes and instant controls.</p>
          </div>
          <Badge variant="secondary" className="rounded-full">Instant + Account Transfer</Badge>
        </div>
      </div>

      <Tabs defaultValue="pay" className="space-y-6">
        <TabsList className="tabs-luxe grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="pay">
            <Send className="h-4 w-4 mr-2" />
            Send Money
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="upi">
            <Smartphone className="h-4 w-4 mr-2" />
            My UPI
          </TabsTrigger>
        </TabsList>

        {/* Send Money Tab */}
        <TabsContent value="pay" className="space-y-6">
          {!canInitiatePayments && (
            <Card className="panel-luxe">
              <CardHeader>
                <CardTitle>Payment initiation restricted</CardTitle>
                <CardDescription>
                  Authorities can review payment history and monitoring data, but cannot initiate UPI or bank transfers from user accounts.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              title="Total Sent"
              value={formatCurrency(totalSent)}
              subtitle="All time"
              icon={<TrendingDown className="h-5 w-5" />}
            />
            <StatCard
              title="Total Received"
              value={formatCurrency(totalReceived)}
              subtitle="All time"
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              title="Success Rate"
              value={`${successRate}%`}
              subtitle={`${successCount} successful`}
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
            <StatCard
              title="Wallet Balance"
              value={formatCurrency(accounts.reduce((sum, acc) => sum + acc.balance, 0))}
              subtitle={`${accounts.length} accounts`}
              icon={<Wallet className="h-5 w-5" />}
            />
          </div>
          {canInitiatePayments && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* UPI Payment */}
            <Card className="panel-luxe shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-teal-500" />
                  UPI Payment
                </CardTitle>
                <CardDescription>Send money using UPI ID</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...upiPaymentForm}>
                  <form onSubmit={upiPaymentForm.handleSubmit(handleUpiPayment)} className="space-y-4">
                    <FormField
                      control={upiPaymentForm.control}
                      name="fromUpi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From UPI ID</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your UPI" />
                              </SelectTrigger>
                              <SelectContent>
                                {activeUpiProfiles.map((upi) => (
                                  <SelectItem key={upi.upiId} value={upi.upiId}>
                                    {upi.upiId}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={upiPaymentForm.control}
                      name="toUpi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To UPI ID</FormLabel>
                          <FormControl>
                            <Input placeholder="receiver@upi" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={upiPaymentForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="1" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={loading || activeUpiProfiles.length === 0 || !upiPaymentForm.watch("fromUpi") }>
                      <Send className="h-4 w-4 mr-2" />
                      Send via UPI
                    </Button>

                    {upiProfiles.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center">
                        No UPI profiles found. Register one in the UPI tab.
                      </p>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Bank Transfer */}
            <Card className="panel-luxe shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                  Bank Transfer
                </CardTitle>
                <CardDescription>Transfer between accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...bankTransferForm}>
                  <form onSubmit={bankTransferForm.handleSubmit(handleBankTransfer)} className="space-y-4">
                    <FormField
                      control={bankTransferForm.control}
                      name="senderAccount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Account</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select account" />
                              </SelectTrigger>
                              <SelectContent>
                                {accounts.map((acc) => (
                                  <SelectItem key={acc.accountNumber} value={acc.accountNumber}>
                                    {acc.accountNumber} - {formatCurrency(acc.balance)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={bankTransferForm.control}
                      name="receiverAccount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To Account Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Account number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={bankTransferForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="1" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={loading || accounts.length === 0}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Transfer Funds
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Quick Balance Overview */}
          <Card className="panel-luxe">
            <CardHeader>
              <CardTitle>Your Accounts</CardTitle>
              <CardDescription>Quick balance overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {accounts.map((acc) => (
                  <div key={acc.accountNumber} className="rounded-xl border border-border/70 bg-muted/25 p-4">
                    <div className="text-sm text-muted-foreground">{acc.accountNumber}</div>
                    <div className="text-2xl font-bold">{formatCurrency(acc.balance)}</div>
                    <Badge variant={acc.status === "ACTIVE" ? "default" : "secondary"}>
                      {acc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card className="panel-luxe">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Transaction History
                </CardTitle>
                <CardDescription>UPI payments and bank transfers</CardDescription>
              </div>
              <ExportMenu
                onExport={handleExportHistory}
                disabled={loading || filteredHistory.length === 0}
              />
            </CardHeader>
            <CardContent>
              <div className="pb-4">
                <DataTableToolbar
                  searchPlaceholder="Search by name, account, UPI, or ID..."
                  searchValue={historySearch}
                  onSearchChange={setHistorySearch}
                  filters={[
                    {
                      key: "status",
                      label: "Status",
                      type: "select",
                      options: Array.from(
                        new Set(transactions.map((t) => normalizeStatus(t.status)).filter(Boolean))
                      ).map((v) => ({
                        label: v,
                        value: v,
                      })),
                    },
                    {
                      key: "type",
                      label: "Type",
                      type: "select",
                      options: [
                        { label: "Debit", value: "DEBIT" },
                        { label: "Credit", value: "CREDIT" },
                        { label: "Transfer", value: "TRANSFER" },
                      ],
                    },
                    { key: "date", label: "Date", type: "date" },
                  ]}
                  activeFilters={historyFilters}
                  onFilterChange={(key, value) => setHistoryFilters((prev) => ({ ...prev, [key]: value }))}
                  onClearFilters={() => setHistoryFilters({ status: undefined, type: undefined, date: undefined })}
                />
              </div>

              {loading ? (
                <TableSkeleton columns={6} rows={6} className="p-2" />
              ) : filteredHistory.length === 0 ? (
                <EmptyState type={historySearch ? "search" : "transactions"} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((txn) => {
                      const dateValue = txn.transactionDate || txn.timestamp;
                      const type = resolveDirection(txn);
                      const fromAccount = txn.senderAccountNumber || txn.fromAccountNumber || "-";
                      const toAccount = txn.receiverAccountNumber || txn.toAccountNumber || "-";
                      const status = normalizeStatus(txn.status);

                      return (
                        <TableRow key={txn.transactionId || txn.id} className="hover:bg-muted/35 transition-colors">
                          <TableCell>{dateValue ? formatDateTime(dateValue) : "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {type === "CREDIT" ? (
                                <ArrowDownLeft className="h-4 w-4 text-green-500" />
                              ) : type === "DEBIT" ? (
                                <ArrowUpRight className="h-4 w-4 text-red-500" />
                              ) : (
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              {type}
                            </div>
                          </TableCell>
                          <TableCell>{formatParty(txn.senderName, fromAccount)}</TableCell>
                          <TableCell>{formatParty(txn.receiverName, toAccount)}</TableCell>
                          <TableCell
                            className={
                              type === "CREDIT"
                                ? "font-semibold text-emerald-600 dark:text-emerald-400"
                                : type === "DEBIT"
                                  ? "font-semibold text-rose-600 dark:text-rose-400"
                                  : "font-semibold text-foreground"
                            }
                          >
                            {type === "CREDIT" ? "+" : type === "DEBIT" ? "-" : ""}
                            {formatCurrency(txn.amount || 0)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={status} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* UPI Management Tab */}
        <TabsContent value="upi" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="panel-luxe shadow-md">
              <CardHeader>
                <CardTitle>Register UPI ID</CardTitle>
                <CardDescription>Create a new UPI ID linked to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...upiRegistrationForm}>
                  <form onSubmit={upiRegistrationForm.handleSubmit(handleUpiRegistration)} className="space-y-4">
                    <FormField
                      control={upiRegistrationForm.control}
                      name="upiId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UPI ID</FormLabel>
                          <FormControl>
                            <Input placeholder="yourname@mybank" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={upiRegistrationForm.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Link Account</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select account" />
                              </SelectTrigger>
                              <SelectContent>
                                {accounts.map((acc) => (
                                  <SelectItem key={acc.accountNumber} value={acc.accountNumber}>
                                    {acc.accountNumber} • {acc.bankName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loading || accounts.length === 0 || !canInitiatePayments}>
                      <Smartphone className="h-4 w-4 mr-2" />
                      Register UPI ID
                    </Button>
                    {accounts.length === 0 && (
                      <p className="text-xs text-muted-foreground">You need at least one active account to register UPI.</p>
                    )}
                    {!canInitiatePayments && (
                      <p className="text-xs text-muted-foreground">Only customer accounts can register UPI IDs.</p>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card className="panel-luxe shadow-md">
              <CardHeader>
                <CardTitle>Your UPI IDs</CardTitle>
                <CardDescription>Activate, deactivate, or remove UPI profiles</CardDescription>
              </CardHeader>
              <CardContent>
                {upiProfiles.length === 0 ? (
                  <div className="text-center py-10">
                    <Smartphone className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No UPI profiles found</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {upiProfiles.map((upi) => (
                      <div key={upi.upiId} className="rounded-xl border border-border/70 bg-muted/25 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-semibold text-lg">{upi.upiId}</div>
                            <div className="text-sm text-muted-foreground">
                              {upi.accountNumber} • {upi.bankName}
                            </div>
                            <div className="text-xs text-muted-foreground/80">
                              {upi.accountHolderName} • {formatDateTime(upi.createdAt)}
                            </div>
                          </div>
                          <Badge variant={upi.status === "ACTIVE" ? "default" : "secondary"}>
                            {upi.status}
                          </Badge>
                        </div>
                        <Separator className="my-3" />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpiStatusToggle(upi.upiId, upi.status)}
                            disabled={loading || !canInitiatePayments}
                          >
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            {upi.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <TransactionReceipt
        transaction={selectedTransaction}
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        senderBalance={receiptBalances.sender}
        receiverBalance={receiptBalances.receiver}
      />
    </PageWrapper>
    </>
  );
  
}

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PageWrapper from "@/components/PageWrapper";
import PageHeader from "@/components/PageHeader";
import ExportMenu from "@/components/ExportMenu";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import DataTableToolbar from "@/components/DataTableToolbar";
import { transactionApi, accountApi } from "@/lib/api-client";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { StatCardSkeleton, TableSkeleton } from "@/components/LoadingStates";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Plus,
  Receipt,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import type { AccountResponseDTO, TransactionResponseDTO } from "@/types/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/rbac";

const transferSchema = z
  .object({
    senderAccount: z.string().min(1, "Sender account is required"),
    receiverAccount: z.string().min(1, "Receiver account is required"),
    amount: z
      .string()
      .min(1, "Amount is required")
      .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, "Amount must be greater than 0")
      .refine((value) => Number(value) <= 10000000, "Amount cannot exceed ₹10,000,000"),
  })
  .refine((data) => data.senderAccount !== data.receiverAccount, {
    message: "Sender and receiver cannot be the same",
    path: ["receiverAccount"],
  });

type TransferValues = z.infer<typeof transferSchema>;

export default function TransactionsPage() {
  const { user } = useAuth();
  const canCreateTransfer = (user?.roles || []).includes(ROLES.USER);
  const [transactions, setTransactions] = useState<TransactionResponseDTO[]>([]);
  const [accounts, setAccounts] = useState<AccountResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string | Date | undefined>>({
    status: undefined,
    date: undefined,
  });
  const [open, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(() => {
    if (typeof window === "undefined") return 10;
    const saved = Number(localStorage.getItem("sb.transactions.rowsPerPage") || "10");
    return [10, 20, 50].includes(saved) ? saved : 10;
  });

  const form = useForm<TransferValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: { senderAccount: "", receiverAccount: "", amount: "" },
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, accountsData] = await Promise.all([transactionApi.getAll(), accountApi.getAll()]);
      setTransactions(transactionsData);
      setAccounts(accountsData);
    } catch (error) {
      toast.error("Failed to load data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const senderAccountNumber = form.watch("senderAccount");
  const receiverAccountNumber = form.watch("receiverAccount");
  const amountString = form.watch("amount");

  const senderAccount = useMemo(
    () => (senderAccountNumber ? accounts.find((a) => a.accountNumber === senderAccountNumber) ?? null : null),
    [accounts, senderAccountNumber]
  );
  const receiverAccount = useMemo(
    () => (receiverAccountNumber ? accounts.find((a) => a.accountNumber === receiverAccountNumber) ?? null : null),
    [accounts, receiverAccountNumber]
  );

  const searchTerm = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        !searchTerm ||
        t.senderName?.toLowerCase().includes(searchTerm) ||
        t.receiverName?.toLowerCase().includes(searchTerm) ||
        t.senderAccountNumber?.toLowerCase().includes(searchTerm) ||
        t.receiverAccountNumber?.toLowerCase().includes(searchTerm) ||
        String(t.transactionId).includes(searchTerm);

      const matchesStatus = !activeFilters.status || t.status === activeFilters.status;

      const filterDate = activeFilters.date as Date | undefined;
      const dateValue = t.transactionDate;
      const matchesDate =
        !filterDate || !dateValue ? true : new Date(dateValue).toDateString() === filterDate.toDateString();

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [transactions, searchTerm, activeFilters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeFilters.status, activeFilters.date, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sb.transactions.rowsPerPage", String(rowsPerPage));
    }
  }, [rowsPerPage]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, currentPage, rowsPerPage]);

  const statusOptions = useMemo(() => {
    return Array.from(new Set(transactions.map((t) => t.status).filter(Boolean))).map((v) => ({
      label: v,
      value: v,
    }));
  }, [transactions]);

  const totalVolume = useMemo(() => transactions.reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const successCount = useMemo(
    () => transactions.filter((t) => t.status === "SUCCESS" || t.status === "COMPLETED").length,
    [transactions]
  );
  const successRate = transactions.length ? Math.round((successCount / transactions.length) * 100) : 0;
  const avgAmount = transactions.length ? totalVolume / transactions.length : 0;
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const rangeEnd = Math.min(currentPage * rowsPerPage, filtered.length);

  const handleAdd = async (values: TransferValues) => {
    const sender = accounts.find((a) => a.accountNumber === values.senderAccount);
    const receiver = accounts.find((a) => a.accountNumber === values.receiverAccount);
    const amount = parseFloat(values.amount);

    if (sender && amount > sender.balance) {
      form.setError("amount", {
        type: "validate",
        message: `Insufficient balance (Available: ${formatCurrency(sender.balance)})`,
      });
      return;
    }

    try {
      await transactionApi.create({
        senderAccount: values.senderAccount,
        receiverAccount: values.receiverAccount,
        amount,
        senderBankName: sender?.bankName,
        receiverBankName: receiver?.bankName,
      });
      toast.success("Transaction completed successfully");
      form.reset();
      setOpen(false);
      await loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Transaction failed";
      toast.error(message);
      console.error(error);
    }
  };

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    try {
      const exportData = filtered.map((t) => ({
        "Transaction ID": `TXN_${t.transactionId}`,
        Sender: t.senderName,
        "Sender Account": t.senderAccountNumber,
        Receiver: t.receiverName,
        "Receiver Account": t.receiverAccountNumber,
        Amount: t.amount,
        Status: t.status,
        Date: t.transactionDate ? formatDateTime(t.transactionDate) : "-",
      }));

      if (format === "csv") {
        exportToCSV(exportData, `transactions-${new Date().toISOString().split("T")[0]}.csv`);
      } else if (format === "excel") {
        exportToExcel(
          exportData,
          `transactions-${new Date().toISOString().split("T")[0]}.xlsx`,
          "Transactions"
        );
      } else {
        exportToPDF(exportData, "Transactions Report");
      }

      toast.success(`Exported ${filtered.length} transactions to ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to export transactions");
      console.error(error);
    }
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Transactions"
        subtitle="Real-time transaction history and transfers"
        icon={<Receipt className="h-5 w-5" />}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <ExportMenu onExport={handleExport} disabled={loading || filtered.length === 0} />
            {canCreateTransfer && (
            <Dialog
              open={open}
              onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) form.reset();
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 shadow-md hover:from-cyan-600 hover:to-blue-700">
                  <Plus className="h-4 w-4 mr-2" /> New Transfer
                </Button>
              </DialogTrigger>

            <DialogContent className="max-w-2xl border-border/70 bg-card/95 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle>Create Transaction</DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAdd)} className="grid gap-6 py-4">
                  <FormField
                    control={form.control}
                    name="senderAccount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sender Account *</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className={form.formState.errors.senderAccount ? "border-destructive" : ""}>
                              <SelectValue placeholder="Select sender account" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts
                                .filter((a) => a.status === "ACTIVE" && a.balance > 0)
                                .map((a) => (
                                  <SelectItem key={a.accountNumber} value={a.accountNumber}>
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="font-mono text-xs">{a.accountNumber}</span>
                                      <span className="text-muted-foreground">—</span>
                                      <span>{a.customerName}</span>
                                      <span className="text-muted-foreground">—</span>
                                      <span className="font-semibold text-emerald-600">{formatCurrency(a.balance)}</span>
                                    </div>
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
                    control={form.control}
                    name="receiverAccount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Receiver Account *</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className={form.formState.errors.receiverAccount ? "border-destructive" : ""}>
                              <SelectValue placeholder="Select receiver account" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts
                                .filter((a) => a.status === "ACTIVE")
                                .map((a) => (
                                  <SelectItem key={a.accountNumber} value={a.accountNumber}>
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="font-mono text-xs">{a.accountNumber}</span>
                                      <span className="text-muted-foreground">—</span>
                                      <span>{a.customerName}</span>
                                      <span className="text-muted-foreground">—</span>
                                      <span className="font-semibold text-emerald-600">{formatCurrency(a.balance)}</span>
                                    </div>
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
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                            <Input type="number" step="0.01" min="0" placeholder="0.00" className="pl-7" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {senderAccount && receiverAccount && amountString && !form.formState.errors.amount && (
                    <Alert className="bg-muted/35 border-border/70">
                      <AlertDescription>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Transfer Summary</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {senderAccount.customerName} → {receiverAccount.customerName}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold">₹{parseFloat(amountString).toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Estimated completion: Instant</p>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                      disabled={form.formState.isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? "Processing..." : "Process Transfer"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
            )}
          </>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Transactions"
            value={transactions.length}
            subtitle="All time"
            icon={<Receipt className="h-5 w-5" />}
          />
          <StatCard
            title="Total Volume"
            value={formatCurrency(totalVolume)}
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
            title="Average Amount"
            value={formatCurrency(avgAmount)}
            subtitle="Per transaction"
            icon={<ArrowRight className="h-5 w-5" />}
          />
        </div>
      )}

      <div className="glass-elevated transition-shadow">
        <div className="p-4 border-b border-border/70 bg-gradient-to-r from-primary/10 to-transparent">
          <DataTableToolbar
            searchPlaceholder="Search transactions..."
            searchValue={search}
            onSearchChange={setSearch}
            filters={[
              { key: "status", label: "Status", type: "select", options: statusOptions },
              { key: "date", label: "Date", type: "date" },
            ]}
            activeFilters={activeFilters}
            onFilterChange={(key, value) => setActiveFilters((prev) => ({ ...prev, [key]: value }))}
            onClearFilters={() => setActiveFilters({ status: undefined, date: undefined })}
          />
        </div>

        {loading ? (
          <TableSkeleton columns={7} rows={6} className="p-2" />
        ) : (
          <>
          <div className="px-4 py-2.5 border-b border-border/60 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-muted-foreground">
            <p>
              Showing <span className="font-medium text-foreground">{rangeStart}</span>–<span className="font-medium text-foreground">{rangeEnd}</span> of <span className="font-medium text-foreground">{filtered.length}</span> transactions
            </p>
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <Select
                value={String(rowsPerPage)}
                onValueChange={(value) => setRowsPerPage(Number(value))}
              >
                <SelectTrigger className="h-8 w-[84px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader className="sticky top-0 z-10 bg-card/90 backdrop-blur-xl supports-[backdrop-filter]:bg-card/75">
              <TableRow>
                <TableHead>TXN ID</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead></TableHead>
                <TableHead>Receiver</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.map((tx) => (
                <TableRow key={tx.transactionId} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold">TXN_{tx.transactionId}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{tx.senderName}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{tx.senderAccountNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{tx.receiverName}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{tx.receiverAccountNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(tx.amount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={tx.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {tx.transactionDate ? formatDateTime(tx.transactionDate) : "-"}
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <ArrowRight className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No transactions found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>

          <div className="px-4 py-3 border-t border-border/60 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || filtered.length === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-xs text-muted-foreground px-1">
              Page <span className="font-medium text-foreground">{currentPage}</span> of <span className="font-medium text-foreground">{totalPages}</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || filtered.length === 0}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          </>
        )}
      </div>
    </PageWrapper>
  );
}

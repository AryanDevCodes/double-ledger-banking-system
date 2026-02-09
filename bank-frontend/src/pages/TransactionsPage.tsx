import { useState, useEffect } from "react";
import PageWrapper from "@/components/PageWrapper";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import DataTableToolbar from "@/components/DataTableToolbar";
import { transactionApi, accountApi } from "@/lib/api-client";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, ArrowRight, RefreshCw, AlertTriangle, CheckCircle2, Download, FileSpreadsheet, FileText, Receipt, TrendingUp, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { TransactionResponseDTO, AccountResponseDTO } from "@/types/api";
import { toast } from "sonner";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionResponseDTO[]>([]);
  const [accounts, setAccounts] = useState<AccountResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string | Date | undefined>>({
    status: undefined,
    date: undefined,
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ senderAccount: "", receiverAccount: "", amount: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, accountsData] = await Promise.all([
        transactionApi.getAll(),
        accountApi.getAll()
      ]);
      setTransactions(transactionsData);
      setAccounts(accountsData);
    } catch (error) {
      toast.error("Failed to load data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const searchTerm = search.trim().toLowerCase();
  const filtered = transactions.filter((t) => {
    const matchesSearch =
      !searchTerm ||
      t.senderName?.toLowerCase().includes(searchTerm) ||
      t.receiverName?.toLowerCase().includes(searchTerm) ||
      t.senderAccountNumber?.toLowerCase().includes(searchTerm) ||
      t.receiverAccountNumber?.toLowerCase().includes(searchTerm) ||
      String(t.transactionId).includes(searchTerm);
    const matchesStatus = !activeFilters.status || t.status === activeFilters.status;
    const filterDate = activeFilters.date as Date | undefined;
    const matchesDate = !filterDate
      ? true
      : new Date(t.transactionDate).toDateString() === filterDate.toDateString();
    return matchesSearch && matchesStatus && matchesDate;
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!form.senderAccount) {
      newErrors.senderAccount = "Sender account is required";
    }
    if (!form.receiverAccount) {
      newErrors.receiverAccount = "Receiver account is required";
    }
    if (form.senderAccount && form.receiverAccount && form.senderAccount === form.receiverAccount) {
      newErrors.receiverAccount = "Sender and receiver cannot be the same";
    }
    if (!form.amount) {
      newErrors.amount = "Amount is required";
    } else {
      const amount = parseFloat(form.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = "Amount must be greater than 0";
      } else if (amount > 10000000) {
        newErrors.amount = "Amount cannot exceed ₹10,000,000";
      }
      
      // Check sender balance
      if (form.senderAccount) {
        const sender = accounts.find(a => a.accountNumber === form.senderAccount);
        if (sender && amount > sender.balance) {
          newErrors.amount = `Insufficient balance (Available: ${formatCurrency(sender.balance)})`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = async () => {
    if (!validateForm()) {
      return;
    }

    const sender = accounts.find((a) => a.accountNumber === form.senderAccount);
    const receiver = accounts.find((a) => a.accountNumber === form.receiverAccount);

    try {
      setSubmitting(true);
      await transactionApi.create({
        senderAccount: form.senderAccount,
        receiverAccount: form.receiverAccount,
        amount: parseFloat(form.amount),
        senderBankName: sender?.bankName,
        receiverBankName: receiver?.bankName,
      });
      setForm({ senderAccount: "", receiverAccount: "", amount: "" });
      setErrors({});
      setOpen(false);
      toast.success("Transaction completed successfully");
      loadData(); // Refresh to get updated data
    } catch (error: any) {
      toast.error(error?.message || "Transaction failed");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const senderAccount = form.senderAccount ? accounts.find(a => a.accountNumber === form.senderAccount) : null;
  const receiverAccount = form.receiverAccount ? accounts.find(a => a.accountNumber === form.receiverAccount) : null;
  const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0);
  const successCount = transactions.filter((t) => t.status === "SUCCESS").length;
  const successRate = transactions.length ? Math.round((successCount / transactions.length) * 100) : 0;
  const avgAmount = transactions.length ? totalVolume / transactions.length : 0;
  const statusOptions = Array.from(new Set(transactions.map((t) => t.status).filter(Boolean))).map((v) => ({
    label: v,
    value: v,
  }));

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
        Date: formatDateTime(t.transactionDate),
      }));

      if (format === "csv") {
        exportToCSV(exportData, `transactions-${new Date().toISOString().split("T")[0]}.csv`);
      } else if (format === "excel") {
        exportToExcel(exportData, `transactions-${new Date().toISOString().split("T")[0]}.xlsx`, "Transactions");
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
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">Real-time transaction history and transfers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                <FileText className="h-4 w-4 mr-2" /> Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("excel")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Export as Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                <FileText className="h-4 w-4 mr-2" /> Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setForm({ senderAccount: "", receiverAccount: "", amount: "" });
              setErrors({});
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                <Plus className="h-4 w-4 mr-2" /> New Transfer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Transaction</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                {/* Sender Account */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sender Account *</Label>
                  <Select 
                    value={form.senderAccount} 
                    onValueChange={(v) => {
                      setForm({ ...form, senderAccount: v });
                      setErrors({ ...errors, senderAccount: "" });
                    }}
                  >
                    <SelectTrigger className={errors.senderAccount ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select sender account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.filter(a => a.status === "ACTIVE" && a.balance > 0).map((a) => (
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
                  {errors.senderAccount && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.senderAccount}
                    </p>
                  )}
                  {senderAccount && (
                    <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                      <AlertDescription className="text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div><span className="text-muted-foreground">Customer:</span> <span className="font-medium">{senderAccount.customerName}</span></div>
                          <div><span className="text-muted-foreground">Bank:</span> <span className="font-medium">{senderAccount.bankName}</span></div>
                          <div><span className="text-muted-foreground">Balance:</span> <span className="font-semibold text-emerald-600">{formatCurrency(senderAccount.balance)}</span></div>
                          <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={senderAccount.status} /></div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Receiver Account */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Receiver Account *</Label>
                  <Select 
                    value={form.receiverAccount} 
                    onValueChange={(v) => {
                      setForm({ ...form, receiverAccount: v });
                      setErrors({ ...errors, receiverAccount: "" });
                    }}
                  >
                    <SelectTrigger className={errors.receiverAccount ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select receiver account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.filter(a => a.status === "ACTIVE" && a.accountNumber !== form.senderAccount).map((a) => (
                        <SelectItem key={a.accountNumber} value={a.accountNumber}>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs">{a.accountNumber}</span>
                            <span className="text-muted-foreground">—</span>
                            <span>{a.customerName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.receiverAccount && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.receiverAccount}
                    </p>
                  )}
                  {receiverAccount && (
                    <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                      <AlertDescription className="text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div><span className="text-muted-foreground">Customer:</span> <span className="font-medium">{receiverAccount.customerName}</span></div>
                          <div><span className="text-muted-foreground">Bank:</span> <span className="font-medium">{receiverAccount.bankName}</span></div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Amount (₹) *</Label>
                  <Input 
                    type="number" 
                    placeholder="Enter amount" 
                    value={form.amount} 
                    onChange={(e) => {
                      setForm({ ...form, amount: e.target.value });
                      setErrors({ ...errors, amount: "" });
                    }}
                    className={errors.amount ? "border-destructive" : ""}
                    min="0.01"
                    step="0.01"
                  />
                  {errors.amount && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.amount}
                    </p>
                  )}
                  {form.amount && !errors.amount && parseFloat(form.amount) > 0 && (
                    <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <AlertDescription className="text-xs">
                        Transfer amount: <span className="font-bold text-emerald-600">{formatCurrency(parseFloat(form.amount))}</span>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Button 
                  onClick={handleAdd} 
                  disabled={submitting || !form.senderAccount || !form.receiverAccount || !form.amount}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  {submitting ? "Processing..." : "Execute Transfer"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
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
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <StatCard
          title="Average Amount"
          value={formatCurrency(avgAmount)}
          subtitle="Per transaction"
          icon={<ArrowRight className="h-5 w-5" />}
        />
      </div>

      <div className="glass-card hover:shadow-lg transition-shadow">
        <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
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
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
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
              {filtered.map((tx) => (
                <TableRow key={tx.transactionId} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold">TXN_{tx.transactionId}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{tx.senderName}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{tx.senderAccountNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell><ArrowRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{tx.receiverName}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{tx.receiverAccountNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(tx.amount)}</TableCell>
                  <TableCell><StatusBadge status={tx.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(tx.transactionDate)}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && !loading && (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <ArrowRight className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No transactions found</p>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </PageWrapper>
  );
}

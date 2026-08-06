import { useTransactions } from "@/hooks/useTransactions";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PageWrapper from "@/components/PageWrapper";
import PageHeader from "@/components/PageHeader";
import ExportMenu from "@/components/ExportMenu";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import DataTableToolbar from "@/components/DataTableToolbar";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { StatCardSkeleton, TableSkeleton } from "@/components/LoadingStates";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowRight,
  ArrowUpDown,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  FilterX,
  MoreHorizontal,
  Plus,
  Receipt,
  RefreshCw,
  Save,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import type { AccountResponseDTO, TransactionResponseDTO } from "@/types/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/rbac";
import { getApiErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Schema & Types                                                     */
/* ------------------------------------------------------------------ */

const transferSchema = z
  .object({
    senderAccount: z.string().min(1, "Sender account is required"),
    receiverAccount: z.string().min(1, "Receiver account is required"),
    amount: z
      .string()
      .min(1, "Amount is required")
      .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, "Amount must be greater than 0")
      .refine((v) => Number(v) <= 10_000_000, "Amount cannot exceed ₹10,000,000"),
  })
  .refine((d) => d.senderAccount !== d.receiverAccount, {
    message: "Sender and receiver cannot be the same",
    path: ["receiverAccount"],
  });

type TransferValues = z.infer<typeof transferSchema>;

type SavedTransactionView = {
  id: string;
  name: string;
  search: string;
  status?: string;
  dateIso?: string;
  minAmount?: string;
  maxAmount?: string;
};

type SortConfig = {
  key: keyof TransactionResponseDTO | null;
  direction: "asc" | "desc";
};

type ColumnKey =
  | "select"
  | "transactionId"
  | "sender"
  | "arrow"
  | "receiver"
  | "amount"
  | "status"
  | "date"
  | "actions";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const round2 = (n: number) => Math.round(n * 100) / 100;

function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard"));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TransactionsPage() {
  // ✅ Use the React Query hook – no more manual data state
  const {
    transactions,
    accounts,
    isLoading,
    isRefreshing,
    refetch,
    createTransaction,
    reverseTransaction,
    isCreating,
    isReversing,
  } = useTransactions();

  const { user, hasAnyRole } = useAuth();
  const canCreateTransfer = (user?.roles || []).includes(ROLES.USER);
  const canReverse = hasAnyRole(ROLES.ADMIN, ROLES.MANAGER);

  // ------------------ UI state (filters, pagination, selection) ------------------
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [activeFilters, setActiveFilters] = useState<
    Record<string, string | Date | undefined>
  >({
    status: undefined,
    date: undefined,
    minAmount: undefined,
    maxAmount: undefined,
  });

  const [sort, setSort] = useState<SortConfig>({
    key: "transactionDate",
    direction: "desc",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(() => {
    if (typeof window === "undefined") return 10;
    const saved = Number(localStorage.getItem("sb.transactions.rowsPerPage") || "10");
    return [10, 20, 50, 100].includes(saved) ? saved : 10;
  });

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState(false);
  const [reverseOpen, setReverseOpen] = useState(false);
  const [reverseReason, setReverseReason] = useState("");
  const [reverseTarget, setReverseTarget] = useState<TransactionResponseDTO | null>(null);
  const [reverseSubmitting, setReverseSubmitting] = useState(false);
  const [detailTx, setDetailTx] = useState<TransactionResponseDTO | null>(null);

  const [savedViews, setSavedViews] = useState<SavedTransactionView[]>([]);
  const [viewName, setViewName] = useState("");
  const savedViewsStorageKey = `sb.transactions.savedViews.${user?.userId ?? "anon"}`;

  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    () =>
      new Set<ColumnKey>([
        "select",
        "transactionId",
        "sender",
        "arrow",
        "receiver",
        "amount",
        "status",
        "date",
        "actions",
      ])
  );

  const form = useForm<TransferValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: { senderAccount: "", receiverAccount: "", amount: "" },
  });

  // ------------------ Auto‑refresh timer (uses refetch) ------------------
  const [autoRefresh, setAutoRefresh] = useState(false);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        refetch(); // ✅ uses the React Query refetch
      }, 30_000);
    } else if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [autoRefresh, refetch]);

  // ------------------ Keyboard shortcuts ------------------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === "r") {
          e.preventDefault();
          refetch(); // ✅ uses refetch
        }
        if (e.key.toLowerCase() === "n" && canCreateTransfer) {
          e.preventDefault();
          setOpen(true);
        }
      }
      if (e.key === "Escape") {
        setDetailTx(null);
        setReverseOpen(false);
        if (open) setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [refetch, canCreateTransfer, open]);

  // ------------------ Saved Views (localStorage) ------------------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(savedViewsStorageKey);
      if (!raw) return setSavedViews([]);
      const parsed = JSON.parse(raw) as SavedTransactionView[];
      setSavedViews(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSavedViews([]);
    }
  }, [savedViewsStorageKey]);

  useEffect(() => {
    localStorage.setItem(savedViewsStorageKey, JSON.stringify(savedViews));
  }, [savedViews, savedViewsStorageKey]);

  // ------------------ Derived state (filtering, sorting, pagination) ------------------
  const senderAccountNumber = form.watch("senderAccount");
  const receiverAccountNumber = form.watch("receiverAccount");
  const amountString = form.watch("amount");

  const senderAccount = useMemo(
    () =>
      senderAccountNumber
        ? accounts.find((a) => a.accountNumber === senderAccountNumber) ?? null
        : null,
    [accounts, senderAccountNumber]
  );
  const receiverAccount = useMemo(
    () =>
      receiverAccountNumber
        ? accounts.find((a) => a.accountNumber === receiverAccountNumber) ?? null
        : null,
    [accounts, receiverAccountNumber]
  );

  const searchTerm = debouncedSearch.trim().toLowerCase();
  const filtered = useMemo(() => {
    let data = transactions.filter((t) => {
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
        !filterDate || !dateValue
          ? true
          : new Date(dateValue).toDateString() === filterDate.toDateString();

      const minAmt = activeFilters.minAmount ? Number(activeFilters.minAmount) : null;
      const maxAmt = activeFilters.maxAmount ? Number(activeFilters.maxAmount) : null;
      const matchesAmount =
        (minAmt === null || t.amount >= minAmt) &&
        (maxAmt === null || t.amount <= maxAmt);

      return matchesSearch && matchesStatus && matchesDate && matchesAmount;
    });

    if (sort.key) {
      data = [...data].sort((a, b) => {
        const aVal = a[sort.key!];
        const bVal = b[sort.key!];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sort.direction === "asc" ? aVal - bVal : bVal - aVal;
        }
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        if (aStr < bStr) return sort.direction === "asc" ? -1 : 1;
        if (aStr > bStr) return sort.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [transactions, searchTerm, activeFilters, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearch,
    activeFilters.status,
    activeFilters.date,
    activeFilters.minAmount,
    activeFilters.maxAmount,
    rowsPerPage,
    sort.key,
    sort.direction,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
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
    return Array.from(new Set(transactions.map((t) => t.status).filter(Boolean))).map(
      (v) => ({
        label: v,
        value: v,
      })
    );
  }, [transactions]);

  // Stats
  const totalVolume = useMemo(
    () => round2(transactions.reduce((sum, t) => sum + t.amount, 0)),
    [transactions]
  );
  const successCount = useMemo(
    () =>
      transactions.filter((t) => t.status === "SUCCESS" || t.status === "COMPLETED")
        .length,
    [transactions]
  );
  const successRate = transactions.length
    ? Math.round((successCount / transactions.length) * 100)
    : 0;
  const avgAmount = transactions.length
    ? round2(totalVolume / transactions.length)
    : 0;
  const pendingCount = useMemo(
    () => transactions.filter((t) => t.status === "PENDING").length,
    [transactions]
  );
  const reversedCount = useMemo(
    () => transactions.filter((t) => t.status === "REVERSED").length,
    [transactions]
  );

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const rangeEnd = Math.min(currentPage * rowsPerPage, filtered.length);

  // ------------------ Handlers (using the hook's mutations) ------------------
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
      await createTransaction({
        senderAccount: values.senderAccount,
        receiverAccount: values.receiverAccount,
        amount,
        senderBankName: sender?.bankName,
        receiverBankName: receiver?.bankName,
      });
      toast.success("Transaction completed successfully");
      form.reset();
      setOpen(false);
      // ✅ No need to call loadData – the hook invalidates and refetches
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Transaction failed"));
      console.error(error);
    }
  };

  const handleReverse = async () => {
    if (!reverseTarget) return;
    try {
      setReverseSubmitting(true);
      const reason = reverseReason.trim();
      await reverseTransaction({
        id: reverseTarget.transactionId,
        reason: reason || undefined,
      });
      toast.success(`Transaction TXN_${reverseTarget.transactionId} reversed`);
      setReverseOpen(false);
      setReverseTarget(null);
      setReverseReason("");
      // ✅ Hook invalidates queries automatically
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to reverse transaction"));
      console.error(error);
    } finally {
      setReverseSubmitting(false);
    }
  };

  // The rest of the handlers (export, saved views, selection, etc.) remain unchanged.

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    try {
      const exportData = (
        selectedIds.size > 0
          ? transactions.filter((t) => selectedIds.has(t.transactionId))
          : filtered
      ).map((t) => ({
        "Transaction ID": `TXN_${t.transactionId}`,
        Sender: t.senderName,
        "Sender Account": t.senderAccountNumber,
        Receiver: t.receiverName,
        "Receiver Account": t.receiverAccountNumber,
        Amount: t.amount,
        Status: t.status,
        Date: t.transactionDate ? formatDateTime(t.transactionDate) : "-",
      }));

      const suffix = selectedIds.size > 0 ? "selected" : new Date().toISOString().split("T")[0];
      if (format === "csv") {
        exportToCSV(exportData, `transactions-${suffix}.csv`);
      } else if (format === "excel") {
        exportToExcel(exportData, `transactions-${suffix}.xlsx`, "Transactions");
      } else {
        exportToPDF(exportData, "Transactions Report");
      }

      toast.success(`Exported ${exportData.length} transactions to ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to export transactions"));
      console.error(error);
    }
  };

  const openReverseDialog = (tx: TransactionResponseDTO) => {
    setReverseTarget(tx);
    setReverseReason("");
    setReverseOpen(true);
  };

  const saveCurrentView = () => {
    const trimmedName = viewName.trim();
    if (!trimmedName) {
      toast.error("Enter a view name");
      return;
    }
    if (savedViews.some((v) => v.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error("A view with this name already exists");
      return;
    }
    const next: SavedTransactionView = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
      name: trimmedName,
      search,
      status: activeFilters.status as string | undefined,
      dateIso: activeFilters.date instanceof Date ? activeFilters.date.toISOString() : undefined,
      minAmount: activeFilters.minAmount as string | undefined,
      maxAmount: activeFilters.maxAmount as string | undefined,
    };
    setSavedViews((c) => [next, ...c].slice(0, 10));
    setViewName("");
    toast.success(`Saved view "${trimmedName}"`);
  };

  const applySavedView = (view: SavedTransactionView) => {
    setSearch(view.search ?? "");
    setActiveFilters({
      status: view.status,
      date: view.dateIso ? new Date(view.dateIso) : undefined,
      minAmount: view.minAmount,
      maxAmount: view.maxAmount,
    });
    toast.success(`Applied "${view.name}"`);
  };

  const deleteSavedView = (id: string) => {
    setSavedViews((c) => c.filter((v) => v.id !== id));
    toast.success("Saved view removed");
  };

  const toggleSelectAll = () => {
    const pageIds = new Set(paginatedTransactions.map((t) => t.transactionId));
    const allSelected = pageIds.size > 0 && [...pageIds].every((id) => selectedIds.has(id));
    if (allSelected) {
      const next = new Set(selectedIds);
      pageIds.forEach((id) => next.delete(id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      pageIds.forEach((id) => next.add(id));
      setSelectedIds(next);
    }
  };

  const toggleSelectOne = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const clearSelection = () => setSelectedIds(new Set());

  const toggleSort = (key: keyof TransactionResponseDTO) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const toggleColumn = (col: ColumnKey) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  };

  const SortIcon = ({ column }: { column: keyof TransactionResponseDTO }) => {
    if (sort.key !== column) return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />;
    return sort.direction === "asc" ? (
      <TrendingUp className="ml-1 h-3 w-3 text-primary" />
    ) : (
      <TrendingUp className="ml-1 h-3 w-3 text-primary rotate-180" />
    );
  };

  // Determine loading state: initial load or background refetch
  const loading = isLoading || isRefreshing;

  return (
    <TooltipProvider delayDuration={200}>
      <PageWrapper>
        <PageHeader
          title="Transactions"
          subtitle="Real-time transaction history and transfers"
          icon={<Receipt className="h-5 w-5" />}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={loading}
                className="gap-1.5"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                Refresh
                <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                  <span className="text-xs">⌘</span>R
                </kbd>
              </Button>

              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh((v) => !v)}
                className="gap-1.5"
              >
                <Clock className="h-4 w-4" />
                {autoRefresh ? "Auto ON" : "Auto OFF"}
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
                    <Button className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--chart-6))] shadow-md hover:brightness-110 transition-all gap-1.5">
                      <Plus className="h-4 w-4" />
                      New Transfer
                      <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-[hsl(var(--primary-foreground)/0.3)] bg-[hsl(var(--primary-foreground)/0.1)] px-1.5 font-mono text-[10px] font-medium">
                        <span className="text-xs">⌘</span>N
                      </kbd>
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-2xl glass-panel border-[var(--glass-border)]">
                    <DialogHeader>
                      <DialogTitle>Create Transaction</DialogTitle>
                      <DialogDescription>
                        Transfer funds between active accounts instantly.
                      </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleAdd)} className="grid gap-5 py-4">
                        <FormField
                          control={form.control}
                          name="senderAccount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sender Account *</FormLabel>
                              <FormControl>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger
                                    className={cn(form.formState.errors.senderAccount && "border-destructive")}
                                  >
                                    <SelectValue placeholder="Select sender account" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-72">
                                    {accounts
                                      .filter((a) => a.status === "ACTIVE" && a.balance > 0)
                                      .sort((a, b) => b.balance - a.balance)
                                      .map((a) => (
                                        <SelectItem key={a.accountNumber} value={a.accountNumber}>
                                          <div className="flex items-center justify-between gap-4 w-72">
                                            <span className="font-mono text-xs">{a.accountNumber}</span>
                                            <span className="text-muted-foreground">—</span>
                                            <span className="truncate max-w-[100px]">{a.customerName}</span>
                                            <span className="text-muted-foreground">—</span>
                                            <span className="font-semibold text-[hsl(var(--success))]">
                                              {formatCurrency(a.balance)}
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    {accounts.filter((a) => a.status === "ACTIVE" && a.balance > 0).length === 0 && (
                                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                                        No active accounts with balance
                                      </div>
                                    )}
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
                                  <SelectTrigger
                                    className={cn(form.formState.errors.receiverAccount && "border-destructive")}
                                  >
                                    <SelectValue placeholder="Select receiver account" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-72">
                                    {accounts
                                      .filter((a) => a.status === "ACTIVE")
                                      .map((a) => (
                                        <SelectItem key={a.accountNumber} value={a.accountNumber}>
                                          <div className="flex items-center justify-between gap-4 w-72">
                                            <span className="font-mono text-xs">{a.accountNumber}</span>
                                            <span className="text-muted-foreground">—</span>
                                            <span className="truncate max-w-[100px]">{a.customerName}</span>
                                            <span className="text-muted-foreground">—</span>
                                            <span className="font-semibold text-[hsl(var(--success))]">
                                              {formatCurrency(a.balance)}
                                            </span>
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
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                    ₹
                                  </span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    className="pl-7"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                              {senderAccount && (
                                <p className="text-xs text-muted-foreground">
                                  Available balance:{" "}
                                  <span className={cn("font-medium", senderAccount.balance <= 0 && "text-destructive")}>
                                    {formatCurrency(senderAccount.balance)}
                                  </span>
                                </p>
                              )}
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
                                  <p className="text-lg font-semibold">
                                    ₹{parseFloat(amountString).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Estimated completion: Instant</p>
                                </div>
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}

                        <DialogFooter className="gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={form.formState.isSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={form.formState.isSubmitting || isCreating}
                            className="min-w-[140px]"
                          >
                            {form.formState.isSubmitting || isCreating ? (
                              <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              "Process Transfer"
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          }
        />

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Transactions"
              value={transactions.length.toLocaleString("en-IN")}
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
              subtitle={`${successCount.toLocaleString("en-IN")} successful · ${pendingCount} pending · ${reversedCount} reversed`}
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

        {/* Table Shell */}
        <div className="data-table-shell transition-shadow">
          <div className="p-4 border-b border-[var(--glass-border)] bg-gradient-to-r from-[var(--accent-primary)]/8 to-transparent space-y-4">
            <DataTableToolbar
  searchPlaceholder="Search transactions..."
  searchValue={search}
  onSearchChange={setSearch}
  filters={[
    { key: "status", label: "Status", type: "select", options: statusOptions },
    { key: "date", label: "Date", type: "date" },
  ]}
  activeFilters={activeFilters}
  onFilterChange={(key, value) => setActiveFilters(prev => ({ ...prev, [key]: value }))}
  onClearFilters={() =>
    setActiveFilters({ status: undefined, date: undefined, minAmount: undefined, maxAmount: undefined })
  }
/>

{/* Add custom amount range filter directly after the toolbar */}
<div className="flex items-center gap-4 px-4 py-2 border-b border-border/60">
  <span className="text-xs text-muted-foreground">Amount:</span>
  <Input
    type="number"
    placeholder="Min"
    value={activeFilters.minAmount || ''}
    onChange={(e) => setActiveFilters(prev => ({ ...prev, minAmount: e.target.value }))}
    className="h-8 w-24"
  />
  <span className="text-muted-foreground">–</span>
  <Input
    type="number"
    placeholder="Max"
    value={activeFilters.maxAmount || ''}
    onChange={(e) => setActiveFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
    className="h-8 w-24"
  />
</div>

            {/* Saved Views */}
            <div className="rounded-xl border border-[var(--glass-border)] glass-panel--subtle p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Bookmark className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="Save current filter view"
                    value={viewName}
                    onChange={(e) => setViewName(e.target.value)}
                    className="h-8"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveCurrentView();
                    }}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={saveCurrentView} className="shrink-0">
                  <Save className="h-4 w-4 mr-2" />
                  Save View
                </Button>
              </div>

              {savedViews.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {savedViews.map((view) => (
                    <div
                      key={view.id}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--glass-border)] glass-panel--subtle px-2 py-1 animate-in fade-in slide-in-from-bottom-1"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => applySavedView(view)}
                      >
                        {view.name}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteSavedView(view.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Column Visibility & Bulk Actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <FilterX className="h-3.5 w-3.5 mr-1.5" />
                      Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {([
                      { key: "select", label: "Checkbox" },
                      { key: "transactionId", label: "TXN ID" },
                      { key: "sender", label: "Sender" },
                      { key: "arrow", label: "Arrow" },
                      { key: "receiver", label: "Receiver" },
                      { key: "amount", label: "Amount" },
                      { key: "status", label: "Status" },
                      { key: "date", label: "Date" },
                      { key: "actions", label: "Actions" },
                    ] as { key: ColumnKey; label: string }[]).map((col) => (
                      <DropdownMenuItem
                        key={col.key}
                        onClick={(e) => {
                          e.preventDefault();
                          toggleColumn(col.key);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Checkbox checked={visibleColumns.has(col.key)} />
                        <span className="text-sm">{col.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Last updated time is not available from React Query directly, but we can derive from query state or ignore. */}
                {/* For simplicity, we can show the current time or omit. */}
              </div>

              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                  <Badge variant="secondary" className="font-mono">
                    {selectedIds.size} selected
                  </Badge>
                  <Button variant="outline" size="sm" className="h-8" onClick={clearSelection}>
                    <X className="h-3.5 w-3.5 mr-1" />
                    Clear
                  </Button>
                  <ExportMenu
                    onExport={handleExport}
                    disabled={false}
                    label="Export Selected"
                  />
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <TableSkeleton columns={visibleColumns.size} rows={6} className="p-2" />
          ) : (
            <>
              {/* Pagination Info */}
              <div className="px-4 py-2.5 border-b border-border/60 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-muted-foreground">
                <p>
                  Showing <span className="font-medium text-foreground">{rangeStart}</span>–
                  <span className="font-medium text-foreground">{rangeEnd}</span> of{" "}
                  <span className="font-medium text-foreground">{filtered.length.toLocaleString("en-IN")}</span>{" "}
                  transactions
                  {searchTerm && (
                    <span className="ml-1 text-muted-foreground">
                      (filtered from {transactions.length.toLocaleString("en-IN")})
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <span>Rows per page</span>
                  <Select
                    value={String(rowsPerPage)}
                    onValueChange={(v) => setRowsPerPage(Number(v))}
                  >
                    <SelectTrigger className="h-8 w-[84px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50, 100].map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/45">
                <Table className="min-w-[900px]">
                  <TableHeader className="sticky top-0 z-10 bg-card/90 backdrop-blur-xl supports-[backdrop-filter]:bg-card/75">
                    <TableRow>
                      {visibleColumns.has("select") && (
                        <TableHead className="w-10">
                          <Checkbox
                            checked={
                              paginatedTransactions.length > 0 &&
                              paginatedTransactions.every((t) => selectedIds.has(t.transactionId))
                            }
                            onCheckedChange={toggleSelectAll}
                            aria-label="Select all on page"
                          />
                        </TableHead>
                      )}
                      {visibleColumns.has("transactionId") && (
                        <TableHead
                          className="cursor-pointer select-none"
                          onClick={() => toggleSort("transactionId")}
                        >
                          <div className="flex items-center">
                            TXN ID
                            <SortIcon column="transactionId" />
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.has("sender") && (
                        <TableHead
                          className="cursor-pointer select-none"
                          onClick={() => toggleSort("senderName")}
                        >
                          <div className="flex items-center">
                            Sender
                            <SortIcon column="senderName" />
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.has("arrow") && <TableHead className="w-8" />}
                      {visibleColumns.has("receiver") && (
                        <TableHead
                          className="cursor-pointer select-none"
                          onClick={() => toggleSort("receiverName")}
                        >
                          <div className="flex items-center">
                            Receiver
                            <SortIcon column="receiverName" />
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.has("amount") && (
                        <TableHead
                          className="text-right cursor-pointer select-none"
                          onClick={() => toggleSort("amount")}
                        >
                          <div className="flex items-center justify-end">
                            Amount
                            <SortIcon column="amount" />
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.has("status") && (
                        <TableHead
                          className="cursor-pointer select-none"
                          onClick={() => toggleSort("status")}
                        >
                          <div className="flex items-center">
                            Status
                            <SortIcon column="status" />
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.has("date") && (
                        <TableHead
                          className="cursor-pointer select-none"
                          onClick={() => toggleSort("transactionDate")}
                        >
                          <div className="flex items-center">
                            Date
                            <SortIcon column="transactionDate" />
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.has("actions") && canReverse && (
                        <TableHead className="text-right">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.map((tx) => {
                      const isSelected = selectedIds.has(tx.transactionId);
                      return (
                        <TableRow
                          key={tx.transactionId}
                          className={cn(
                            "hover:bg-muted/50 transition-colors group",
                            isSelected && "bg-primary/5"
                          )}
                        >
                          {visibleColumns.has("select") && (
                            <TableCell className="w-10">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSelectOne(tx.transactionId)}
                                aria-label={`Select transaction ${tx.transactionId}`}
                              />
                            </TableCell>
                          )}
                          {visibleColumns.has("transactionId") && (
                            <TableCell className="font-mono text-xs font-semibold">
                              <div className="flex items-center gap-1.5">
                                TXN_{tx.transactionId}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => copyToClipboard(`TXN_${tx.transactionId}`)}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Copy ID</TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          )}
                          {visibleColumns.has("sender") && (
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{tx.senderName || "Unknown"}</p>
                                <p className="text-[11px] text-muted-foreground font-mono">
                                  {tx.senderAccountNumber}
                                </p>
                              </div>
                            </TableCell>
                          )}
                          {visibleColumns.has("arrow") && (
                            <TableCell>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </TableCell>
                          )}
                          {visibleColumns.has("receiver") && (
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{tx.receiverName || "Unknown"}</p>
                                <p className="text-[11px] text-muted-foreground font-mono">
                                  {tx.receiverAccountNumber}
                                </p>
                              </div>
                            </TableCell>
                          )}
                          {visibleColumns.has("amount") && (
                            <TableCell className="text-right font-mono font-semibold text-[hsl(var(--success))]">
                              {formatCurrency(tx.amount)}
                            </TableCell>
                          )}
                          {visibleColumns.has("status") && (
                            <TableCell>
                              <StatusBadge status={tx.status} />
                            </TableCell>
                          )}
                          {visibleColumns.has("date") && (
                            <TableCell className="text-xs text-muted-foreground">
                              {tx.transactionDate ? formatDateTime(tx.transactionDate) : "-"}
                            </TableCell>
                          )}
                          {visibleColumns.has("actions") && canReverse && (
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => setDetailTx(tx)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View Details</TooltipContent>
                                </Tooltip>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={tx.status !== "COMPLETED" || isReversing}
                                  onClick={() => openReverseDialog(tx)}
                                >
                                  Reverse
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}

                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={visibleColumns.size}
                          className="text-center py-16 text-muted-foreground"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                              <FilterX className="h-6 w-6 opacity-50" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">No transactions found</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Try adjusting your search or filters
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSearch("");
                                setActiveFilters({
                                  status: undefined,
                                  date: undefined,
                                  minAmount: undefined,
                                  maxAmount: undefined,
                                });
                              }}
                            >
                              Clear all filters
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Footer Pagination */}
              <div className="px-4 py-3 border-t border-border/60 flex items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground hidden sm:block">
                  Page <span className="font-medium text-foreground">{currentPage}</span> of{" "}
                  <span className="font-medium text-foreground">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || filtered.length === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8 text-xs"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
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
              </div>
            </>
          )}
        </div>

        {/* Reverse Dialog */}
        <Dialog open={reverseOpen} onOpenChange={setReverseOpen}>
          <DialogContent className="bg-background text-foreground border border-[var(--glass-border)] shadow-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reverse Transaction</DialogTitle>
              <DialogDescription>
                This creates a compensating entry and marks the original as reversed.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="rounded-xl border border-[var(--glass-border)] bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
                <p>
                  <span className="font-medium text-foreground">Transaction:</span> TXN_
                  {reverseTarget?.transactionId ?? "-"}
                </p>
                <p>
                  <span className="font-medium text-foreground">Amount:</span>{" "}
                  {reverseTarget ? formatCurrency(reverseTarget.amount) : "-"}
                </p>
                <p>
                  <span className="font-medium text-foreground">Sender:</span>{" "}
                  {reverseTarget?.senderName || "-"}
                </p>
                <p>
                  <span className="font-medium text-foreground">Receiver:</span>{" "}
                  {reverseTarget?.receiverName || "-"}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="reverse-reason">
                  Reason (optional)
                </label>
                <Textarea
                  id="reverse-reason"
                  rows={3}
                  placeholder="Add a short reversal reason"
                  value={reverseReason}
                  onChange={(e) => setReverseReason(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setReverseOpen(false)} disabled={reverseSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleReverse}
                disabled={reverseSubmitting || !reverseTarget || isReversing}
                variant="destructive"
              >
                {reverseSubmitting || isReversing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Reversing...
                  </>
                ) : (
                  "Confirm Reversal"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Drawer */}
        <Sheet open={!!detailTx} onOpenChange={() => setDetailTx(null)}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader className="space-y-1">
              <SheetTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                Transaction Details
              </SheetTitle>
              <SheetDescription>
                Full information for TXN_{detailTx?.transactionId}
              </SheetDescription>
            </SheetHeader>

            {detailTx && (
              <div className="mt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <StatusBadge status={detailTx.status} />
                  <span className="text-xs text-muted-foreground font-mono">
                    {detailTx.transactionDate ? formatDateTime(detailTx.transactionDate) : "-"}
                  </span>
                </div>

                <div className="rounded-2xl border border-[var(--glass-border)] bg-muted/20 p-6 text-center space-y-1">
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-3xl font-bold tracking-tight text-[hsl(var(--success))]">
                    {formatCurrency(detailTx.amount)}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sender</p>
                    <div className="rounded-xl border border-[var(--glass-border)] p-3 space-y-1">
                      <p className="text-sm font-medium">{detailTx.senderName || "Unknown"}</p>
                      <p className="text-xs font-mono text-muted-foreground">{detailTx.senderAccountNumber}</p>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Receiver</p>
                    <div className="rounded-xl border border-[var(--glass-border)] p-3 space-y-1">
                      <p className="text-sm font-medium">{detailTx.receiverName || "Unknown"}</p>
                      <p className="text-xs font-mono text-muted-foreground">{detailTx.receiverAccountNumber}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Metadata</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Transaction ID</p>
                      <p className="font-mono font-medium">TXN_{detailTx.transactionId}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Status</p>
                      <p className="font-medium">{detailTx.status}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => copyToClipboard(`TXN_${detailTx.transactionId}`)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy ID
                  </Button>
                  {canReverse && detailTx.status === "COMPLETED" && (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        setDetailTx(null);
                        openReverseDialog(detailTx);
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reverse
                    </Button>
                  )}
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </PageWrapper>
    </TooltipProvider>
  );
}
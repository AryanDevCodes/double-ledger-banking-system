import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import PageWrapper from "@/components/PageWrapper";
import PageHeader from "@/components/PageHeader";
import ExportMenu from "@/components/ExportMenu";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import DataTableToolbar from "@/components/DataTableToolbar";
import EmptyState from "@/components/EmptyState";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import { Can } from "@/components/PermissionGate";
import { TableSkeleton } from "@/components/LoadingStates";

import { upiApi, accountApi, getApiErrorMessage } from "@/lib/api-client";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export";
import { formatDate } from "@/lib/format";
import { ROLES, hasPermission } from "@/lib/rbac";
import { useAuth } from "@/contexts/AuthContext";

import type { UpiProfileResponseDTO, AccountResponseDTO } from "@/types/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Ban, CheckCircle2, ChevronLeft, ChevronRight, Copy, Plus, QrCode, RefreshCw, Smartphone, Trash2 } from "lucide-react";

const upiSchema = z.object({
  upiId: z.string().min(3, "UPI ID is required"),
  accountNumber: z.string().min(1, "Select an account"),
});

type UpiValues = z.infer<typeof upiSchema>;

export default function UpiPage() {
  const { user } = useAuth();
  const roles = user?.roles || [];

  const staffRoleSet = useMemo(
    () => new Set<string>([ROLES.ADMIN, ROLES.MANAGER, ROLES.CUSTOMER_MANAGER, ROLES.AUDITOR]),
    [],
  );

  const isCustomerOnly = roles.includes(ROLES.USER) && !roles.some((role) => staffRoleSet.has(role));
  const canCustomerOperateUpi = isCustomerOnly;
  const canEditOwn = hasPermission(roles, "UPI_EDIT_OWN");
  const canEditAll = hasPermission(roles, "UPI_EDIT_ALL");
  const canToggleStatus = canCustomerOperateUpi && (canEditOwn || canEditAll);
  const canGenerateQr = canCustomerOperateUpi && hasPermission(roles, "UPI_GENERATE_QR");
  const showBulkControls = canToggleStatus;

  const [profiles, setProfiles] = useState<UpiProfileResponseDTO[]>([]);
  const [accounts, setAccounts] = useState<AccountResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string | Date | undefined>>({
    status: undefined,
    bank: undefined,
  });
  const [open, setOpen] = useState(false);
  const [qrUpiId, setQrUpiId] = useState<string | undefined>(undefined);
  const [selectedUpiIds, setSelectedUpiIds] = useState<string[]>([]);
  const [deleteTargetUpi, setDeleteTargetUpi] = useState<string | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState<number>(() => {
    if (typeof window === "undefined") return 10;
    const saved = Number(localStorage.getItem("sb.upi.rowsPerPage") || "10");
    return [10, 20, 50].includes(saved) ? saved : 10;
  });
  const [currentPage, setCurrentPage] = useState(1);

  const form = useForm<UpiValues>({
    resolver: zodResolver(upiSchema),
    defaultValues: { upiId: "", accountNumber: "" },
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [profilesData, accountsData] = await Promise.all([
        isCustomerOnly ? upiApi.getMy() : upiApi.getAll(),
        isCustomerOnly ? accountApi.getMy() : accountApi.getAll(),
      ]);
      setProfiles(profilesData);
      setAccounts(accountsData);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load data"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchTerm = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      const matchesSearch =
        !searchTerm ||
        p.upiId.toLowerCase().includes(searchTerm) ||
        p.accountHolderName.toLowerCase().includes(searchTerm) ||
        p.accountNumber.toLowerCase().includes(searchTerm) ||
        p.bankName.toLowerCase().includes(searchTerm);
      const matchesStatus = !activeFilters.status || p.status === activeFilters.status;
      const matchesBank = !activeFilters.bank || p.bankName === activeFilters.bank;
      return matchesSearch && matchesStatus && matchesBank;
    });
  }, [profiles, searchTerm, activeFilters.status, activeFilters.bank]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sb.upi.rowsPerPage", String(rowsPerPage));
    }
  }, [rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeFilters.status, activeFilters.bank, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedProfiles = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, currentPage, rowsPerPage]);

  useEffect(() => {
    const validIds = new Set(filtered.map((p) => p.upiId));
    setSelectedUpiIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [filtered]);

  const activeCount = profiles.filter((p) => p.status === "ACTIVE").length;
  const inactiveCount = profiles.filter((p) => p.status !== "ACTIVE").length;
  const uniqueBanks = Array.from(new Set(profiles.map((p) => p.bankName).filter(Boolean))).sort();
  const upiCountByAccount = profiles.reduce<Record<string, number>>((acc, p) => {
    acc[p.accountNumber] = (acc[p.accountNumber] || 0) + 1;
    return acc;
  }, {});
  const nearLimitAccounts = Object.values(upiCountByAccount).filter((count) => count >= 3).length;
  const avgUpiPerAccount = accounts.length ? (profiles.length / accounts.length).toFixed(1) : "0.0";

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    try {
      const exportData = filtered.map((p) => ({
        "UPI ID": p.upiId,
        "Account Holder": p.accountHolderName,
        "Account Number": p.accountNumber,
        Bank: p.bankName,
        Status: p.status,
        Created: formatDate(p.createdAt),
      }));

      if (format === "csv") {
        exportToCSV(exportData, `upi-profiles-${new Date().toISOString().split("T")[0]}.csv`);
      } else if (format === "excel") {
        exportToExcel(exportData, `upi-profiles-${new Date().toISOString().split("T")[0]}.xlsx`, "UPI Profiles");
      } else {
        exportToPDF(exportData, "UPI Profiles Report");
      }
      toast.success(`Exported ${filtered.length} UPI profiles to ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to export UPI profiles"));
      console.error(error);
    }
  };

  const handleAdd = async (values: UpiValues) => {
    const count = upiCountByAccount[values.accountNumber] || 0;
    if (count >= 4) {
      toast.error("UPI limit reached for this account (max 4)");
      return;
    }

    try {
      await upiApi.register({ upiId: values.upiId, accountNumber: values.accountNumber });
      form.reset();
      setOpen(false);
      toast.success("UPI profile registered");
      loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to register UPI profile"));
      console.error(error);
    }
  };

  const toggleStatus = async (upiId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await upiApi.updateStatus(upiId, newStatus);
      toast.success("Status updated");
      loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update status"));
      console.error(error);
    }
  };

  const handleDelete = async (upiId: string) => {
    try {
      await upiApi.delete(upiId);
      toast.success("UPI profile deleted");
      setSelectedUpiIds((prev) => prev.filter((id) => id !== upiId));
      loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete UPI profile"));
      console.error(error);
    } finally {
      setDeleteTargetUpi(null);
    }
  };

  const copyUpiId = async (upiId: string) => {
    try {
      await navigator.clipboard.writeText(upiId);
      toast.success("UPI ID copied");
    } catch {
      toast.error("Failed to copy UPI ID");
    }
  };

  const allPageSelected =
    paginatedProfiles.length > 0 && paginatedProfiles.every((p) => selectedUpiIds.includes(p.upiId));

  const toggleSelectAllOnPage = (checked: boolean) => {
    const pageIds = paginatedProfiles.map((p) => p.upiId);
    setSelectedUpiIds((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, ...pageIds]));
      }
      const pageSet = new Set(pageIds);
      return prev.filter((id) => !pageSet.has(id));
    });
  };

  const toggleSelectOne = (upiId: string, checked: boolean) => {
    setSelectedUpiIds((prev) => {
      if (checked) return Array.from(new Set([...prev, upiId]));
      return prev.filter((id) => id !== upiId);
    });
  };

  const runBulkStatusUpdate = async (nextStatus: "ACTIVE" | "INACTIVE") => {
    if (selectedUpiIds.length === 0) {
      toast.info("Select at least one UPI profile");
      return;
    }

    try {
      setLoading(true);
      const tasks = selectedUpiIds.map((upiId) => upiApi.updateStatus(upiId, nextStatus));
      const results = await Promise.allSettled(tasks);
      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} profile(s) updated to ${nextStatus}`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} profile(s) failed to update`);
      }

      setSelectedUpiIds([]);
      await loadData();
    } catch (error) {
      toast.error("Bulk update failed");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <PageHeader
        title="UPI Management"
        subtitle="Manage UPI profiles and generate payment QR codes"
        icon={<Smartphone className="h-5 w-5" />}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <ExportMenu onExport={handleExport} disabled={loading || filtered.length === 0} />
            {canCustomerOperateUpi ? (
            <Can permission="UPI_CREATE">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-fuchsia-500 to-violet-600 shadow-md hover:from-fuchsia-600 hover:to-violet-700">
                    <Plus className="h-4 w-4 mr-2" /> Register UPI
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-panel border-[var(--glass-border)]">
                  <DialogHeader>
                    <DialogTitle>Register UPI Profile</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAdd)} className="grid gap-4 py-2">
                      <FormField
                        control={form.control}
                        name="upiId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UPI ID *</FormLabel>
                            <FormControl>
                              <Input placeholder="username@bank" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="accountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account *</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent>
                                  {accounts
                                    .filter((a: AccountResponseDTO) => a.status === "ACTIVE")
                                    .map((a: AccountResponseDTO) => (
                                      <SelectItem
                                        key={a.accountNumber}
                                        value={a.accountNumber}
                                        disabled={(upiCountByAccount[a.accountNumber] || 0) >= 4}
                                      >
                                        {a.customerName} — {a.accountNumber}
                                        {(upiCountByAccount[a.accountNumber] || 0) >= 4 ? " (limit reached)" : ""}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <p className="text-xs text-muted-foreground">
                        Max 4 UPI IDs per account. Deactivate or delete one to add another.
                      </p>
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-fuchsia-500 to-violet-600 shadow-md hover:from-fuchsia-600 hover:to-violet-700"
                        disabled={form.formState.isSubmitting}
                      >
                        {form.formState.isSubmitting ? "Registering..." : "Register Profile"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </Can>
            ) : null}
          </>
        }
      />

      <div className="module-hero module-hero--upi mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">UPI Workspace</p>
            <p className="text-sm text-foreground/90 mt-1">Control identity rails, status governance, and QR-ready payment surfaces.</p>
          </div>
          <div className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground">
            Profile + Status + QR Operations
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3 mb-6">
        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
          <StatCard
            title="Total UPI"
            value={profiles.length}
            subtitle={`${activeCount} active`}
            icon={<Smartphone className="h-5 w-5" />}
            compact={false}
          />
          <StatCard
            title="Linked Accounts"
            value={accounts.length}
            subtitle="Available"
            icon={<QrCode className="h-5 w-5" />}
            compact={false}
          />
          <StatCard
            title="Active"
            value={activeCount}
            subtitle="Ready to use"
            icon={<CheckCircle2 className="h-5 w-5" />}
            compact={false}
          />
          <StatCard
            title="Inactive"
            value={inactiveCount}
            subtitle="Needs attention"
            icon={<Ban className="h-5 w-5" />}
            compact={false}
          />
        </div>

        <div className="panel-luxe p-5 space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Capacity Control</p>
            <p className="text-xl font-semibold mt-1">UPI utilization</p>
            <p className="text-xs text-muted-foreground mt-1">
              {profiles.length} of {accounts.length * 4 || 0} slots used
            </p>
          </div>
          <Progress value={accounts.length ? Math.min(100, (profiles.length / (accounts.length * 4)) * 100) : 0} />

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="rounded-xl border border-border/60 bg-background/55 p-3">
              <p className="text-[11px] uppercase tracking-[0.11em] text-muted-foreground">Avg / Account</p>
              <p className="text-2xl font-semibold mt-1">{avgUpiPerAccount}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/55 p-3">
              <p className="text-[11px] uppercase tracking-[0.11em] text-muted-foreground">Near Limit</p>
              <p className="text-2xl font-semibold mt-1">{nearLimitAccounts}</p>
              <p className="text-[11px] text-muted-foreground mt-1">3+ UPI IDs</p>
            </div>
          </div>
        </div>
      </div>

      {!canCustomerOperateUpi ? (
        <div className="panel-luxe border-l-4 border-l-amber-500 p-5 mb-6">
          <p className="text-sm font-semibold">Read-only UPI mode</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
            Staff roles can audit UPI profiles and exports, but cannot register UPI IDs, change status, or generate QR codes.
          </p>
        </div>
      ) : null}

      <Tabs defaultValue="profiles" className="space-y-6">
        <TabsList className={`tabs-luxe grid w-full max-w-md ${canGenerateQr ? "grid-cols-2" : "grid-cols-1"}`}>
          <TabsTrigger value="profiles">UPI Profiles</TabsTrigger>
          {canGenerateQr ? (
            <TabsTrigger value="qr">
              <QrCode className="h-4 w-4 mr-2" />QR Generator
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="profiles" className="space-y-4">
          <div className="data-table-shell">
            <div className="p-4 border-b border-[var(--glass-border)] bg-gradient-to-r from-[var(--accent-primary)]/8 to-transparent">
              <DataTableToolbar
                searchPlaceholder="Search UPI..."
                searchValue={search}
                onSearchChange={setSearch}
                filters={[
                  {
                    key: "status",
                    label: "Status",
                    type: "select",
                    options: [
                      { label: "Active", value: "ACTIVE" },
                      { label: "Inactive", value: "INACTIVE" },
                    ],
                  },
                  {
                    key: "bank",
                    label: "Bank",
                    type: "select",
                    options: uniqueBanks.map((b) => ({ label: b, value: b })),
                  },
                ]}
                activeFilters={activeFilters}
                onFilterChange={(key, value) => setActiveFilters((prev) => ({ ...prev, [key]: value }))}
                onClearFilters={() => setActiveFilters({ status: undefined, bank: undefined })}
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                {showBulkControls ? (
                  <p className="text-xs text-muted-foreground">
                    Selected: <span className="font-medium text-foreground">{selectedUpiIds.length}</span>
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{filtered.length}</span> profile(s)
                  </p>
                )}

                <div className="flex items-center gap-2">
                  {showBulkControls ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={selectedUpiIds.length === 0 || loading}
                        onClick={() => runBulkStatusUpdate("ACTIVE")}
                      >
                        Activate selected
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={selectedUpiIds.length === 0 || loading}
                        onClick={() => runBulkStatusUpdate("INACTIVE")}
                      >
                        Deactivate selected
                      </Button>
                    </>
                  ) : null}

                  <Select value={String(rowsPerPage)} onValueChange={(value) => setRowsPerPage(Number(value))}>
                    <SelectTrigger className="h-8 w-[98px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50].map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}/page
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {loading ? (
              <TableSkeleton columns={showBulkControls ? 8 : 7} rows={6} className="p-2" />
            ) : filtered.length === 0 ? (
              <EmptyState type={search || Object.values(activeFilters).some(Boolean) ? "search" : "upi"} />
            ) : (
              <>
              <div className="overflow-x-auto">
              <Table className="min-w-[980px]">
                <TableHeader className="bg-card/80 backdrop-blur-xl">
                  <TableRow>
                    {showBulkControls ? (
                      <TableHead className="w-[42px]">
                        <Checkbox
                          checked={allPageSelected}
                          onCheckedChange={(checked) => toggleSelectAllOnPage(checked === true)}
                          aria-label="Select all profiles on this page"
                        />
                      </TableHead>
                    ) : null}
                    <TableHead>UPI ID</TableHead>
                    <TableHead>Account Holder</TableHead>
                    <TableHead>Account No.</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProfiles.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/35 transition-colors">
                      {showBulkControls ? (
                        <TableCell>
                          <Checkbox
                            checked={selectedUpiIds.includes(p.upiId)}
                            onCheckedChange={(checked) => toggleSelectOne(p.upiId, checked === true)}
                            aria-label={`Select ${p.upiId}`}
                          />
                        </TableCell>
                      ) : null}
                      <TableCell className="font-mono text-sm font-medium">{p.upiId}</TableCell>
                      <TableCell>{p.accountHolderName}</TableCell>
                      <TableCell className="font-mono text-xs">{p.accountNumber}</TableCell>
                      <TableCell>{p.bankName}</TableCell>
                      <TableCell>
                        {canToggleStatus ? (
                          <button
                            type="button"
                            onClick={() => toggleStatus(p.upiId, p.status)}
                            className="cursor-pointer"
                          >
                            <StatusBadge status={p.status} />
                          </button>
                        ) : (
                          <StatusBadge status={p.status} />
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => copyUpiId(p.upiId)} title="Copy UPI ID">
                            <Copy className="h-4 w-4" />
                          </Button>
                          {canEditAll ? (
                            <Button variant="ghost" size="sm" onClick={() => setDeleteTargetUpi(p.upiId)} title="Delete UPI profile">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              <div className="border-t border-border/60 px-4 py-3 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
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
                  disabled={currentPage >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              </>
            )}
          </div>
        </TabsContent>

        {canGenerateQr ? (
          <TabsContent value="qr" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <QRCodeGenerator upiId={qrUpiId} />
              <div className="space-y-4">
                <div className="glass-panel rounded-2xl p-6 bg-gradient-to-br from-primary/10 to-primary/5">

                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-primary" />
                    Your UPI IDs
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {profiles
                      .filter((p) => p.status === "ACTIVE")
                      .map((p) => (
                        <div
                          key={p.id}
                          className="cursor-pointer rounded-xl border border-border/70 bg-card/60 p-3 transition-colors hover:border-primary"
                          onClick={() => setQrUpiId(p.upiId)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-mono text-sm font-medium">{p.upiId}</p>
                              <p className="text-xs text-muted-foreground mt-1">{p.accountHolderName}</p>
                              <p className="text-xs text-muted-foreground">{p.bankName}</p>
                            </div>
                            <StatusBadge status={p.status} />
                          </div>
                        </div>
                      ))}
                    {profiles.filter((p) => p.status === "ACTIVE").length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No active UPI profiles</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        ) : null}
      </Tabs>

      <AlertDialog open={!!deleteTargetUpi} onOpenChange={(openState) => !openState && setDeleteTargetUpi(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete UPI profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This action deactivates the selected UPI profile and revokes payment access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTargetUpi) {
                  handleDelete(deleteTargetUpi);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
}

import { useState, useEffect } from "react";
import PageWrapper from "@/components/PageWrapper";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import DataTableToolbar from "@/components/DataTableToolbar";
import EmptyState from "@/components/EmptyState";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import { Can } from "@/components/PermissionGate";
import { upiApi, accountApi } from "@/lib/api-client";
import { ApiError } from "@/lib/api-client";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export";
import { formatDate } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  RefreshCw,
  QrCode,
  Smartphone,
  CheckCircle2,
  Ban,
  Trash2,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import type { UpiProfileResponseDTO, AccountResponseDTO } from "@/types/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES, hasPermission } from "@/lib/rbac";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UpiPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<UpiProfileResponseDTO[]>([]);
  const [accounts, setAccounts] = useState<AccountResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string | Date | undefined>>({
    status: undefined,
    bank: undefined,
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ upiId: "", accountNumber: "" });
  const [qrUpiId, setQrUpiId] = useState<string | undefined>(undefined);

  const roles = user?.roles || [];
  const staffRoleSet = new Set<string>([ROLES.ADMIN, ROLES.MANAGER, ROLES.CUSTOMER_MANAGER, ROLES.AUDITOR]);
  const isCustomerOnly = roles.includes(ROLES.USER) && !roles.some((role) => staffRoleSet.has(role));
  const canEditOwn = hasPermission(roles, "UPI_EDIT_OWN");
  const canEditAll = hasPermission(roles, "UPI_EDIT_ALL");
  const canToggleStatus = canEditOwn || canEditAll;

  useEffect(() => {
    loadData();
  }, [isCustomerOnly]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (isCustomerOnly) {
        const [accountsData, upiData] = await Promise.all([
          accountApi.getMy(),
          upiApi.getMy(),
        ]);
        setAccounts(accountsData);
        setProfiles(upiData);
      } else {
        const [upiData, accountsData] = await Promise.all([
          upiApi.getAll(),
          accountApi.getAll()
        ]);
        setProfiles(upiData);
        setAccounts(accountsData);
      }
    } catch (error) {
      toast.error("Failed to load data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const searchTerm = search.trim().toLowerCase();
  const filtered = profiles.filter((p) => {
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

  const activeCount = profiles.filter((p) => p.status === "ACTIVE").length;
  const inactiveCount = profiles.filter((p) => p.status !== "ACTIVE").length;
  const uniqueBanks = Array.from(new Set(profiles.map((p) => p.bankName).filter(Boolean))).sort();
  const upiCountByAccount = profiles.reduce<Record<string, number>>((acc, p) => {
    acc[p.accountNumber] = (acc[p.accountNumber] || 0) + 1;
    return acc;
  }, {});

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
      toast.error("Failed to export UPI profiles");
      console.error(error);
    }
  };

  const handleAdd = async () => {
    if (!form.upiId || !form.accountNumber) {
      toast.error("Please fill all fields");
      return;
    }

    const count = upiCountByAccount[form.accountNumber] || 0;
    if (count >= 4) {
      toast.error("UPI limit reached for this account (max 4)");
      return;
    }

    try {
      await upiApi.register({
        upiId: form.upiId,
        accountNumber: form.accountNumber,
      });
      setForm({ upiId: "", accountNumber: "" });
      setOpen(false);
      toast.success("UPI profile registered");
      loadData();
    } catch (error) {
      const message = error instanceof ApiError && (error.data as any)?.message
        ? (error.data as any).message
        : error instanceof Error
          ? error.message
          : "Failed to register UPI profile";
      toast.error(message);
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
      toast.error("Failed to update status");
      console.error(error);
    }
  };

  const handleDelete = async (upiId: string) => {
    const confirmed = window.confirm("Delete this UPI profile? This will deactivate access.");
    if (!confirmed) return;
    try {
      await upiApi.delete(upiId);
      toast.success("UPI profile deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete UPI profile");
      console.error(error);
    }
  };

  return (
    <PageWrapper>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">UPI Management</h1>
          <p className="page-subtitle">Manage UPI profiles and generate payment QR codes</p>
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
          <Can permission="UPI_CREATE">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  <Plus className="h-4 w-4 mr-2" /> Register UPI
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Register UPI Profile</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="space-y-1.5">
                    <Label>UPI ID *</Label>
                    <Input placeholder="username@bank" value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Account *</Label>
                    <Select value={form.accountNumber} onValueChange={(v) => setForm({ ...form, accountNumber: v })}>
                      <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                      <SelectContent>
                        {accounts.filter(a => a.status === "ACTIVE").map((a) => (
                          <SelectItem key={a.accountNumber} value={a.accountNumber} disabled={(upiCountByAccount[a.accountNumber] || 0) >= 4}>
                            {a.customerName} — {a.accountNumber}
                            {(upiCountByAccount[a.accountNumber] || 0) >= 4 ? " (limit reached)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">Max 4 UPI IDs per account. Deactivate or delete one to add another.</p>
                  <Button onClick={handleAdd} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    Register Profile
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </Can>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total UPI"
          value={profiles.length}
          subtitle={`${activeCount} active`}
          icon={<Smartphone className="h-5 w-5" />}
        />
        <StatCard
          title="Active"
          value={activeCount}
          subtitle="Ready to use"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          title="Inactive"
          value={inactiveCount}
          subtitle="Needs attention"
          icon={<Ban className="h-5 w-5" />}
        />
        <StatCard
          title="Linked Accounts"
          value={accounts.length}
          subtitle="Available"
          icon={<QrCode className="h-5 w-5" />}
        />
      </div>

      <Tabs defaultValue="profiles" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="profiles">UPI Profiles</TabsTrigger>
          <TabsTrigger value="qr"><QrCode className="h-4 w-4 mr-2" />QR Generator</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-4">
          <div className="glass-card">
            <div className="p-4 border-b border-border">
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
            </div>
            {filtered.length === 0 ? (
              <EmptyState type={search || Object.values(activeFilters).some(Boolean) ? "search" : "upi"} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
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
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm font-medium">{p.upiId}</TableCell>
                      <TableCell>{p.accountHolderName}</TableCell>
                      <TableCell className="font-mono text-xs">{p.accountNumber}</TableCell>
                      <TableCell>{p.bankName}</TableCell>
                      <TableCell>
                        {canToggleStatus ? (
                          <button onClick={() => toggleStatus(p.upiId, p.status)} className="cursor-pointer">
                            <StatusBadge status={p.status} />
                          </button>
                        ) : (
                          <StatusBadge status={p.status} />
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {canEditAll && (
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(p.upiId)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="qr" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <QRCodeGenerator upiId={qrUpiId} />
            <div className="space-y-4">
              <div className="glass-card p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-purple-600" />
                  Your UPI IDs
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {profiles.filter(p => p.status === "ACTIVE").map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
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
                  {profiles.filter(p => p.status === "ACTIVE").length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No active UPI profiles</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}

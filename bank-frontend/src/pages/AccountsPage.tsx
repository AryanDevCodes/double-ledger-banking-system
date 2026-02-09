import { useState, useEffect } from "react";
import PageWrapper from "@/components/PageWrapper";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import DataTableToolbar from "@/components/DataTableToolbar";
import EmptyState from "@/components/EmptyState";
import { accountApi, bankApi } from "@/lib/api-client";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export";
import { formatCurrency } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, RefreshCw, Download, FileSpreadsheet, FileText, Users, Wallet, Landmark } from "lucide-react";
import type { AccountResponseDTO, BankResponseDTO } from "@/types/api";
import { toast } from "sonner";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountResponseDTO[]>([]);
  const [banks, setBanks] = useState<BankResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string | Date | undefined>>({
    status: undefined,
    bank: undefined,
    currency: undefined,
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ 
    bankName: "", 
    fullName: "", 
    email: "", 
    phoneNumber: "", 
    age: "",
    address: "",
    initialDeposit: "" 
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsData, banksData] = await Promise.all([
        accountApi.getAll(),
        bankApi.getAll()
      ]);
      setAccounts(accountsData);
      setBanks(banksData);
    } catch (error) {
      toast.error("Failed to load data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const searchTerm = search.trim().toLowerCase();
  const filtered = accounts.filter((a) => {
    const matchesSearch =
      !searchTerm ||
      a.accountNumber.toLowerCase().includes(searchTerm) ||
      a.customerName.toLowerCase().includes(searchTerm) ||
      a.bankName.toLowerCase().includes(searchTerm);
    const matchesStatus = !activeFilters.status || a.status === activeFilters.status;
    const matchesBank = !activeFilters.bank || a.bankName === activeFilters.bank;
    const matchesCurrency = !activeFilters.currency || a.currencyCode === activeFilters.currency;
    return matchesSearch && matchesStatus && matchesBank && matchesCurrency;
  });

  const handleAdd = async () => {
    if (!form.bankName || !form.fullName || !form.email || !form.phoneNumber) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await accountApi.create(form.bankName, {
        initialDeposit: form.initialDeposit ? parseFloat(form.initialDeposit) : undefined,
        customer: {
          fullName: form.fullName,
          email: form.email,
          phoneNumber: form.phoneNumber,
          age: form.age ? parseInt(form.age) : undefined,
          address: form.address || undefined,
        }
      });
      setForm({ bankName: "", fullName: "", email: "", phoneNumber: "", age: "", address: "", initialDeposit: "" });
      setOpen(false);
      toast.success("Account created successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to create account");
      console.error(error);
    }
  };

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const activeAccounts = accounts.filter((a) => a.status === "ACTIVE").length;
  const avgBalance = accounts.length ? totalBalance / accounts.length : 0;
  const uniqueBanks = Array.from(new Set(accounts.map((a) => a.bankName).filter(Boolean))).sort();
  const uniqueCurrencies = Array.from(new Set(accounts.map((a) => a.currencyCode).filter(Boolean))).sort();

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    try {
      const exportData = filtered.map((a) => ({
        "Account No.": a.accountNumber,
        Customer: a.customerName,
        Bank: a.bankName,
        Balance: a.balance,
        Currency: a.currencyCode,
        Status: a.status,
      }));

      if (format === "csv") {
        exportToCSV(exportData, `accounts-${new Date().toISOString().split("T")[0]}.csv`);
      } else if (format === "excel") {
        exportToExcel(exportData, `accounts-${new Date().toISOString().split("T")[0]}.xlsx`, "Accounts");
      } else {
        exportToPDF(exportData, "Accounts Report");
      }
      toast.success(`Exported ${filtered.length} accounts to ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to export accounts");
      console.error(error);
    }
  };

  return (
    <PageWrapper>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Accounts</h1>
          <p className="page-subtitle">
            {accounts.length} accounts · Total balance: {formatCurrency(totalBalance)}
          </p>
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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Open Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Open New Account</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="space-y-1.5">
                  <Label>Bank *</Label>
                  <Select value={form.bankName} onValueChange={(v) => setForm({ ...form, bankName: v })}>
                    <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
                    <SelectContent>
                      {banks.map((b) => (
                        <SelectItem key={b.id} value={b.bankName}>{b.bankName} — {b.branch}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Full Name *</Label>
                  <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone Number *</Label>
                  <Input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Age</Label>
                  <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Address</Label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Initial Deposit (₹)</Label>
                  <Input type="number" value={form.initialDeposit} onChange={(e) => setForm({ ...form, initialDeposit: e.target.value })} />
                </div>
                <Button onClick={handleAdd}>Create Account</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Accounts"
          value={accounts.length}
          subtitle={`${activeAccounts} active`}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Total Balance"
          value={formatCurrency(totalBalance)}
          subtitle="Across all accounts"
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          title="Average Balance"
          value={formatCurrency(avgBalance)}
          subtitle={accounts.length ? "Per account" : "No accounts yet"}
          icon={<Landmark className="h-5 w-5" />}
        />
      </div>

      <div className="glass-card">
        <div className="p-4 border-b border-border">
          <DataTableToolbar
            searchPlaceholder="Search accounts..."
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
                  { label: "Frozen", value: "FROZEN" },
                ],
              },
              {
                key: "bank",
                label: "Bank",
                type: "select",
                options: uniqueBanks.map((b) => ({ label: b, value: b })),
              },
              {
                key: "currency",
                label: "Currency",
                type: "select",
                options: uniqueCurrencies.map((c) => ({ label: c, value: c })),
              },
            ]}
            activeFilters={activeFilters}
            onFilterChange={(key, value) => setActiveFilters((prev) => ({ ...prev, [key]: value }))}
            onClearFilters={() => setActiveFilters({ status: undefined, bank: undefined, currency: undefined })}
          />
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            type={search || Object.values(activeFilters).some(Boolean) ? "search" : "accounts"}
            action={{ label: "Open Account", onClick: () => setOpen(true) }}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account No.</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.accountNumber}>
                  <TableCell className="font-mono text-xs">{a.accountNumber}</TableCell>
                  <TableCell className="font-medium">{a.customerName}</TableCell>
                  <TableCell className="text-sm">{a.bankName}</TableCell>
                  <TableCell className="text-right font-mono font-medium">{formatCurrency(a.balance)}</TableCell>
                  <TableCell>{a.currencyCode}</TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </PageWrapper>
  );
}

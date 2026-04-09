import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PageWrapper from "@/components/PageWrapper";
import PageHeader from "@/components/PageHeader";
import ExportMenu from "@/components/ExportMenu";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus, RefreshCw, Users, Wallet, Landmark, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PasswordStrength } from "@/components/PasswordStrength";
import { TableSkeleton } from "@/components/LoadingStates";
import type { AccountResponseDTO, BankResponseDTO } from "@/types/api";
import { toast } from "sonner";

const accountSchema = z.object({
  bankName: z.string().min(1, "Select a bank"),
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  phoneNumber: z.string().min(7, "Phone number is required"),
  username: z.string().optional(),
  password: z
    .string()
    .optional()
    .refine((value) => !value || value.length >= 8, { message: "Password must be at least 8 characters" }),
  age: z
    .string()
    .optional()
    .refine((value) => !value || (!isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= 120), {
      message: "Enter a valid age",
    }),
  address: z.string().optional(),
  initialDeposit: z
    .string()
    .optional()
    .refine((value) => !value || (!isNaN(Number(value)) && Number(value) >= 0), {
      message: "Initial deposit must be a positive number",
    }),
});

type AccountValues = z.infer<typeof accountSchema>;

const complianceSchema = z.object({
  accountStatus: z.enum(["ACTIVE", "INACTIVE", "CLOSED"]),
  kycStatus: z.enum(["PENDING", "COMPLETED", "FAILED"]),
  customerStatus: z.enum(["ACTIVE", "INACTIVE"]),
});

type ComplianceValues = z.infer<typeof complianceSchema>;

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
  const [complianceOpen, setComplianceOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountResponseDTO | null>(null);
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
    },
  });

  const complianceForm = useForm<ComplianceValues>({
    resolver: zodResolver(complianceSchema),
    defaultValues: {
      accountStatus: "ACTIVE",
      kycStatus: "PENDING",
      customerStatus: "ACTIVE",
    },
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
      form.reset();
      setOpen(false);
      if (response?.temporaryPassword) {
        toast.success(`Account created. Temporary password: ${response.temporaryPassword}`);
      } else {
        toast.success("Account created successfully");
      }
      loadData();
    } catch (error) {
      toast.error("Failed to create account");
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
    setComplianceOpen(true);
  };

  const handleComplianceUpdate = async (values: ComplianceValues) => {
    if (!selectedAccount) return;

    try {
      await accountApi.updateCompliance(selectedAccount.accountNumber, {
        accountStatus: values.accountStatus,
        kycStatus: values.kycStatus,
        customerStatus: values.customerStatus,
      });
      toast.success("Account compliance and KYC updated");
      setComplianceOpen(false);
      setSelectedAccount(null);
      await loadData();
    } catch (error) {
      toast.error("Failed to update compliance details");
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
      <PageHeader
        title="Accounts"
        subtitle={
          <>
            {accounts.length} accounts · Total balance: {formatCurrency(totalBalance)}
          </>
        }
        icon={<Wallet className="h-5 w-5" />}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <ExportMenu onExport={handleExport} disabled={loading || filtered.length === 0} />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Open Account</Button>
              </SheetTrigger>
              <SheetContent className="w-[480px] sm:w-[540px] overflow-y-auto border-l border-border/70 bg-card/95 backdrop-blur-xl">
                <SheetHeader>
                  <SheetTitle>Open New Account</SheetTitle>
                </SheetHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleAdd)} className="mt-4 space-y-6">
                  <div className="grid grid-cols-1 gap-3">
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank *</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
                              <SelectContent>
                                {banks.map((b) => (
                                  <SelectItem key={b.id} value={b.bankName}>{b.bankName} — {b.branch}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Defaults to email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password (optional)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Generate secure password if empty"
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-1 top-1/2 -translate-y-1/2"
                                  onClick={() => setShowPassword((prev) => !prev)}
                                  aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormDescription>Leave empty to auto-generate a secure temporary password.</FormDescription>
                            <PasswordStrength password={field.value || ""} />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="initialDeposit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Initial Deposit (₹)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? "Creating..." : "Create Account"}
                    </Button>
                  </div>
                  </form>
                </Form>
              </SheetContent>
            </Sheet>
          </>
        }
      />

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

      <div className="glass-elevated">
        <div className="p-4 border-b border-border/70 bg-gradient-to-r from-primary/10 to-transparent">
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
        {loading ? (
          <TableSkeleton columns={7} rows={6} className="p-2" />
        ) : filtered.length === 0 ? (
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
                <TableHead>KYC</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.accountNumber} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs">{a.accountNumber}</TableCell>
                  <TableCell className="font-medium">{a.customerName}</TableCell>
                  <TableCell className="text-sm">{a.bankName}</TableCell>
                  <TableCell className="text-right font-mono font-medium">{formatCurrency(a.balance)}</TableCell>
                  <TableCell>{a.currencyCode}</TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                  <TableCell><StatusBadge status={a.kycStatus || "PENDING"} /></TableCell>
                  <TableCell><StatusBadge status={a.customerStatus || "ACTIVE"} /></TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => openComplianceEditor(a)}>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Verify KYC
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={complianceOpen} onOpenChange={setComplianceOpen}>
        <DialogContent className="border-border/70 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Account Compliance Verification</DialogTitle>
            <DialogDescription>
              Verify and update KYC/customer compliance for {selectedAccount?.accountNumber || "selected account"}.
            </DialogDescription>
          </DialogHeader>

          <Form {...complianceForm}>
            <form onSubmit={complianceForm.handleSubmit(handleComplianceUpdate)} className="space-y-4">
              <FormField
                control={complianceForm.control}
                name="accountStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Status</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                          <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                          <SelectItem value="CLOSED">CLOSED</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={complianceForm.control}
                name="kycStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KYC Verification</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select KYC status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">PENDING</SelectItem>
                          <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                          <SelectItem value="FAILED">FAILED</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={complianceForm.control}
                name="customerStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Status</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                          <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setComplianceOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={complianceForm.formState.isSubmitting}>
                  {complianceForm.formState.isSubmitting ? "Updating..." : "Update Verification"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}

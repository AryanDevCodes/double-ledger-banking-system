import { useState, useEffect } from "react";
import PageWrapper from "@/components/PageWrapper";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import DataTableToolbar from "@/components/DataTableToolbar";
import EmptyState from "@/components/EmptyState";
import { customerApi } from "@/lib/api-client";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Plus, Users, Download, MoreHorizontal, Eye, Pencil, RefreshCw, FileText, FileSpreadsheet, ShieldCheck, UserCheck } from "lucide-react";
import type { CustomerResponseDTO } from "@/types/api";
import { toast } from "sonner";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string | Date | undefined>>({
    kycStatus: undefined,
    customerStatus: undefined,
  });
  const [open, setOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerResponseDTO | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", phoneNumber: "", address: "", age: "" });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerApi.getAll();
      setCustomers(data);
    } catch (error) {
      toast.error("Failed to load customers");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const searchTerm = search.trim().toLowerCase();
  const filtered = customers.filter((c) => {
    const matchesSearch =
      !searchTerm ||
      c.fullName.toLowerCase().includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm) ||
      c.phoneNumber.toLowerCase().includes(searchTerm);
    const matchesKyc = !activeFilters.kycStatus || c.kycStatus === activeFilters.kycStatus;
    const matchesStatus = !activeFilters.customerStatus || c.customerStatus === activeFilters.customerStatus;
    return matchesSearch && matchesKyc && matchesStatus;
  });

  const resetForm = () => {
    setForm({ fullName: "", email: "", phoneNumber: "", address: "", age: "" });
    setEditingCustomer(null);
  };

  const handleAdd = async () => {
    if (!form.fullName || !form.email || !form.phoneNumber) {
      toast.error("Please fill all required fields");
      return;
    }
    
    try {
      if (editingCustomer) {
        await customerApi.update(
          editingCustomer.fullName,
          editingCustomer.email,
          editingCustomer.phoneNumber,
          {
            fullName: form.fullName,
            email: form.email,
            phoneNumber: form.phoneNumber,
            address: form.address || undefined,
            age: form.age ? parseInt(form.age) : undefined,
          }
        );
        toast.success("Customer updated successfully");
      } else {
        // Note: The API doesn't have a create endpoint, customers are created with accounts
        toast.info("Customers are created when opening accounts");
      }
      resetForm();
      setOpen(false);
      loadCustomers();
    } catch (error) {
      toast.error(editingCustomer ? "Failed to update customer" : "Failed to create customer");
      console.error(error);
    }
  };

  const handleEdit = (customer: CustomerResponseDTO) => {
    setEditingCustomer(customer);
    setForm({
      fullName: customer.fullName,
      email: customer.email,
      phoneNumber: customer.phoneNumber,
      address: customer.address || "",
      age: customer.age?.toString() || "",
    });
    setOpen(true);
  };

  const kycVerified = customers.filter(
    (c) => c.kycStatus === "COMPLETED" || c.kycStatus === "SUCCESS" || c.kycStatus === "ACTIVE"
  ).length;
  const activeCustomers = customers.filter((c) => c.customerStatus === "ACTIVE").length;
  const kycOptions = Array.from(new Set(customers.map((c) => c.kycStatus).filter(Boolean))).map((v) => ({
    label: v,
    value: v,
  }));
  const statusOptions = Array.from(new Set(customers.map((c) => c.customerStatus).filter(Boolean))).map((v) => ({
    label: v,
    value: v,
  }));

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    try {
      const exportData = filtered.map((c) => ({
        ID: c.id,
        Name: c.fullName,
        Email: c.email,
        Phone: c.phoneNumber,
        "KYC Status": c.kycStatus,
        "Customer Status": c.customerStatus,
        Accounts: c.accountNumbers?.length ?? 0,
      }));

      if (format === "csv") {
        exportToCSV(exportData, `customers-${new Date().toISOString().split("T")[0]}.csv`);
      } else if (format === "excel") {
        exportToExcel(exportData, `customers-${new Date().toISOString().split("T")[0]}.xlsx`, "Customers");
      } else {
        exportToPDF(exportData, "Customers Report");
      }
      toast.success(`Exported ${filtered.length} customers to ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to export customers");
      console.error(error);
    }
  };

  return (
    <PageWrapper>
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users className="h-6 w-6" />
            Customers
          </h1>
          <p className="page-subtitle">Customer lifecycle management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadCustomers} disabled={loading}>
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
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Customer</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                {([ ["fullName", "Full Name *"], ["email", "Email *"], ["phoneNumber", "Phone *"], ["address", "Address"], ["age", "Age"] ] as const).map(([field, label]) => (
                  <div key={field} className="space-y-1.5">
                    <Label>{label}</Label>
                    <Input value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} type={field === "age" ? "number" : "text"} />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
                <Button onClick={handleAdd}>{editingCustomer ? "Save Changes" : "Create Customer"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Customers"
          value={customers.length}
          subtitle={`${activeCustomers} active`}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="KYC Verified"
          value={kycVerified}
          subtitle={`${customers.length - kycVerified} pending`}
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <StatCard
          title="Active Customers"
          value={activeCustomers}
          subtitle="Customer status"
          icon={<UserCheck className="h-5 w-5" />}
        />
      </div>

      <div className="glass-card">
        <div className="p-4 border-b border-border">
          <DataTableToolbar
            searchPlaceholder="Search customers..."
            searchValue={search}
            onSearchChange={setSearch}
            filters={[
              { key: "kycStatus", label: "KYC Status", type: "select", options: kycOptions },
              { key: "customerStatus", label: "Customer Status", type: "select", options: statusOptions },
            ]}
            activeFilters={activeFilters}
            onFilterChange={(key, value) => setActiveFilters((prev) => ({ ...prev, [key]: value }))}
            onClearFilters={() => setActiveFilters({ kycStatus: undefined, customerStatus: undefined })}
          />
        </div>
        
        {filtered.length === 0 ? (
          <EmptyState 
            type={search || Object.values(activeFilters).some(Boolean) ? "search" : "customers"} 
            action={!search ? { label: "Add Customer", onClick: () => setOpen(true) } : undefined}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Accounts</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.id}</TableCell>
                  <TableCell className="font-medium">{c.fullName}</TableCell>
                  <TableCell className="text-sm">{c.email}</TableCell>
                  <TableCell className="text-sm font-mono">{c.phoneNumber}</TableCell>
                  <TableCell><StatusBadge status={c.kycStatus} /></TableCell>
                  <TableCell><StatusBadge status={c.customerStatus} /></TableCell>
                  <TableCell>{c.accountNumbers?.length ?? 0}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.info(`Viewing ${c.fullName}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(c)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="text-xs text-muted-foreground text-center mt-4">
        Showing {filtered.length} of {customers.length} customers
      </div>
    </PageWrapper>
  );
}

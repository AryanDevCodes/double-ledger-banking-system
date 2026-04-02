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
import { customerApi } from "@/lib/api-client";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { TableSkeleton } from "@/components/LoadingStates";
import { Plus, Users, MoreHorizontal, Eye, Pencil, RefreshCw, ShieldCheck, UserCheck } from "lucide-react";
import type { CustomerResponseDTO } from "@/types/api";
import { toast } from "sonner";

const customerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  phoneNumber: z.string().min(7, "Phone number is required"),
  address: z.string().optional(),
  age: z
    .string()
    .optional()
    .refine((value) => !value || (!isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= 120), {
      message: "Enter a valid age",
    }),
});

type CustomerValues = z.infer<typeof customerSchema>;

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
  const form = useForm<CustomerValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      address: "",
      age: "",
    },
  });

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
    form.reset({ fullName: "", email: "", phoneNumber: "", address: "", age: "" });
    setEditingCustomer(null);
  };

  const handleSubmit = async (values: CustomerValues) => {
    try {
      if (editingCustomer) {
        await customerApi.update(
          editingCustomer.fullName,
          editingCustomer.email,
          editingCustomer.phoneNumber,
          {
            fullName: values.fullName,
            email: values.email,
            phoneNumber: values.phoneNumber,
            address: values.address || undefined,
            age: values.age ? parseInt(values.age) : undefined,
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
    form.reset({
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
      <PageHeader
        title="Customers"
        subtitle="Customer lifecycle management"
        icon={<Users className="h-5 w-5" />}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadCustomers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <ExportMenu onExport={handleExport} disabled={loading || filtered.length === 0} />
            <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Add Customer</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 py-2">
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
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone *</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? "Saving..." : editingCustomer ? "Save Changes" : "Create Customer"}
                    </Button>
                  </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </>
        }
      />

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
        
        {loading ? (
          <TableSkeleton columns={7} rows={6} className="p-2" />
        ) : filtered.length === 0 ? (
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

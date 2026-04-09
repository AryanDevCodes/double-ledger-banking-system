import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PageWrapper from "@/components/PageWrapper";
import PageHeader from "@/components/PageHeader";
import ExportMenu from "@/components/ExportMenu";
import EmptyState from "@/components/EmptyState";
import { Can } from "@/components/PermissionGate";
import { bankApi } from "@/lib/api-client";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Pencil, Building2, MoreHorizontal, Eye, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { TableSkeleton } from "@/components/LoadingStates";
import type { BankResponseDTO } from "@/types/api";
import { toast } from "sonner";

const bankSchema = z.object({
  bankName: z.string().min(2, "Bank name is required"),
  branch: z.string().min(2, "Branch is required"),
  ifscCode: z
    .string()
    .min(8, "IFSC code is required")
    .regex(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/, "Enter a valid IFSC code"),
  branchAddress: z.string().min(5, "Branch address is required"),
  city: z.string().optional(),
  state: z.string().optional(),
});

type BankValues = z.infer<typeof bankSchema>;

export default function BanksPage() {
  const [banks, setBanks] = useState<BankResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankResponseDTO | null>(null);

  const form = useForm<BankValues>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      bankName: "",
      branch: "",
      ifscCode: "",
      city: "",
      state: "",
      branchAddress: "",
    },
  });

  useEffect(() => {
    loadBanks();
  }, []);

  const loadBanks = async () => {
    try {
      setLoading(true);
      const data = await bankApi.getAll();
      setBanks(data);
    } catch (error) {
      toast.error("Failed to load banks");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = banks.filter(
    (b) => b.bankName.toLowerCase().includes(search.toLowerCase()) || b.ifscCode.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    form.reset({
      bankName: "",
      branch: "",
      ifscCode: "",
      city: "",
      state: "",
      branchAddress: "",
    });
    setEditingBank(null);
  };

  const handleSubmit = async (values: BankValues) => {
    try {
      if (editingBank) {
        await bankApi.update(editingBank.id, {
          bankName: values.bankName,
          branch: values.branch,
          ifscCode: values.ifscCode,
          city: values.city,
          state: values.state,
          branchAddress: values.branchAddress,
        });
        toast.success("Bank updated successfully");
      } else {
        await bankApi.create({
          bankName: values.bankName,
          branch: values.branch,
          ifscCode: values.ifscCode,
          city: values.city,
          state: values.state,
          branchAddress: values.branchAddress,
        });
        toast.success("Bank created successfully");
      }
      resetForm();
      setOpen(false);
      loadBanks();
    } catch (error) {
      toast.error(editingBank ? "Failed to update bank" : "Failed to create bank");
      console.error(error);
    }
  };

  const handleEdit = (bank: BankResponseDTO) => {
    setEditingBank(bank);
    form.reset({
      bankName: bank.bankName,
      branch: bank.branch,
      ifscCode: bank.ifscCode,
      city: bank.city || "",
      state: bank.state || "",
      branchAddress: bank.branchAddress,
    });
    setOpen(true);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const exportData = filtered.map(bank => ({
        ID: bank.id,
        'Bank Name': bank.bankName,
        Branch: bank.branch,
        'IFSC Code': bank.ifscCode,
        City: bank.city || 'N/A',
        State: bank.state || 'N/A',
        Address: bank.branchAddress,
        'Account Count': bank.accountNumbers?.length ?? 0
      }));

      if (format === 'csv') {
        exportToCSV(exportData, `banks-${new Date().toISOString().split('T')[0]}.csv`);
      } else if (format === 'excel') {
        exportToExcel(exportData, `banks-${new Date().toISOString().split('T')[0]}.xlsx`, 'Banks');
      } else {
        exportToPDF(exportData, 'Banks Report');
      }
      toast.success(`Exported ${filtered.length} banks to ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to export data");
      console.error(error);
    }
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Banks"
        subtitle="Manage registered banks and branches"
        icon={<Building2 className="h-5 w-5" />}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadBanks} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <ExportMenu onExport={handleExport} disabled={loading || filtered.length === 0} />
            <Can permission="BANKS_CREATE">
              <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 shadow-md hover:from-cyan-600 hover:to-blue-700">
                    <Plus className="h-4 w-4 mr-2" /> Add Bank
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-border/70 bg-card/95 backdrop-blur-xl">
                  <DialogHeader>
                    <DialogTitle>{editingBank ? "Edit Bank" : "Create New Bank"}</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 py-2">
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="branch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ifscCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IFSC Code *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="branchAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch Address *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter className="pt-2">
                      <Button type="button" variant="outline" className="rounded-xl" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
                      <Button type="submit" className="bg-gradient-to-r from-cyan-500 to-blue-600 shadow-md hover:from-cyan-600 hover:to-blue-700" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Saving..." : editingBank ? "Save Changes" : "Create Bank"}
                      </Button>
                    </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </Can>
          </>
        }
      />

      <div className="glass-elevated transition-shadow">
        <div className="border-b border-border/70 bg-gradient-to-r from-primary/10 to-transparent p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search banks..." className="h-9 rounded-xl border-border/70 bg-card/70 pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        
        {loading ? (
          <TableSkeleton columns={7} rows={6} className="p-2" />
        ) : filtered.length === 0 ? (
          <EmptyState
            type={search ? "search" : "banks"}
            action={!search ? { label: "Add Bank", onClick: () => setOpen(true) } : undefined}
          />
        ) : (
          <Table>
            <TableHeader className="bg-card/80 backdrop-blur-xl">
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Bank Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>IFSC</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Accounts</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((bank) => (
                <TableRow key={bank.id} className="hover:bg-muted/35 transition-colors">
                  <TableCell className="font-mono text-xs">{bank.id}</TableCell>
                  <TableCell className="font-medium">{bank.bankName}</TableCell>
                  <TableCell>{bank.branch}</TableCell>
                  <TableCell className="font-mono text-xs">{bank.ifscCode}</TableCell>
                  <TableCell>{bank.city || "—"}</TableCell>
                  <TableCell>{bank.accountNumbers?.length ?? 0}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-xl">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border-border/70 bg-popover/95 backdrop-blur-xl">
                        <DropdownMenuItem onClick={() => toast.info(`Viewing ${bank.bankName}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <Can permission="BANKS_EDIT">
                          <DropdownMenuItem onClick={() => handleEdit(bank)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        </Can>
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
        Showing {filtered.length} of {banks.length} banks
      </div>
    </PageWrapper>
  );
}

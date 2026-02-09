import { useState, useEffect } from "react";
import PageWrapper from "@/components/PageWrapper";
import EmptyState from "@/components/EmptyState";
import { Can } from "@/components/PermissionGate";
import { bankApi } from "@/lib/api-client";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Pencil, Building2, Download, MoreHorizontal, Eye, RefreshCw, FileSpreadsheet, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { BankResponseDTO } from "@/types/api";
import { toast } from "sonner";

export default function BanksPage() {
  const [banks, setBanks] = useState<BankResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankResponseDTO | null>(null);
  const [form, setForm] = useState({ bankName: "", branch: "", ifscCode: "", city: "", state: "", branchAddress: "" });

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
    setForm({ bankName: "", branch: "", ifscCode: "", city: "", state: "", branchAddress: "" });
    setEditingBank(null);
  };

  const handleAdd = async () => {
    if (!form.bankName || !form.branch || !form.ifscCode || !form.branchAddress) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      if (editingBank) {
        await bankApi.update(editingBank.id, {
          bankName: form.bankName,
          branch: form.branch,
          ifscCode: form.ifscCode,
          city: form.city,
          state: form.state,
          branchAddress: form.branchAddress,
        });
        toast.success("Bank updated successfully");
      } else {
        await bankApi.create({
          bankName: form.bankName,
          branch: form.branch,
          ifscCode: form.ifscCode,
          city: form.city,
          state: form.state,
          branchAddress: form.branchAddress,
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
    setForm({
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
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Banks
          </h1>
          <p className="page-subtitle">Manage registered banks and branches</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadBanks} disabled={loading}>
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
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Can permission="BANKS_CREATE">
            <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                  <Plus className="h-4 w-4 mr-2" /> Add Bank
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingBank ? "Edit Bank" : "Create New Bank"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  {(["bankName", "branch", "ifscCode", "branchAddress", "city", "state"] as const).map((field) => (
                    <div key={field} className="space-y-1.5">
                      <Label className="capitalize">{field.replace(/([A-Z])/g, " $1")}{["bankName","branch","ifscCode","branchAddress"].includes(field) ? " *" : ""}</Label>
                      <Input value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
                  <Button onClick={handleAdd} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                    {editingBank ? "Save Changes" : "Create Bank"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Can>
        </div>
      </div>

      <div className="glass-card">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search banks..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        
        {filtered.length === 0 ? (
          <EmptyState 
            type={search ? "search" : "banks"} 
            action={!search ? { label: "Add Bank", onClick: () => setOpen(true) } : undefined}
          />
        ) : (
          <Table>
            <TableHeader>
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
                <TableRow key={bank.id}>
                  <TableCell className="font-mono text-xs">{bank.id}</TableCell>
                  <TableCell className="font-medium">{bank.bankName}</TableCell>
                  <TableCell>{bank.branch}</TableCell>
                  <TableCell className="font-mono text-xs">{bank.ifscCode}</TableCell>
                  <TableCell>{bank.city || "—"}</TableCell>
                  <TableCell>{bank.accountNumbers?.length ?? 0}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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

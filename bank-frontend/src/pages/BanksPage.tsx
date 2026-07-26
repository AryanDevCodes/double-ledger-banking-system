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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Pencil,
  Building2,
  MoreHorizontal,
  Eye,
  RefreshCw,
  MapPin,
  Landmark,
  CreditCard,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CardSkeleton } from "@/components/LoadingStates";
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

  // Dialog state lives independently of any permission gate below, so a
  // slow/failed permission check can never prevent an already-open dialog
  // from rendering.
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
    (b) =>
      b.bankName.toLowerCase().includes(search.toLowerCase()) ||
      b.ifscCode.toLowerCase().includes(search.toLowerCase()) ||
      (b.city ?? "").toLowerCase().includes(search.toLowerCase())
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

  const openCreateDialog = () => {
    resetForm();
    setOpen(true);
  };

  const handleSubmit = async (values: BankValues) => {
    try {
      if (editingBank) {
        await bankApi.update(editingBank.id, values);
        toast.success("Bank updated successfully");
      } else {
        await bankApi.create(values);
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

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    try {
      const exportData = filtered.map((bank) => ({
        ID: bank.id,
        "Bank Name": bank.bankName,
        Branch: bank.branch,
        "IFSC Code": bank.ifscCode,
        City: bank.city || "N/A",
        State: bank.state || "N/A",
        Address: bank.branchAddress,
        "Account Count": bank.accountNumbers?.length ?? 0,
      }));

      if (format === "csv") {
        exportToCSV(exportData, `banks-${new Date().toISOString().split("T")[0]}.csv`);
      } else if (format === "excel") {
        exportToExcel(exportData, `banks-${new Date().toISOString().split("T")[0]}.xlsx`, "Banks");
      } else {
        exportToPDF(exportData, "Banks Report");
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
            {/* Permission gate wraps ONLY the trigger button, never the
                Dialog itself. This avoids the dialog + form silently
                failing to render if the permission check is still loading
                or errors out. */}
            <Can permission="BANKS_CREATE">
              <Button
                className="bg-gradient-to-r from-cyan-500 to-blue-600 shadow-md hover:from-cyan-600 hover:to-blue-700"
                onClick={openCreateDialog}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Bank
              </Button>
            </Can>
          </>
        }
      />

      {/* Search bar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by bank, IFSC, or city..."
            className="h-9 rounded-xl border-border/70 bg-card/70 pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {filtered.length} of {banks.length} banks
        </span>
      </div>

      {/* Card grid layout instead of table */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          type={search ? "search" : "banks"}
          action={!search ? { label: "Add Bank", onClick: openCreateDialog } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((bank) => (
            <div
              key={bank.id}
              className="glass-elevated rounded-2xl p-4 border border-[var(--glass-border)] hover:shadow-lg transition-shadow relative"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500/15 to-blue-600/15 flex items-center justify-center shrink-0">
                    <Landmark className="h-4 w-4 text-cyan-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{bank.bankName}</p>
                    <p className="text-xs text-muted-foreground truncate">{bank.branch}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-panel rounded-xl border-[var(--glass-border)]">
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
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {bank.ifscCode}
                </Badge>
                {bank.city && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <MapPin className="h-3 w-3" />
                    {bank.city}
                    {bank.state ? `, ${bank.state}` : ""}
                  </Badge>
                )}
              </div>

              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{bank.branchAddress}</p>

              <div className="mt-3 pt-3 border-t border-[var(--glass-border)] flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5" />
                  {bank.accountNumbers?.length ?? 0} accounts
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/70">#{bank.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog is mounted unconditionally — its visibility is controlled
          purely by `open` state, not by any permission-gated JSX branch. */}
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) resetForm();
        }}
      >
        <DialogContent className="glass-panel border-[var(--glass-border)] z-50">
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
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 shadow-md hover:from-cyan-600 hover:to-blue-700"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Saving..." : editingBank ? "Save Changes" : "Create Bank"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
import { useState, useEffect, useRef } from "react";
import { Send, History, Smartphone, CreditCard, ArrowUpRight, ArrowDownLeft, RefreshCcw, Download, FileSpreadsheet, FileText, Wallet, TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react";
import PageWrapper from "@/components/PageWrapper";
import StatCard from "@/components/StatCard";
import DataTableToolbar from "@/components/DataTableToolbar";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { accountApi, transactionApi, upiApi } from "@/lib/api-client";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/rbac";
import type { AccountResponseDTO, TransactionResponseDTO, UpiProfileResponseDTO } from "@/types/api";

export default function PaymentsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AccountResponseDTO[]>([]);
  const [transactions, setTransactions] = useState<TransactionResponseDTO[]>([]);
  const [upiProfiles, setUpiProfiles] = useState<UpiProfileResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilters, setHistoryFilters] = useState<Record<string, string | Date | undefined>>({
    status: undefined,
    type: undefined,
    date: undefined,
  });

  // UPI Payment Form
  const [upiPayment, setUpiPayment] = useState({
    fromUpi: "",
    toUpi: "",
    amount: "",
    idempotencyKey: "",
  });

  const [upiRegistration, setUpiRegistration] = useState({
    upiId: "",
    accountNumber: "",
  });

  // Bank Transfer Form
  const [bankTransfer, setBankTransfer] = useState({
    senderAccount: "",
    receiverAccount: "",
    amount: "",
  });

  const lastFromUpiRef = useRef<string>("");

  const isCustomer = user?.roles.includes(ROLES.USER);

  useEffect(() => {
    loadData();
  }, []);

  const buildIdempotencyKey = (fromUpi: string) => {
    const userPrefix = (user?.username || user?.email || "user")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 4)
      .padEnd(4, "X")
      .toUpperCase();

    const bankName =
      upiProfiles.find((profile) => profile.upiId === fromUpi)?.bankName || "BANK";
    const bankPart = bankName
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 10)
      .toUpperCase();

    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const randomPart = Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");

    return `${userPrefix}${bankPart}${datePart}${randomPart}`;
  };

  useEffect(() => {
    if (!upiPayment.fromUpi) return;
    if (upiPayment.fromUpi !== lastFromUpiRef.current) {
      const nextKey = buildIdempotencyKey(upiPayment.fromUpi);
      setUpiPayment((prev) => ({ ...prev, idempotencyKey: nextKey }));
      lastFromUpiRef.current = upiPayment.fromUpi;
    }
  }, [upiPayment.fromUpi, upiProfiles, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (isCustomer) {
        // Load customer's data
        const accountsData = await accountApi.getMy();
        const upiByAccount = await Promise.all(
          accountsData.map((acc: AccountResponseDTO) => upiApi.getByAccountNumber(acc.accountNumber))
        );
        setAccounts(accountsData);
        setUpiProfiles(upiByAccount.flat());
        
        // Load transactions for all customer accounts
        if (accountsData.length > 0) {
          const allTransactions = await Promise.all(
            accountsData.map((acc: AccountResponseDTO) => 
              transactionApi.getByAccount(acc.accountNumber, user?.email || "")
            )
          );
          setTransactions(allTransactions.flat());
        }
      } else {
        // Load all data for staff
        const [accountsData, upiData, transactionsData] = await Promise.all([
          accountApi.getAll(),
          upiApi.getAll(),
          transactionApi.getAll(),
        ]);
        setAccounts(accountsData);
        setUpiProfiles(upiData);
        setTransactions(transactionsData);
      }
    } catch (error) {
      toast.error("Failed to load payment data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpiPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const idempotencyKey =
        upiPayment.idempotencyKey || (upiPayment.fromUpi ? buildIdempotencyKey(upiPayment.fromUpi) : undefined);
      await upiApi.pay({
        fromUpi: upiPayment.fromUpi,
        toUpi: upiPayment.toUpi,
        amount: parseFloat(upiPayment.amount),
        idempotencyKey,
      });
      toast.success("UPI payment successful!");
      setUpiPayment({ fromUpi: "", toUpi: "", amount: "", idempotencyKey: "" });
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBankTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await transactionApi.create({
        senderAccount: bankTransfer.senderAccount,
        receiverAccount: bankTransfer.receiverAccount,
        amount: parseFloat(bankTransfer.amount),
      });
      toast.success("Transfer successful!");
      setBankTransfer({ senderAccount: "", receiverAccount: "", amount: "" });
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUpiRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiRegistration.upiId || !upiRegistration.accountNumber) {
      toast.error("Please provide UPI ID and account");
      return;
    }

    const countForAccount = upiProfiles.filter((p) => p.accountNumber === upiRegistration.accountNumber).length;
    if (countForAccount >= 4) {
      toast.error("UPI limit reached for this account (max 4)");
      return;
    }

    try {
      setLoading(true);
      await upiApi.register({
        upiId: upiRegistration.upiId,
        accountNumber: upiRegistration.accountNumber,
      });
      toast.success("UPI ID registered");
      setUpiRegistration({ upiId: "", accountNumber: "" });
      loadData();
    } catch (error: any) {
      const message = error?.data?.message || error?.message || "Failed to register UPI ID";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpiStatusToggle = async (upiId: string, currentStatus: string) => {
    try {
      setLoading(true);
      const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await upiApi.updateStatus(upiId, nextStatus);
      toast.success("UPI status updated");
      loadData();
    } catch (error: any) {
      const message = error?.data?.message || error?.message || "Failed to update status";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const upiByAccount = new Map<string, string[]>();
  upiProfiles.forEach((profile) => {
    if (!upiByAccount.has(profile.accountNumber)) {
      upiByAccount.set(profile.accountNumber, []);
    }
    upiByAccount.get(profile.accountNumber)?.push(profile.upiId);
  });

  const activeUpiProfiles = upiProfiles.filter((p) => p.status === "ACTIVE");

  const formatParty = (name: string | undefined, accountNumber: string) => {
    const upiIds = upiByAccount.get(accountNumber) || [];
    const identifier = upiIds.length > 0 ? `UPI: ${upiIds[0]}` : accountNumber;
    return (
      <div>
        <div className="text-sm font-medium">{name || "Unknown"}</div>
        <div className="text-xs text-muted-foreground font-mono">{identifier}</div>
      </div>
    );
  };

  const historySearchTerm = historySearch.trim().toLowerCase();
  const filteredHistory = transactions.filter((txn: any) => {
    const dateValue = txn.transactionDate || txn.timestamp;
    const type = txn.transactionType || "TRANSFER";
    const fromAccount = txn.senderAccountNumber || txn.fromAccountNumber || "-";
    const toAccount = txn.receiverAccountNumber || txn.toAccountNumber || "-";
    const filterDate = historyFilters.date as Date | undefined;

    const matchesSearch =
      !historySearchTerm ||
      txn.senderName?.toLowerCase().includes(historySearchTerm) ||
      txn.receiverName?.toLowerCase().includes(historySearchTerm) ||
      fromAccount.toLowerCase().includes(historySearchTerm) ||
      toAccount.toLowerCase().includes(historySearchTerm) ||
      String(txn.transactionId || txn.id).includes(historySearchTerm) ||
      (upiByAccount.get(fromAccount)?.[0] || "").toLowerCase().includes(historySearchTerm) ||
      (upiByAccount.get(toAccount)?.[0] || "").toLowerCase().includes(historySearchTerm);

    const matchesStatus = !historyFilters.status || txn.status === historyFilters.status;
    const matchesType = !historyFilters.type || type === historyFilters.type;
    const matchesDate = !filterDate
      ? true
      : dateValue
        ? new Date(dateValue).toDateString() === filterDate.toDateString()
        : false;

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const totalSent = transactions
    .filter((t: any) => (t.transactionType || "TRANSFER") !== "CREDIT")
    .reduce((sum, t: any) => sum + (t.amount || 0), 0);
  const totalReceived = transactions
    .filter((t: any) => (t.transactionType || "TRANSFER") === "CREDIT")
    .reduce((sum, t: any) => sum + (t.amount || 0), 0);
  const successCount = transactions.filter((t: any) => t.status === "SUCCESS").length;
  const successRate = transactions.length ? Math.round((successCount / transactions.length) * 100) : 0;

  const handleExportHistory = (format: "csv" | "excel" | "pdf") => {
    try {
      const exportData = filteredHistory.map((txn: any) => {
        const dateValue = txn.transactionDate || txn.timestamp;
        const type = txn.transactionType || "TRANSFER";
        const fromAccount = txn.senderAccountNumber || txn.fromAccountNumber || "-";
        const toAccount = txn.receiverAccountNumber || txn.toAccountNumber || "-";
        return {
          "Transaction ID": `TXN_${txn.transactionId || txn.id}`,
          Type: type,
          From: txn.senderName || "Unknown",
          "From Account": fromAccount,
          To: txn.receiverName || "Unknown",
          "To Account": toAccount,
          Amount: txn.amount,
          Status: txn.status,
          Date: dateValue ? formatDateTime(dateValue) : "-",
        };
      });

      if (format === "csv") {
        exportToCSV(exportData, `payment-history-${new Date().toISOString().split("T")[0]}.csv`);
      } else if (format === "excel") {
        exportToExcel(exportData, `payment-history-${new Date().toISOString().split("T")[0]}.xlsx`, "Payments");
      } else {
        exportToPDF(exportData, "Payments History");
      }
      toast.success(`Exported ${filteredHistory.length} transactions`);
    } catch (error) {
      toast.error("Failed to export history");
      console.error(error);
    }
  };

  return (
    <PageWrapper>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Payments & Transfers</h1>
          <p className="page-subtitle">Send money via UPI or bank transfer</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="pay" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="pay">
            <Send className="h-4 w-4 mr-2" />
            Send Money
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="upi">
            <Smartphone className="h-4 w-4 mr-2" />
            My UPI
          </TabsTrigger>
        </TabsList>

        {/* Send Money Tab */}
        <TabsContent value="pay" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              title="Total Sent"
              value={formatCurrency(totalSent)}
              subtitle="All time"
              icon={<TrendingDown className="h-5 w-5" />}
            />
            <StatCard
              title="Total Received"
              value={formatCurrency(totalReceived)}
              subtitle="All time"
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              title="Success Rate"
              value={`${successRate}%`}
              subtitle={`${successCount} successful`}
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
            <StatCard
              title="Wallet Balance"
              value={formatCurrency(accounts.reduce((sum, acc) => sum + acc.balance, 0))}
              subtitle={`${accounts.length} accounts`}
              icon={<Wallet className="h-5 w-5" />}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* UPI Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-teal-500" />
                  UPI Payment
                </CardTitle>
                <CardDescription>Send money using UPI ID</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpiPayment} className="space-y-4">
                  <div className="space-y-2">
                    <Label>From UPI ID</Label>
                    <Select
                      value={upiPayment.fromUpi}
                      onValueChange={(value) => setUpiPayment({ ...upiPayment, fromUpi: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your UPI" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeUpiProfiles.map((upi) => (
                          <SelectItem key={upi.upiId} value={upi.upiId}>
                            {upi.upiId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>To UPI ID</Label>
                    <Input
                      placeholder="receiver@upi"
                      value={upiPayment.toUpi}
                      onChange={(e) => setUpiPayment({ ...upiPayment, toUpi: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Amount (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="0.00"
                      value={upiPayment.amount}
                      onChange={(e) => setUpiPayment({ ...upiPayment, amount: e.target.value })}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading || activeUpiProfiles.length === 0 || !upiPayment.fromUpi}>
                    <Send className="h-4 w-4 mr-2" />
                    Send via UPI
                  </Button>

                  {upiProfiles.length === 0 && (
                    <p className="text-sm text-gray-500 text-center">
                      No UPI profiles found. Register one in the UPI tab.
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Bank Transfer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                  Bank Transfer
                </CardTitle>
                <CardDescription>Transfer between accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBankTransfer} className="space-y-4">
                  <div className="space-y-2">
                    <Label>From Account</Label>
                    <Select
                      value={bankTransfer.senderAccount}
                      onValueChange={(value) => setBankTransfer({ ...bankTransfer, senderAccount: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.accountNumber} value={acc.accountNumber}>
                            {acc.accountNumber} - {formatCurrency(acc.balance)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>To Account Number</Label>
                    <Input
                      placeholder="Account number"
                      value={bankTransfer.receiverAccount}
                      onChange={(e) => setBankTransfer({ ...bankTransfer, receiverAccount: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Amount (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="0.00"
                      value={bankTransfer.amount}
                      onChange={(e) => setBankTransfer({ ...bankTransfer, amount: e.target.value })}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading || accounts.length === 0}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Transfer Funds
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Quick Balance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Your Accounts</CardTitle>
              <CardDescription>Quick balance overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {accounts.map((acc) => (
                  <div key={acc.accountNumber} className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-500">{acc.accountNumber}</div>
                    <div className="text-2xl font-bold">{formatCurrency(acc.balance)}</div>
                    <Badge variant={acc.status === "ACTIVE" ? "default" : "secondary"}>
                      {acc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transaction History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Transaction History</h2>
              <p className="text-sm text-muted-foreground">Search, filter, and export your payments</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExportHistory("csv")}>
                  <FileText className="h-4 w-4 mr-2" /> Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportHistory("excel")}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> Export as Excel
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExportHistory("pdf")}>
                  <FileText className="h-4 w-4 mr-2" /> Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Card>
            <CardContent>
              <div className="pb-4">
                <DataTableToolbar
                  searchPlaceholder="Search by name, account, UPI, or ID..."
                  searchValue={historySearch}
                  onSearchChange={setHistorySearch}
                  filters={[
                    {
                      key: "status",
                      label: "Status",
                      type: "select",
                      options: Array.from(new Set(transactions.map((t: any) => t.status).filter(Boolean))).map((v) => ({
                        label: v,
                        value: v,
                      })),
                    },
                    {
                      key: "type",
                      label: "Type",
                      type: "select",
                      options: Array.from(new Set(transactions.map((t: any) => t.transactionType || "TRANSFER"))).map((v) => ({
                        label: v,
                        value: v,
                      })),
                    },
                    { key: "date", label: "Date", type: "date" },
                  ]}
                  activeFilters={historyFilters}
                  onFilterChange={(key, value) => setHistoryFilters((prev) => ({ ...prev, [key]: value }))}
                  onClearFilters={() => setHistoryFilters({ status: undefined, type: undefined, date: undefined })}
                />
              </div>
              {filteredHistory.length === 0 ? (
                <EmptyState type={historySearch ? "search" : "transactions"} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((txn: any) => {
                      const dateValue = txn.transactionDate || txn.timestamp;
                      const type = txn.transactionType || "TRANSFER";
                      const fromAccount = txn.senderAccountNumber || txn.fromAccountNumber || "-";
                      const toAccount = txn.receiverAccountNumber || txn.toAccountNumber || "-";

                      return (
                        <TableRow key={txn.transactionId || txn.id}>
                          <TableCell>{dateValue ? formatDateTime(dateValue) : "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {type === "CREDIT" ? (
                                <ArrowDownLeft className="h-4 w-4 text-green-500" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4 text-red-500" />
                              )}
                              {type}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatParty(txn.senderName, fromAccount)}
                          </TableCell>
                          <TableCell>
                            {formatParty(txn.receiverName, toAccount)}
                          </TableCell>
                          <TableCell className={
                            type === "CREDIT" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"
                          }>
                            {type === "CREDIT" ? "+" : "-"}
                            {formatCurrency(txn.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={txn.status === "SUCCESS" ? "default" : "destructive"}>
                              {txn.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* UPI Management Tab */}
        <TabsContent value="upi" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Register UPI ID</CardTitle>
                <CardDescription>Create a new UPI ID linked to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpiRegistration} className="space-y-4">
                  <div className="space-y-2">
                    <Label>UPI ID</Label>
                    <Input
                      placeholder="yourname@mybank"
                      value={upiRegistration.upiId}
                      onChange={(e) => setUpiRegistration({ ...upiRegistration, upiId: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Link Account</Label>
                    <Select
                      value={upiRegistration.accountNumber}
                      onValueChange={(value) => setUpiRegistration({ ...upiRegistration, accountNumber: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.accountNumber} value={acc.accountNumber}>
                            {acc.accountNumber} • {acc.bankName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading || accounts.length === 0}>
                    <Smartphone className="h-4 w-4 mr-2" />
                    Register UPI ID
                  </Button>
                  {accounts.length === 0 && (
                    <p className="text-xs text-gray-500">You need at least one active account to register UPI.</p>
                  )}
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your UPI IDs</CardTitle>
                <CardDescription>Activate, deactivate, or remove UPI profiles</CardDescription>
              </CardHeader>
              <CardContent>
                {upiProfiles.length === 0 ? (
                  <div className="text-center py-10">
                    <Smartphone className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No UPI profiles found</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {upiProfiles.map((upi) => (
                      <div key={upi.upiId} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-semibold text-lg">{upi.upiId}</div>
                            <div className="text-sm text-gray-500">
                              {upi.accountNumber} • {upi.bankName}
                            </div>
                            <div className="text-xs text-gray-400">
                              {upi.accountHolderName} • {formatDateTime(upi.createdAt)}
                            </div>
                          </div>
                          <Badge variant={upi.status === "ACTIVE" ? "default" : "secondary"}>
                            {upi.status}
                          </Badge>
                        </div>
                        <Separator className="my-3" />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpiStatusToggle(upi.upiId, upi.status)}
                            disabled={loading}
                          >
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            {upi.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}

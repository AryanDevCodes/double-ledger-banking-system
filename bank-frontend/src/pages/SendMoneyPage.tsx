import { useEffect, useState, useMemo, useCallback } from "react";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, Wallet, RefreshCw, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import PageWrapper from "@/components/PageWrapper";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import TransactionReceipt from "@/components/TransactionReceipt";
import { TableSkeleton, StatCardSkeleton } from "@/components/LoadingStates";
import { accountApi, transactionApi, upiApi, getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { AccountResponseDTO, ReceiverValidationResponseDTO, TransactionResponseDTO, UpiProfileResponseDTO } from "@/types/api";

const bankTransferSchema = z
  .object({
    senderAccount: z.string().min(1, "Select sender account"),
    receiverAccount: z.string().min(1, "Enter receiver account number"),
    receiverName: z.string().optional(),
    receiverBank: z.string().optional(),
    receiverIfsc: z.string().optional(),
    amount: z
      .string()
      .min(1, "Amount is required")
      .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, "Amount must be greater than 0"),
    note: z.string().optional(),
  })
  .refine((d) => d.senderAccount !== d.receiverAccount, {
    message: "Sender and receiver cannot be the same",
    path: ["receiverAccount"],
  });

type BankTransferValues = z.infer<typeof bankTransferSchema>;

type EnrichedTransaction = TransactionResponseDTO & { direction: "SENT" | "RECEIVED" };

export default function SendMoneyPage(): JSX.Element {
  const [accounts, setAccounts] = useState<AccountResponseDTO[]>([]);
  const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);
  const [upiProfiles, setUpiProfiles] = useState<UpiProfileResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string>("all");
  const [receiverValidation, setReceiverValidation] = useState<ReceiverValidationResponseDTO | null>(null);
  const [accountLookupLoading, setAccountLookupLoading] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<TransactionResponseDTO | null>(null);

  const form = useForm<BankTransferValues>({
    resolver: zodResolver(bankTransferSchema),
    defaultValues: {
      senderAccount: "",
      receiverAccount: "",
      receiverName: "",
      receiverBank: "",
      receiverIfsc: "",
      amount: "",
      note: "",
    },
  });

  const receiverAccount = useWatch({ control: form.control, name: "receiverAccount" });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [accountsData, upiData, txnsData] = await Promise.all([
        accountApi.getMy(),
        upiApi.getMy(),
        transactionApi.getMy().catch(() => [] as TransactionResponseDTO[]),
      ]);

      setAccounts(accountsData);
      setUpiProfiles(upiData);

      const myAccountNumbers = new Set(accountsData.map((a) => a.accountNumber));
      const enriched = txnsData.map((t) => ({
        ...t,
        direction: t.senderAccountNumber && myAccountNumbers.has(t.senderAccountNumber) ? "SENT" : "RECEIVED",
      }));
      setTransactions(enriched);
    } catch (err) {
      console.error(err);
      toast.error(getApiErrorMessage(err, "Failed to load data"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const banks = useMemo(() => {
    const map = new Map<string, number>();
    accounts.forEach((a) => map.set(a.bankName, (map.get(a.bankName) || 0) + 1));
    return Array.from(map.keys());
  }, [accounts]);

  const selectedBankAccounts = useMemo(() => {
    return selectedBank === "all" ? accounts : accounts.filter((a) => a.bankName === selectedBank);
  }, [accounts, selectedBank]);

  const filteredTransactions = useMemo(() => {
    if (selectedBank === "all") return transactions;
    const bankAccountNumbers = new Set(selectedBankAccounts.map((a) => a.accountNumber));
    return transactions.filter((t) => bankAccountNumbers.has(t.senderAccountNumber) || bankAccountNumbers.has(t.receiverAccountNumber));
  }, [transactions, selectedBank, selectedBankAccounts]);

  const stats = useMemo(() => {
    const completed = filteredTransactions.filter((t) => t.status === "COMPLETED" || t.status === "SUCCESS");
    const sent = completed.filter((t) => t.direction === "SENT").reduce((s, t) => s + (t.amount || 0), 0);
    const received = completed.filter((t) => t.direction === "RECEIVED").reduce((s, t) => s + (t.amount || 0), 0);
    const pending = filteredTransactions.filter((t) => t.status === "PENDING").length;
    return { sent, received, pending };
  }, [filteredTransactions]);

  const onSubmit = async (values: BankTransferValues) => {
    try {
      setLoading(true);
      if (!receiverValidation?.valid || !values.receiverAccount) {
        toast.error("Please enter a valid receiver account number");
        return;
      }

      const result = await transactionApi.create({
        senderAccount: values.senderAccount,
        receiverAccount: values.receiverAccount,
        amount: parseFloat(values.amount),
        senderBankName: accounts.find((a) => a.accountNumber === values.senderAccount)?.bankName,
        receiverBankName: values.receiverBank,
      });
      setLastTransaction(result);
      setReceiptOpen(true);
      form.reset();
      setReceiverValidation(null);
      loadData();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Transfer failed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const accountNumber = receiverAccount?.trim();

    if (!accountNumber || accountNumber.length < 5) {
      setReceiverValidation(null);
      form.setValue("receiverName", "", { shouldValidate: true, shouldDirty: true });
      form.setValue("receiverBank", "", { shouldValidate: true, shouldDirty: true });
      form.setValue("receiverIfsc", "", { shouldValidate: true, shouldDirty: true });
      return;
    }

    let alive = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        setAccountLookupLoading(true);
        const response = await accountApi.lookupByAccountNumber(accountNumber);
        if (!alive) return;

        setReceiverValidation(response);
        if (response.valid) {
          form.setValue("receiverName", response.accountHolderName || "", { shouldValidate: true, shouldDirty: true });
          form.setValue("receiverBank", response.bankName || "", { shouldValidate: true, shouldDirty: true });
          form.setValue("receiverIfsc", response.ifscCode || "", { shouldValidate: true, shouldDirty: true });
        } else {
          form.setValue("receiverName", "", { shouldValidate: true, shouldDirty: true });
          form.setValue("receiverBank", "", { shouldValidate: true, shouldDirty: true });
          form.setValue("receiverIfsc", "", { shouldValidate: true, shouldDirty: true });
        }
      } catch (error) {
        if (!alive) return;
        setReceiverValidation({
          valid: false,
          message: getApiErrorMessage(error, "Unable to find account"),
          matchedAccountCount: 0,
        });
        form.setValue("receiverName", "", { shouldValidate: true, shouldDirty: true });
        form.setValue("receiverBank", "", { shouldValidate: true, shouldDirty: true });
        form.setValue("receiverIfsc", "", { shouldValidate: true, shouldDirty: true });
      } finally {
        if (alive) {
          setAccountLookupLoading(false);
        }
      }
    }, 500);

    return () => {
      alive = false;
      window.clearTimeout(timeoutId);
    };
  }, [receiverAccount, form]);

  return (
    <PageWrapper>
      <PageHeader
        title="Send Money"
        subtitle="Bank transfer to any account"
        icon={<Send className="h-5 w-5" />}
        actions={
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard title="Available Balance" value={formatCurrency(selectedBankAccounts.reduce((s, a) => s + a.balance, 0))} icon={<Wallet className="h-5 w-5" />} tint="emerald" />
          <StatCard title="Total Sent" value={formatCurrency(stats.sent)} icon={<Send className="h-5 w-5" />} tint="rose" />
          <StatCard title="Total Received" value={formatCurrency(stats.received)} icon={<CheckCircle2 className="h-5 w-5" />} tint="emerald" />
          <StatCard title="Pending" value={stats.pending} subtitle="Transactions" icon={<Clock className="h-5 w-5" />} tint="amber" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Transfer composer</h2>
              <p className="text-xs text-muted-foreground">Prepare and validate the transfer before sending.</p>
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Step 1</p>
                <div className="mt-3">
                  <FormField control={form.control} name="senderAccount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funding Account</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your account" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedBankAccounts.map((acc) => (
                              <SelectItem key={acc.accountNumber} value={acc.accountNumber}>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono">{acc.accountNumber}</span>
                                  <span className="text-muted-foreground">({acc.bankName})</span>
                                  <Badge variant="secondary">{formatCurrency(acc.balance)}</Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Step 2</p>
                  <p className="text-sm font-semibold">Receiver verification</p>
                </div>
                <FormField control={form.control} name="receiverAccount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receiver Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter receiver account number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="rounded-xl border border-border/70 bg-background p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Lookup status</p>
                      <p className="text-xs text-muted-foreground">Instant validation to reduce failed transfers.</p>
                    </div>
                    <Badge variant={receiverValidation?.valid ? "default" : "secondary"}>{accountLookupLoading ? "Searching" : receiverValidation?.valid ? "Matched" : "Awaiting"}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{receiverValidation?.message || "Type an account number to lookup receiver details."}</div>
                  {receiverValidation?.valid ? (
                    <div className="grid gap-1 text-sm">
                      <div><span className="font-medium">Holder:</span> {receiverValidation.accountHolderName}</div>
                      <div><span className="font-medium">Bank:</span> {receiverValidation.bankName}</div>
                      <div><span className="font-medium">IFSC:</span> {receiverValidation.ifscCode}</div>
                      <div><span className="font-medium">Account:</span> {receiverValidation.accountNumber}</div>
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormField control={form.control} name="receiverName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receiver Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Auto-populated from account lookup" {...field} readOnly className="bg-muted/40" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="receiverBank" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receiver Bank</FormLabel>
                      <FormControl>
                        <Input placeholder="Auto-populated from account lookup" {...field} readOnly className="bg-muted/40" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="receiverIfsc" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receiver IFSC</FormLabel>
                      <FormControl>
                        <Input placeholder="Auto-populated from account lookup" {...field} readOnly className="bg-muted/40" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Step 3</p>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="note" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Note (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Add a note for this transfer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading || !receiverValidation?.valid}>
                <Send className="mr-2 h-4 w-4" />
                Send Money
              </Button>
            </form>
          </Form>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Recent transfers</h2>
              <p className="text-xs text-muted-foreground">Your latest activity across accounts.</p>
            </div>
            {selectedBank !== "all" && <Badge variant="outline">{selectedBank}</Badge>}
          </div>
          {loading ? (
            <TableSkeleton columns={4} rows={5} />
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>No transfers found</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.slice(0, 10).map((t) => {
                    const isSent = t.direction === "SENT";
                    const counterparty = isSent ? t.receiverName : t.senderName;
                    return (
                      <TableRow key={t.transactionId} className="cursor-pointer hover:bg-muted/50" onClick={() => { setLastTransaction(t); setReceiptOpen(true); }}>
                        <TableCell className="text-xs">{t.transactionDate ? formatDateTime(t.transactionDate) : "-"}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className={`text-xs font-medium ${isSent ? "text-rose-600" : "text-emerald-600"}`}>{isSent ? "Sent to" : "Received from"}</span>
                            <span className="text-xs text-muted-foreground">{counterparty}</span>
                          </div>
                        </TableCell>
                        <TableCell className={`text-right font-mono font-semibold ${isSent ? "text-rose-600" : "text-emerald-600"}`}>{isSent ? "-" : "+"}{formatCurrency(t.amount)}</TableCell>
                        <TableCell><StatusBadge status={t.status} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <TransactionReceipt transaction={lastTransaction} open={receiptOpen} onOpenChange={setReceiptOpen} />
    </PageWrapper>
  );
}

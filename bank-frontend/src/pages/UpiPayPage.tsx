import { useEffect, useState, useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Smartphone, QrCode, PlusCircle, Send, RefreshCw, CheckCircle2, Clock, Wallet, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

import PageWrapper from "@/components/PageWrapper";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { TableSkeleton, StatCardSkeleton } from "@/components/LoadingStates";
import { accountApi, upiApi, getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { AccountResponseDTO, UpiProfileResponseDTO } from "@/types/api";

const upiPaymentSchema = z.object({
  fromUpi: z.string().min(1, "Select a sender UPI"),
  toUpi: z.string().min(3, "Enter a valid receiver UPI ID"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((value) => !isNaN(Number(value)) && Number(value) > 0, "Amount must be greater than 0"),
  note: z.string().optional(),
});

const upiRegistrationSchema = z.object({
  upiId: z.string().min(3, "UPI ID is required"),
  accountNumber: z.string().min(1, "Select an account"),
});

type UpiPaymentValues = z.infer<typeof upiPaymentSchema>;
type UpiRegistrationValues = z.infer<typeof upiRegistrationSchema>;

// UPI Transaction type (from the UPI pay response)
interface UpiTransaction {
  id: number;
  fromUpi: string;
  toUpi: string;
  amount: number;
  status: string;
  timestamp: string;
}

export default function UpiPayPage() {
  const [accounts, setAccounts] = useState<AccountResponseDTO[]>([]);
  const [upiProfiles, setUpiProfiles] = useState<UpiProfileResponseDTO[]>([]);
  const [upiTransactions, setUpiTransactions] = useState<UpiTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [selectedUpi, setSelectedUpi] = useState<string>("");

  const paymentForm = useForm<UpiPaymentValues>({
    resolver: zodResolver(upiPaymentSchema),
    defaultValues: { fromUpi: "", toUpi: "", amount: "", note: "" },
  });

  const registrationForm = useForm<UpiRegistrationValues>({
    resolver: zodResolver(upiRegistrationSchema),
    defaultValues: { upiId: "", accountNumber: "" },
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsData, upiData] = await Promise.all([
        accountApi.getMy(),
        upiApi.getMy(),
      ]);
      setAccounts(accountsData);
      setUpiProfiles(upiData);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load UPI data"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const upiStats = useMemo(() => {
    const totalLinked = upiProfiles.length;
    const activeProfiles = upiProfiles.filter((p) => p.status === "ACTIVE").length;
    return { totalLinked, activeProfiles };
  }, [upiProfiles]);

  const generateIdempotencyKey = (upiId: string) => {
    const userPrefix = upiId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase();
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const randomPart = Array.from({ length: 4 }, () =>
      letters[Math.floor(Math.random() * letters.length)]
    ).join("");
    return `${userPrefix}${datePart}${randomPart}`;
  };

  const onPaymentSubmit = async (values: UpiPaymentValues) => {
    try {
      setLoading(true);
      const idempotencyKey = generateIdempotencyKey(values.fromUpi);
      await upiApi.pay({
        fromUpi: values.fromUpi,
        toUpi: values.toUpi,
        amount: parseFloat(values.amount),
        idempotencyKey,
      });
      toast.success("UPI payment successful!");
      paymentForm.reset();
      loadData();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Payment failed"));
    } finally {
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (values: UpiRegistrationValues) => {
    try {
      setLoading(true);
      await upiApi.register({
        upiId: values.upiId,
        accountNumber: values.accountNumber,
      });
      toast.success("UPI ID registered successfully!");
      registrationForm.reset();
      loadData();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  const selectedProfile = upiProfiles.find((p) => p.upiId === selectedUpi);

  return (
    <PageWrapper>
      <PageHeader
        title="UPI Pay"
        subtitle="Instant payments using UPI ID"
        icon={<Smartphone className="h-5 w-5" />}
        actions={
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {/* UPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="UPI Profiles"
              value={upiStats.totalLinked}
              icon={<Smartphone className="h-5 w-5" />}
              subtitle={`${upiStats.activeProfiles} active`}
              tint="indigo"
            />
            <StatCard
              title="Linked Accounts"
              value={upiProfiles.length}
              icon={<Wallet className="h-5 w-5" />}
              tint="emerald"
            />
            <Card className="glass-panel">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Quick Actions</p>
                  <p className="text-sm font-medium mt-1">Manage your UPI</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Register New
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Register New UPI ID</DialogTitle>
                      <DialogDescription>
                        Link a new UPI ID to one of your bank accounts
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...registrationForm}>
                      <form
                        onSubmit={registrationForm.handleSubmit(onRegisterSubmit)}
                        className="space-y-4 mt-4"
                      >
                        <FormField
                          control={registrationForm.control}
                          name="upiId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>UPI ID</FormLabel>
                              <FormControl>
                                <Input placeholder="yourname@upi" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registrationForm.control}
                          name="accountNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Link to Account</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select account" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {accounts.map((acc) => (
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
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={loading}>
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Register UPI
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* UPI Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Money via UPI
            </CardTitle>
            <CardDescription>Pay instantly using UPI ID</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...paymentForm}>
              <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
                <FormField
                  control={paymentForm.control}
                  name="fromUpi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From UPI ID</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your UPI ID" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {upiProfiles.map((profile) => (
                            <SelectItem key={profile.upiId} value={profile.upiId}>
                              <div className="flex items-center gap-2">
                                <span>{profile.upiId}</span>
                                <Badge variant="outline">{profile.bankName}</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={paymentForm.control}
                  name="toUpi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To UPI ID</FormLabel>
                      <FormControl>
                        <Input placeholder="receiver@upi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={paymentForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={paymentForm.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Add a note" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                  <Send className="h-4 w-4 mr-2" />
                  Pay Now
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* QR Code Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Receive Payments
            </CardTitle>
            <CardDescription>Share your QR code to receive UPI payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select value={selectedUpi} onValueChange={setSelectedUpi}>
                <SelectTrigger>
                  <SelectValue placeholder="Select UPI ID to display QR" />
                </SelectTrigger>
                <SelectContent>
                  {upiProfiles.map((profile) => (
                    <SelectItem key={profile.upiId} value={profile.upiId}>
                      {profile.upiId} ({profile.bankName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedProfile && (
                <div className="flex flex-col items-center p-6 border rounded-xl bg-white dark:bg-black">
                  {/* Simulated QR Code */}
                  <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                    <QrCode className="w-32 h-32 text-gray-400" />
                  </div>
                  <p className="text-lg font-semibold">{selectedProfile.upiId}</p>
                  <p className="text-sm text-muted-foreground">{selectedProfile.bankName}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Account: {selectedProfile.accountNumber}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" asChild>
                  <Link to="/my-transactions">
                    <Clock className="h-4 w-4 mr-2" />
                    History
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/send-money">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Bank Transfer
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My UPI Profiles */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>My UPI Profiles</CardTitle>
          <CardDescription>All your registered UPI IDs</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton columns={4} rows={3} />
          ) : upiProfiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Smartphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No UPI profiles yet</p>
              <p className="text-sm">Register a UPI ID above to start receiving payments</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>UPI ID</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upiProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.upiId}</TableCell>
                    <TableCell>{profile.bankName}</TableCell>
                    <TableCell className="font-mono text-xs">{profile.accountNumber}</TableCell>
                    <TableCell>
                      <StatusBadge status={profile.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}

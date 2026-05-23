import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  RefreshCw,
  Search,
  Wallet,
  TrendingUp,
  TrendingDown,
  Activity,
  Send,
  Smartphone,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import PageWrapper from "@/components/PageWrapper";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCardSkeleton, TableSkeleton } from "@/components/LoadingStates";
import { accountApi, transactionApi, upiApi } from "@/lib/api-client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type {
  AccountResponseDTO,
  TransactionResponseDTO,
  UpiProfileResponseDTO,
} from "@/types/api";

type Direction = "SENT" | "RECEIVED" | "INTERNAL";
type Filter = "all" | "sent" | "received" | "failed";

interface EnrichedTxn extends TransactionResponseDTO {
  direction: Direction;
  counterpartyName: string;
  counterpartyAccount: string;
}

/**
 * User-specific transactions page.
 *
 * Why this exists separately from /transactions:
 *  - /transactions calls /transaction/all which is admin/manager/auditor only,
 *    so signed-in users would hit a 403 on that page.
 *  - This page calls /transaction/my which is the user-safe endpoint that
 *    aggregates and dedupes transactions across all of the user's accounts.
 */
export default function MyTransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionResponseDTO[]>([]);
  const [accounts, setAccounts] = useState<AccountResponseDTO[]>([]);
  const [upiProfiles, setUpiProfiles] = useState<UpiProfileResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [txns, accs, upis] = await Promise.all([
        transactionApi.getMy().catch(() => [] as TransactionResponseDTO[]),
        accountApi.getMy().catch(() => [] as AccountResponseDTO[]),
        upiApi.getMy().catch(() => [] as UpiProfileResponseDTO[]),
      ]);
      setTransactions(txns);
      setAccounts(accs);
      setUpiProfiles(upis);
    } catch (err) {
      toast.error("Failed to load your transactions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const myAccountNumbers = useMemo(
    () => new Set(accounts.map((a) => a.accountNumber)),
    [accounts],
  );

  const upiByAccount = useMemo(() => {
    const map = new Map<string, string[]>();
    upiProfiles.forEach((p) => {
      if (!map.has(p.accountNumber)) map.set(p.accountNumber, []);
      map.get(p.accountNumber)?.push(p.upiId);
    });
    return map;
  }, [upiProfiles]);

  const enriched: EnrichedTxn[] = useMemo(() => {
    return transactions.map((t) => {
      const isSender = !!t.senderAccountNumber && myAccountNumbers.has(t.senderAccountNumber);
      const isReceiver = !!t.receiverAccountNumber && myAccountNumbers.has(t.receiverAccountNumber);

      let direction: Direction;
      if (isSender && isReceiver) direction = "INTERNAL";
      else if (isReceiver) direction = "RECEIVED";
      else direction = "SENT";

      const counterpartyName =
        direction === "RECEIVED" ? t.senderName : t.receiverName;
      const counterpartyAccount =
        direction === "RECEIVED" ? t.senderAccountNumber : t.receiverAccountNumber;

      return {
        ...t,
        direction,
        counterpartyName: counterpartyName || "Unknown",
        counterpartyAccount: counterpartyAccount || "-",
      };
    });
  }, [transactions, myAccountNumbers]);

  const totals = useMemo(() => {
    const sent = enriched
      .filter((t) => t.direction === "SENT" && (t.status === "COMPLETED" || t.status === "SUCCESS"))
      .reduce((s, t) => s + (t.amount || 0), 0);
    const received = enriched
      .filter((t) => t.direction === "RECEIVED" && (t.status === "COMPLETED" || t.status === "SUCCESS"))
      .reduce((s, t) => s + (t.amount || 0), 0);
    const completed = enriched.filter((t) => t.status === "COMPLETED" || t.status === "SUCCESS").length;
    const failed = enriched.filter((t) => t.status === "FAILED").length;
    const successRate = enriched.length ? Math.round((completed / enriched.length) * 100) : 0;
    return { sent, received, net: received - sent, successRate, failed };
  }, [enriched]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched.filter((t) => {
      if (filter === "sent" && t.direction === "RECEIVED") return false;
      if (filter === "received" && t.direction === "SENT") return false;
      if (filter === "failed" && t.status !== "FAILED") return false;
      if (!q) return true;
      const haystack = [
        t.counterpartyName,
        t.counterpartyAccount,
        t.senderAccountNumber,
        t.receiverAccountNumber,
        t.senderName,
        t.receiverName,
        String(t.transactionId ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [enriched, filter, query]);

  return (
    <PageWrapper>
      <PageHeader
        title="My Transactions"
        subtitle="All payments across your accounts and UPI profiles"
        icon={<ArrowLeftRight className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/send-money">
                <Send className="h-4 w-4 mr-2" />
                Send Money
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/upi-pay">
                <Smartphone className="h-4 w-4 mr-2" />
                UPI Pay
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Summary */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <StatCard
            title="Total Sent"
            value={formatCurrency(totals.sent)}
            icon={<TrendingUp className="h-5 w-5" />}
            tint="rose"
          />
          <StatCard
            title="Total Received"
            value={formatCurrency(totals.received)}
            icon={<TrendingDown className="h-5 w-5" />}
            tint="emerald"
          />
          <StatCard
            title="Net Flow"
            value={formatCurrency(totals.net)}
            icon={<Wallet className="h-5 w-5" />}
            subtitle={totals.net >= 0 ? "Inflow positive" : "Outflow"}
            tint={totals.net >= 0 ? "emerald" : "rose"}
          />
          <StatCard
            title="Transactions"
            value={enriched.length}
            icon={<Activity className="h-5 w-5" />}
            subtitle={`${totals.successRate}% success`}
            tint="indigo"
          />
          <StatCard
            title="Failed"
            value={totals.failed}
            icon={<ArrowLeftRight className="h-5 w-5" />}
            subtitle="Needs review"
            tint="amber"
          />
        </div>
      )}

      {/* Filters */}
      <div className="glass-panel rounded-2xl p-4 mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="received">Received</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, account or txn id"
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl">
        {loading ? (
          <TableSkeleton columns={5} rows={6} />
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              {enriched.length === 0
                ? "You have no transactions yet."
                : "No transactions match your filters."}
            </p>
            {enriched.length === 0 && (
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link to="/send-money">
                  <Send className="h-4 w-4 mr-2" />
                  Make your first payment
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => {
                const upi = upiByAccount.get(t.counterpartyAccount) || [];
                const identifier = upi.length > 0 ? `UPI: ${upi[0]}` : t.counterpartyAccount;
                const isReceived = t.direction === "RECEIVED";
                return (
                  <TableRow key={t.transactionId}>
                    <TableCell>{t.transactionDate ? formatDateTime(t.transactionDate) : "-"}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          t.direction === "INTERNAL"
                            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                            : isReceived
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isReceived ? (
                          <ArrowDownLeft className="h-3 w-3" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3" />
                        )}
                        {t.direction === "INTERNAL" ? "Internal" : isReceived ? "Received" : "Sent"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{t.counterpartyName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{identifier}</div>
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono font-semibold ${
                        isReceived ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isReceived ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </PageWrapper>
  );
}

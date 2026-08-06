import { ArrowLeftRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/LoadingStates";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { DashboardTransaction } from "@/hooks/useDashboardData";
import type { UpiProfileResponseDTO } from "@/types/api";

interface Props {
  transactions: DashboardTransaction[];
  upiProfiles?: UpiProfileResponseDTO[];
  loading: boolean;
  title?: string;
  limit?: number;
  linkTo?: string;
}

export default function RecentActivityTable({
  transactions,
  upiProfiles = [],
  loading,
  title = "Recent Activity",
  limit = 6,
  linkTo = "/transactions",
}: Props) {
  const upiByAccount = new Map<string, string[]>();
  upiProfiles.forEach((p) => {
    if (!upiByAccount.has(p.accountNumber)) upiByAccount.set(p.accountNumber, []);
    upiByAccount.get(p.accountNumber)?.push(p.upiId);
  });

  const formatParty = (name: string | undefined, accountNumber: string) => {
    const upi = upiByAccount.get(accountNumber) || [];
    const identifier = upi.length > 0 ? `UPI: ${upi[0]}` : accountNumber;
    return (
      <div>
        <div className="text-sm font-medium">{name || "Unknown"}</div>
        <div className="text-xs text-muted-foreground font-mono">{identifier}</div>
      </div>
    );
  };

  return (
    <div className="glass-panel rounded-2xl mt-5">
      <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/10 to-transparent p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to={linkTo}>View All Transactions</Link>
        </Button>
      </div>
      {loading ? (
        <TableSkeleton columns={5} rows={5} />
      ) : transactions.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No transactions available yet</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.slice(0, limit).map((txn) => {
              const dateValue = txn.transactionDate || txn.timestamp;
              const fromAccount = txn.senderAccountNumber || txn.fromAccountNumber || "-";
              const toAccount = txn.receiverAccountNumber || txn.toAccountNumber || "-";
              return (
                <TableRow key={txn.transactionId || txn.id}>
                  <TableCell>{dateValue ? formatDateTime(dateValue) : "-"}</TableCell>
                  <TableCell>{formatParty(txn.senderName, fromAccount)}</TableCell>
                  <TableCell>{formatParty(txn.receiverName, toAccount)}</TableCell>
                  <TableCell className="text-right font-mono font-medium">{formatCurrency(txn.amount)}</TableCell>
                  <TableCell><StatusBadge status={txn.status} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

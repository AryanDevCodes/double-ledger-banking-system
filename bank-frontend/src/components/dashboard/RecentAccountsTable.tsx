import { CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/LoadingStates";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/format";
import type { AccountResponseDTO } from "@/types/api";

interface Props {
  accounts: AccountResponseDTO[];
  loading: boolean;
  title?: string;
  linkLabel?: string;
  linkTo?: string;
  /** When true, shows the simplified personal view (Type column instead of Customer) */
  personal?: boolean;
  limit?: number;
}

export default function RecentAccountsTable({
  accounts,
  loading,
  title,
  linkLabel,
  linkTo = "/accounts",
  personal = false,
  limit = 6,
}: Props) {
  const heading = title ?? (personal ? "My Accounts" : "Recent Accounts");
  const action = linkLabel ?? (personal ? "Manage Accounts" : "View All Accounts");

  return (
    <div className="glass-panel rounded-2xl">
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] bg-gradient-to-r from-[var(--accent-primary)]/8 to-transparent p-4">
        <h2 className="text-base font-semibold text-[var(--ink-primary)]">{heading}</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link to={linkTo}>{action}</Link>
        </Button>
      </div>
      {loading ? (
        <TableSkeleton columns={5} rows={5} />
      ) : accounts.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No accounts created yet</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account Number</TableHead>
              <TableHead>{personal ? "Type" : "Customer"}</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.slice(0, limit).map((acc) => (
              <TableRow key={acc.accountNumber} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-mono text-xs font-semibold">{acc.accountNumber}</TableCell>
                <TableCell className="font-medium">{personal ? "Savings" : acc.customerName}</TableCell>
                <TableCell className="text-sm">{acc.bankName}</TableCell>
                <TableCell className="text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(acc.balance)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={acc.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

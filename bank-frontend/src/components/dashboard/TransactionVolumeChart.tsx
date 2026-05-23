import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import type { DashboardTransaction } from "@/hooks/useDashboardData";

interface Props {
  transactions: DashboardTransaction[];
  loading: boolean;
  title?: string;
  className?: string;
}

export default function TransactionVolumeChart({
  transactions,
  loading,
  title = "Transaction Volume (Last 6 Months)",
  className,
}: Props) {
  const locale = typeof navigator !== "undefined" ? navigator.language : "en-US";

  const data = (() => {
    const monthMap = new Map<string, { month: string; volume: number; count: number }>();
    transactions.forEach((txn) => {
      const rawDate = txn.transactionDate || txn.timestamp;
      if (!rawDate) return;
      const dt = new Date(rawDate);
      if (Number.isNaN(dt.getTime())) return;
      const key = `${dt.getFullYear()}-${dt.getMonth()}`;
      const label = dt.toLocaleString(locale, { month: "short" });
      const current = monthMap.get(key) || { month: label, volume: 0, count: 0 };
      current.volume += txn.amount || 0;
      current.count += 1;
      monthMap.set(key, current);
    });
    return Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([, value]) => value);
  })();

  return (
    <div className={`glass-panel rounded-2xl p-4 ${className || ""}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">Trend</span>
      </div>
      <div className="h-[260px]">
        {loading ? (
          <div className="space-y-3 p-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-[210px] w-full" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            No transaction trend data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="txnVolumeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--ink-muted)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--ink-muted)" />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Volume"]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid var(--glass-border)",
                  backgroundColor: "var(--glass-bg)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="var(--accent-primary)"
                fill="url(#txnVolumeFill)"
                strokeWidth={2.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

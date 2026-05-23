import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { AccountResponseDTO } from "@/types/api";

interface Props {
  accounts: AccountResponseDTO[];
  loading: boolean;
  title?: string;
  className?: string;
}

export default function BankDistributionChart({
  accounts,
  loading,
  title = "Top Banks by Account Count",
  className,
}: Props) {
  const data = Array.from(
    accounts.reduce((acc, item) => {
      acc.set(item.bankName, (acc.get(item.bankName) || 0) + 1);
      return acc;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([bank, count]) => ({ bank, accounts: count }));

  return (
    <div className={`glass-panel rounded-2xl p-4 mb-6 ${className || ""}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">Distribution</span>
      </div>
      <div className="h-[250px]">
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            No bank distribution data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
              <XAxis dataKey="bank" tick={{ fontSize: 12 }} stroke="var(--ink-muted)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--ink-muted)" />
              <Tooltip
                formatter={(value: number) => [value, "Accounts"]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid var(--glass-border)",
                  backgroundColor: "var(--glass-bg)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              />
              <Bar dataKey="accounts" fill="var(--accent-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AccountResponseDTO } from "@/types/api";

interface Props {
  accounts: AccountResponseDTO[];
  loading: boolean;
  title?: string;
  className?: string;
}

const BankDistributionChart = ({
  accounts,
  loading,
  title = "Top Banks by Account Count",
  className,
}: Props) => {
  // Memoize the data transformation to avoid recalculating on each render
  const data = useMemo(() => {
    if (!accounts || accounts.length === 0) return [];

    const bankCounts = accounts.reduce((acc, item) => {
      const bankName = item.bankName || "Unknown Bank";
      acc.set(bankName, (acc.get(bankName) || 0) + 1);
      return acc;
    }, new Map<string, number>());

    return Array.from(bankCounts.entries())
      .sort((a, b) => b[1] - a[1]) // descending by count
      .slice(0, 6)
      .map(([bank, count]) => ({ bank, accounts: count }));
  }, [accounts]);

  // If no data and not loading, show empty state
  const hasData = data.length > 0;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl p-4 mb-6",
        "transition-all duration-300 hover:bg-card/80 hover:border-border/60",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">Distribution</span>
      </div>

      <div className="h-[250px] w-full">
        {loading ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : !hasData ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            {accounts.length === 0
              ? "No accounts available"
              : "No bank distribution data to display"}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              // Accessibility
              role="img"
              aria-label={`Bar chart showing ${title}`}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="bank"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                formatter={(value: number) => [`${value} account${value > 1 ? "s" : ""}`, "Count"]}
                labelFormatter={(label) => `Bank: ${label}`}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--card))",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                  padding: "8px 12px",
                }}
                itemStyle={{
                  color: "hsl(var(--foreground))",
                  fontSize: "13px",
                }}
                labelStyle={{
                  color: "hsl(var(--muted-foreground))",
                  fontSize: "11px",
                  fontWeight: 500,
                  marginBottom: "4px",
                }}
              />
              <Bar
                dataKey="accounts"
                fill="hsl(var(--primary))"
                radius={[6, 6, 0, 0]}
                // Optional: add a gradient or hover effect
                // You can wrap Bar with <Bar ... /> and use fillOpacity etc.
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default BankDistributionChart;
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardTransaction } from "@/hooks/useDashboardData";

interface Props {
  transactions: DashboardTransaction[];
  loading: boolean;
  title?: string;
  className?: string;
}

export default function TransactionHealthChart({
  transactions,
  loading,
  title = "Transaction Health",
  className,
}: Props) {
  const data = [
    {
      name: "Success",
      value: transactions.filter((t) => t.status === "SUCCESS" || t.status === "COMPLETED").length,
      color: "hsl(var(--success))",
    },
    {
      name: "Pending",
      value: transactions.filter((t) => t.status === "PENDING" || t.status === "PROCESSING").length,
      color: "hsl(var(--warning))",
    },
    {
      name: "Failed",
      value: transactions.filter((t) => t.status === "FAILED").length,
      color: "hsl(var(--destructive))",
    },
  ].filter((d) => d.value > 0);

  return (
    <div className={`glass-panel rounded-2xl p-4 ${className || ""}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">Status</span>
      </div>
      <div className="h-[260px]">
        {loading ? (
          <div className="space-y-3 p-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-[210px] w-full" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={54} outerRadius={84} paddingAngle={4}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid var(--glass-border)",
                  backgroundColor: "var(--glass-bg)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

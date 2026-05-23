import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
  positive?: boolean;
}

export default function Sparkline({
  data,
  color,
  height = 36,
  className,
  positive,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const resolvedColor =
    color ?? (positive === false ? "#ef4444" : "#6366f1");

  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={resolvedColor}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          <Tooltip
            content={() => null}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

import { motion } from "framer-motion";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { cn } from "@/lib/utils";

interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface FuturisticChartProps {
  data: ChartDataPoint[];
  title?: string;
  type?: "area" | "bar" | "pie" | "line";
  dataKey?: string;
  colors?: string[];
  height?: number;
  className?: string;
  loading?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  animated?: boolean;
}

const DEFAULT_COLORS = ["#22d3ee", "#a78bfa", "#10b981", "#f59e0b", "#f43f5e", "#6366f1"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 rounded-lg border border-cyan-500/30 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div className="animate-pulse" style={{ height }}>
      <div className="h-full bg-white/5 rounded-lg" />
    </div>
  );
}

function FuturisticAreaChart({ data, dataKey = "value", colors = DEFAULT_COLORS, height = 300 }: {
  data: ChartDataPoint[];
  dataKey: string;
  colors: string[];
  height: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors[0]} stopOpacity={0.4} />
            <stop offset="95%" stopColor={colors[0]} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
        <XAxis 
          dataKey="name" 
          stroke="rgba(255,255,255,0.5)" 
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="rgba(255,255,255,0.5)" 
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={colors[0]}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorValue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function FuturisticBarChart({ data, dataKey = "value", colors = DEFAULT_COLORS, height = 300 }: {
  data: ChartDataPoint[];
  dataKey: string;
  colors: string[];
  height: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
        <XAxis 
          dataKey="name" 
          stroke="rgba(255,255,255,0.5)" 
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="rgba(255,255,255,0.5)" 
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey={dataKey} 
          radius={[4, 4, 0, 0]}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function FuturisticPieChart({ data, colors = DEFAULT_COLORS, height = 300 }: {
  data: ChartDataPoint[];
  colors: string[];
  height: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function FuturisticLineChart({ data, dataKey = "value", colors = DEFAULT_COLORS, height = 300 }: {
  data: ChartDataPoint[];
  dataKey: string;
  colors: string[];
  height: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
        <XAxis 
          dataKey="name" 
          stroke="rgba(255,255,255,0.5)" 
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="rgba(255,255,255,0.5)" 
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={colors[0]}
          strokeWidth={2}
          dot={{ fill: colors[0], strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function FuturisticChart({
  data,
  title,
  type = "area",
  dataKey = "value",
  colors = DEFAULT_COLORS,
  height = 300,
  className,
  loading = false,
  showGrid = true,
  showTooltip = true,
  animated = true,
}: FuturisticChartProps) {
  if (loading) {
    return <ChartSkeleton height={height} />;
  }

  const ChartComponent = {
    area: FuturisticAreaChart,
    bar: FuturisticBarChart,
    pie: FuturisticPieChart,
    line: FuturisticLineChart,
  }[type];

  return (
    <motion.div
      initial={animated ? { opacity: 0 } : undefined}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn("chart-container-futuristic", className)}
    >
      {title && (
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-cyan-400 rounded-full" />
          {title}
        </h3>
      )}
      <ChartComponent data={data} dataKey={dataKey} colors={colors} height={height} />
    </motion.div>
  );
}

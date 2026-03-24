import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface SalesChartProps {
  data: { date: string; value: number }[];
}

export default function SalesChart({ data }: SalesChartProps) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm p-5 h-72">
      <div className="text-sm text-neutral-500 mb-2">Sales (last 30d)</div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" hide />
          <YAxis hide />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

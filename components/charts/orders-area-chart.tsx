"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPayload } from "@/types/dashboard";

/**
 * Renders a Chart.js-style payload (labels + datasets[0]) as a line chart,
 * matching the reference "Monthly Placed Orders" widget (green line).
 */
export function OrdersAreaChart({ payload }: { payload: ChartPayload }) {
  const dataset = payload.datasets?.[0];
  const data = payload.labels.map((label, i) => ({
    label,
    Orders: dataset?.data?.[i] ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 4" className="stroke-muted" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={16}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={44}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "1px solid var(--border)",
            fontSize: 12,
          }}
        />
        <Legend iconType="rect" wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="Orders"
          stroke="#22a34a"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

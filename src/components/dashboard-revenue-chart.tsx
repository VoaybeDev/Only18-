import { formatCurrency } from "@/lib/utils";

interface ChartDatum {
  label: string;
  value: number;
}

interface DashboardRevenueChartProps {
  data: ChartDatum[];
}

export function DashboardRevenueChart({ data }: DashboardRevenueChartProps) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium">{formatCurrency(item.value)}</span>
          </div>
          <div className="h-3 rounded-full bg-white/5">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-pink-500 to-blue-500"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

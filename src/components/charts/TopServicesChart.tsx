'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { TopServiceData } from '@/app/actions/analytics';

interface Props {
  data: TopServiceData[];
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const chartConfig = {
  totalVentas: {
    label: 'Ingresos Generados',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${value}`;
};

export function TopServicesChart({ data }: Props) {
  return (
    <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white h-full">
      <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 sm:p-8">
        <CardTitle className="text-xl sm:text-2xl font-black tracking-tight text-slate-800">
          Top Servicios / Menús
        </CardTitle>
        <CardDescription className="text-slate-400 font-medium mt-1">
          Servicios con mayor ingresos generados en todos los presupuestos.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {!data || data.length === 0 ? (
          <div className="h-[260px] flex items-center justify-center">
            <p className="text-sm text-slate-400 font-medium">No hay datos de servicios disponibles.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 40 }} layout="vertical">
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number"
                tickFormatter={formatCurrency}
                tickLine={false}
                axisLine={false}
                className="font-mono text-[10px] text-slate-400"
              />
              <YAxis
                type="category"
                dataKey="nombre"
                tickLine={false}
                axisLine={false}
                width={130}
                tick={{ fontSize: 10, fontWeight: 600 }}
                tickFormatter={(v: string) => (v.length > 18 ? v.slice(0, 18) + '…' : v)}
              />
              <ChartTooltip
                cursor={{ fill: '#f8fafc' }}
                content={<ChartTooltipContent />}
              />
              <Bar dataKey="totalVentas" radius={[0, 6, 6, 0]} barSize={22}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

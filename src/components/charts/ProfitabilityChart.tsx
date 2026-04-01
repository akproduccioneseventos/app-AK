'use client';

import { Bar, CartesianGrid, XAxis, YAxis, Line, ComposedChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { MonthlyProfitabilityData } from '@/app/actions/analytics';

interface Props {
  data: MonthlyProfitabilityData[];
}

const chartConfig = {
  ingresos: {
    label: 'Ingresos',
    color: 'hsl(var(--chart-2))',
  },
  costos: {
    label: 'Costos',
    color: 'hsl(var(--chart-5))',
  },
  rentabilidad: {
    label: 'Rentabilidad Neta',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${value}`;
};

export function ProfitabilityChart({ data }: Props) {
  return (
    <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white">
      <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 sm:p-8">
        <CardTitle className="text-xl sm:text-2xl font-black tracking-tight text-slate-800">
          Rentabilidad Mensual Neta
        </CardTitle>
        <CardDescription className="text-slate-400 font-medium">
          Comparativa de ingresos vs. costos y rentabilidad neta por mes (últimos 12 meses).
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {!data || data.length === 0 ? (
          <div className="h-[350px] flex items-center justify-center">
            <p className="text-sm text-slate-400 font-medium">No hay datos suficientes para mostrar este gráfico.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <ComposedChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(v) => v.slice(0, 3)}
                className="font-bold text-[10px] uppercase tracking-widest text-slate-400"
              />
              <YAxis
                tickFormatter={formatCurrency}
                axisLine={false}
                tickLine={false}
                className="font-mono text-[10px] text-slate-400"
              />
              <ChartTooltip
                cursor={{ fill: '#f8fafc' }}
                content={<ChartTooltipContent indicator="dashed" />}
              />
              <Bar dataKey="ingresos" fill="var(--color-ingresos)" radius={[4, 4, 0, 0]} barSize={32} />
              <Bar dataKey="costos" fill="var(--color-costos)" radius={[4, 4, 0, 0]} barSize={32} />
              <Line
                type="monotone"
                dataKey="rentabilidad"
                stroke="var(--color-rentabilidad)"
                strokeWidth={3}
                dot={{ r: 4, fill: 'var(--color-rentabilidad)', strokeWidth: 2, stroke: '#fff' }}
              />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

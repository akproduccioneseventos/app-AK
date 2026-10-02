
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend, Line, ComposedChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { CashFlowMonth } from '@/app/actions/dashboard';

interface Props {
  data: CashFlowMonth[];
}

const chartConfig = {
  income: {
    label: 'Ingresos (Cobros)',
    color: 'hsl(var(--chart-2))',
  },
  expenses: {
    label: 'Egresos (Costos)',
    color: 'hsl(var(--chart-5))',
  },
  balance: {
    label: 'Balance Neto',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function CashFlowProjectionChart({ data }: Props) {
  return (
    <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white">
      <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 sm:p-8">
        <CardTitle className="text-xl sm:text-2xl font-black tracking-tight text-slate-800">Proyección de Flujo de Caja</CardTitle>
        <CardDescription className="text-slate-400 font-medium">Comparativa mensual de ingresos por cobrar vs. egresos operativos.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ComposedChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              className="font-bold text-[10px] uppercase tracking-widest text-slate-400"
            />
            <YAxis 
                tickFormatter={(value) => {
                  if (value === 0) return '$0';
                  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                  if (Math.abs(value) >= 1000) return `$${Math.round(value / 1000)}k`;
                  return `$${value}`;
                }} 
                axisLine={false}
                tickLine={false}
                className="font-mono text-[10px] text-slate-400"
            />
            <ChartTooltip
              cursor={{ fill: '#f8fafc' }}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Legend verticalAlign="top" height={36} className="text-[10px] font-black uppercase tracking-widest" />
            <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} barSize={40} />
            <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} barSize={40} />
            <Line type="monotone" dataKey="balance" stroke="var(--color-balance)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-balance)", strokeWidth: 2, stroke: "#fff" }} />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

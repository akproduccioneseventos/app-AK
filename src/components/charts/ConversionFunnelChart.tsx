'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ConversionData } from '@/app/actions/analytics';

interface Props {
  data: ConversionData[];
  tasaConversion: number;
}

const chartConfig = {
  value: {
    label: 'Presupuestos',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function ConversionFunnelChart({ data, tasaConversion }: Props) {
  return (
    <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white h-full">
      <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl sm:text-2xl font-black tracking-tight text-slate-800">
              Tasa de Conversión
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium mt-1">
              Presupuestos enviados vs. eventos contratados.
            </CardDescription>
          </div>
          <div className="text-right shrink-0">
            <p className="text-4xl font-black text-primary">{tasaConversion}%</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Tasa actual</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {!data || data.every(d => d.value === 0) ? (
          <div className="h-[260px] flex items-center justify-center">
            <p className="text-sm text-slate-400 font-medium">No hay datos de conversión disponibles.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 10 }} layout="vertical">
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tickLine={false} axisLine={false} className="font-mono text-[10px] text-slate-400" />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={110}
                className="font-bold text-[10px] uppercase tracking-tighter text-slate-400"
              />
              <ChartTooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltipContent />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

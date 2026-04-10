'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { EventTypeProfitabilityData } from '@/app/actions/analytics';

interface Props {
  data: EventTypeProfitabilityData[];
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
} satisfies ChartConfig;

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${value}`;
};

export function EventTypeProfitabilityChart({ data }: Props) {
  return (
    <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white">
      <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 sm:p-8">
        <CardTitle className="text-xl sm:text-2xl font-black tracking-tight text-slate-800">
          Rentabilidad por Tipo de Evento
        </CardTitle>
        <CardDescription className="text-slate-400 font-medium">
          Ingresos, costos y margen bruto por categoría de evento.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {!data || data.length === 0 ? (
          <div className="h-[320px] flex items-center justify-center">
            <p className="text-sm text-slate-400 font-medium">No hay datos suficientes para mostrar este gráfico.</p>
          </div>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="h-[320px] w-full">
              <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="tipo"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
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
                <Bar dataKey="ingresos" fill="var(--color-ingresos)" radius={[4, 4, 0, 0]} barSize={28} />
                <Bar dataKey="costos" fill="var(--color-costos)" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ChartContainer>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {data.map(item => (
                <div key={item.tipo} className="bg-slate-50 rounded-2xl p-3 flex flex-col gap-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.tipo}</span>
                  <span className="text-base font-black text-slate-800">{item.margenBruto}% margen</span>
                  <span className="text-[11px] font-semibold text-slate-500">{item.cantidad} evento(s)</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

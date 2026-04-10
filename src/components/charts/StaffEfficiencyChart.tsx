'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Users } from 'lucide-react';
import type { StaffEfficiencyData } from '@/app/actions/analytics';
import { cn } from '@/lib/utils';

interface Props {
  data: StaffEfficiencyData[];
}

const chartConfig = {
  eficiencia: {
    label: 'Ratio Eficiencia (ingresos/salario)',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const EFFICIENCY_COLORS = [
  'hsl(var(--chart-2))',
  'hsl(var(--chart-1))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${value}`;
};

export function StaffEfficiencyChart({ data }: Props) {
  return (
    <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white">
      <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50">
            <Users className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <CardTitle className="text-xl sm:text-2xl font-black tracking-tight text-slate-800">
              Eficiencia del Personal
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium">
              Ratio de ingresos generados vs. costo salarial por empleado.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {!data || data.length === 0 ? (
          <div className="h-[320px] flex items-center justify-center">
            <p className="text-sm text-slate-400 font-medium">No hay datos de personal asignado a eventos.</p>
          </div>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="nombre"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  label={{ value: 'Ratio', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }}
                />
                <ChartTooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="eficiencia" radius={[6, 6, 0, 0]} barSize={32}>
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={EFFICIENCY_COLORS[index % EFFICIENCY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>

            <div className="mt-4 space-y-2">
              {data.map((staff, i) => (
                <div key={staff.empleadoId} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: EFFICIENCY_COLORS[i % EFFICIENCY_COLORS.length] }}
                  />
                  <span className="font-bold text-sm text-slate-700 flex-1 truncate">{staff.nombre}</span>
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <span>{staff.eventosAsignados} evento(s)</span>
                    <span className="hidden sm:inline">{formatCurrency(staff.totalSalario)} costo</span>
                    <span
                      className={cn(
                        'font-black px-2 py-0.5 rounded-full text-[11px]',
                        staff.eficiencia >= 5
                          ? 'bg-emerald-100 text-emerald-700'
                          : staff.eficiencia >= 2
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      )}
                    >
                      {staff.eficiencia}x
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

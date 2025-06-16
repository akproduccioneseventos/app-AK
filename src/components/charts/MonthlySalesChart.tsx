
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart'; // Assuming ChartConfig is exported

export interface MonthlyChartData {
  month: string;
  ventas: number; // Total facturado
  pagos: number;  // Total recibido
}

interface MonthlySalesChartProps {
  data: MonthlyChartData[];
}

const chartConfig = {
  ventas: {
    label: 'Ventas Facturadas',
    color: 'hsl(var(--chart-1))',
  },
  pagos: {
    label: 'Pagos Recibidos',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function MonthlySalesChart({ data }: MonthlySalesChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="h-[300px] flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground">No hay datos suficientes para mostrar el gráfico mensual.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg">Evolución Mensual (Últimos 12M)</CardTitle>
        <CardDescription>Ventas facturadas vs. Pagos recibidos por mes.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart accessibilityLayer data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Legend />
            <Bar dataKey="ventas" fill="var(--color-ventas)" radius={4} />
            <Bar dataKey="pagos" fill="var(--color-pagos)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}


'use client';

import { Pie, PieChart, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

export interface PaymentPieChartData {
  name: string;
  value: number;
  fill: string;
}

interface PaymentStatusPieChartProps {
  data: PaymentPieChartData[];
}

const chartConfig = {
    pagado: {
      label: "Pagado",
      color: "hsl(var(--chart-2))", // Greenish
    },
    pendiente: {
      label: "Pendiente",
      color: "hsl(var(--chart-5))", // Reddish/Orangish
    },
} satisfies ChartConfig

export function PaymentStatusPieChart({ data }: PaymentStatusPieChartProps) {
  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return (
      <Card className="h-[300px] flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground">No hay datos de pagos para mostrar el gráfico.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg">Distribución de Pagos</CardTitle>
        <CardDescription>Proporción de monto pagado vs. pendiente (sobre ventas confirmadas).</CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <PieChart accessibilityLayer>
            <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="name" />}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              labelLine={false}
              label={({ percent, name }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
              ))}
            </Pie>
            <Legend wrapperStyle={{fontSize: '0.8rem'}}/>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

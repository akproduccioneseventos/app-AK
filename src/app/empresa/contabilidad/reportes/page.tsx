
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Filter, BarChart3, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
    
const formatCurrency = (amount: number) => new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

export default function GananciasYPerdidasPage() {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
    
  // Placeholder data
  const ingresos = 125000;
  const costos = 78000;
  const gananciaNeta = ingresos - costos;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Reporte de Ganancias y Pérdidas
          </h1>
        </div>
        <Link href="/empresa/contabilidad" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Contabilidad
          </Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><Filter className="text-primary"/>Filtros del Reporte</CardTitle>
          <CardDescription>Selecciona el rango de fechas para generar el reporte. La funcionalidad completa está en desarrollo.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Fecha de Inicio</Label>
            <DatePickerDemo selectedDate={startDate} onDateChange={setStartDate} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">Fecha de Fin</Label>
            <DatePickerDemo selectedDate={endDate} onDateChange={setEndDate} />
          </div>
        </CardContent>
        <CardFooter>
             <Button disabled>
                Generar Reporte (En desarrollo)
            </Button>
        </CardFooter>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Resumen del Periodo (Datos de Ejemplo)</CardTitle>
            <CardDescription>
                Desde {startDate?.toLocaleDateString('es-ES')} hasta {endDate?.toLocaleDateString('es-ES')}
            </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="p-4 border rounded-lg bg-green-50 text-green-800">
                <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-5 h-5"/> <h3 className="font-semibold">Ingresos Totales</h3></div>
                <p className="text-2xl font-bold">{formatCurrency(ingresos)}</p>
            </div>
             <div className="p-4 border rounded-lg bg-red-50 text-red-800">
                <div className="flex items-center gap-2 mb-1"><TrendingDown className="w-5 h-5"/> <h3 className="font-semibold">Costos Totales</h3></div>
                <p className="text-2xl font-bold">{formatCurrency(costos)}</p>
            </div>
             <div className="p-4 border rounded-lg bg-blue-50 text-blue-800">
                <div className="flex items-center gap-2 mb-1"><DollarSign className="w-5 h-5"/> <h3 className="font-semibold">Ganancia Neta</h3></div>
                <p className="text-2xl font-bold">{formatCurrency(gananciaNeta)}</p>
            </div>
        </CardContent>
         <CardFooter className="text-sm text-muted-foreground">
            <p>Próximamente: desglose detallado de ingresos por evento y costos por categoría.</p>
        </CardFooter>
      </Card>
    </div>
  );
}

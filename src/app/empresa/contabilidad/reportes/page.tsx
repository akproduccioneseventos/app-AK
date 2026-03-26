
'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Filter, BarChart3, TrendingUp, TrendingDown, DollarSign, Loader2, AlertTriangle, Eye, Share2, Printer } from 'lucide-react';
import { getProfitAndLossData, type ProfitAndLossData } from '@/app/actions/reportes';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const formatCurrency = (amount: number) => new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-ES');

export default function GananciasYPerdidasPage() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [reportData, setReportData] = useState<ProfitAndLossData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handlePrint = () => window.print();

  const handleGenerateReport = useCallback(async () => {
    if (!startDate || !endDate) {
      toast({ title: "Fechas requeridas", description: "Por favor selecciona un rango de fechas.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setError(null);
    setReportData(null);
    try {
      const result = await getProfitAndLossData({ from: startDate, to: endDate });
      if (result.success && result.data) {
        setReportData(result.data);
      } else {
        throw new Error(result.error || "No se pudo generar el reporte.");
      }
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, toast]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Reporte de Ganancias y Pérdidas
          </h1>
        </div>
        <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline" size="sm"><Eye className="w-4 h-4 mr-1.5"/>Vista Previa</Button>
            <Button onClick={handlePrint} size="sm"><Printer className="w-4 h-4 mr-1.5"/>Imprimir / PDF</Button>
            <Link href="/empresa/contabilidad">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Contabilidad
              </Button>
            </Link>
        </div>
      </div>
      
      <Card className="shadow-lg print:hidden">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><Filter className="text-primary"/>Filtros del Reporte</CardTitle>
          <CardDescription>Selecciona el rango de fechas para generar el reporte.</CardDescription>
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
             <Button onClick={handleGenerateReport} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <BarChart3 className="w-4 h-4 mr-2"/>}
                {isLoading ? "Generando..." : "Generar Reporte"}
            </Button>
        </CardFooter>
      </Card>
      
      {isLoading && (
        <div className="text-center py-10">
          <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary"/>
          <p className="mt-2 text-muted-foreground">Calculando resultados...</p>
        </div>
      )}

      {error && (
         <AlertTriangle className="mx-auto w-8 h-8 mb-2 text-destructive"/>
      )}

      {reportData && (
        <>
          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Resumen del Periodo</CardTitle>
                <CardDescription>
                    Desde {startDate?.toLocaleDateString('es-ES')} hasta {endDate?.toLocaleDateString('es-ES')}
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <div className="p-4 border rounded-lg bg-green-50 text-green-800">
                    <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-5 h-5"/> <h3 className="font-semibold">Ingresos Totales</h3></div>
                    <p className="text-2xl font-bold">{formatCurrency(reportData.ingresos.total)}</p>
                </div>
                 <div className="p-4 border rounded-lg bg-red-50 text-red-800">
                    <div className="flex items-center gap-2 mb-1"><TrendingDown className="w-5 h-5"/> <h3 className="font-semibold">Costos Totales</h3></div>
                    <p className="text-2xl font-bold">{formatCurrency(reportData.costos.total)}</p>
                </div>
                 <div className="p-4 border rounded-lg bg-blue-50 text-blue-800">
                    <div className="flex items-center gap-2 mb-1"><DollarSign className="w-5 h-5"/> <h3 className="font-semibold">Ganancia Neta</h3></div>
                    <p className="text-2xl font-bold">{formatCurrency(reportData.gananciaNeta)}</p>
                </div>
                 <div className="p-4 border rounded-lg bg-purple-50 text-purple-800">
                    <div className="flex items-center gap-2 mb-1"><BarChart3 className="w-5 h-5"/> <h3 className="font-semibold">Margen de Ganancia</h3></div>
                    <p className="text-2xl font-bold">{reportData.margen.toFixed(2)}%</p>
                </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="font-headline text-lg">Detalle de Ingresos ({reportData.ingresos.detalle.length})</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-72">
                  <Table>
                    <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Concepto</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {reportData.ingresos.detalle.map(item => (
                        <TableRow key={item.id}><TableCell>{formatDate(item.fecha)}</TableCell><TableCell>{item.concepto}</TableCell><TableCell className="text-right font-medium">{formatCurrency(item.monto)}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
             <Card>
              <CardHeader><CardTitle className="font-headline text-lg">Detalle de Costos ({reportData.costos.detalle.length})</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-72">
                  <Table>
                    <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Concepto</TableHead><TableHead>Categoría</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {reportData.costos.detalle.map(item => (
                        <TableRow key={item.id}><TableCell>{formatDate(item.fecha)}</TableCell><TableCell>{item.concepto}</TableCell><TableCell>{item.categoria}</TableCell><TableCell className="text-right font-medium">{formatCurrency(item.monto)}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

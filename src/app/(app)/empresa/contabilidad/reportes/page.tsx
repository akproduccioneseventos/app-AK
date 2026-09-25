'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Filter,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Loader2,
  AlertTriangle,
  Eye,
  Printer,
  Mail,
  Download,
} from 'lucide-react';
import { getProfitAndLossData, mandarAlContador, getEmailContador, type ProfitAndLossData } from '@/app/actions/reportes';
import { armarResumenParaElContador } from '@/lib/contabilidad/resumen-para-el-contador';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-ES');

const MESES_NOMBRES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

function ReportesContabilidadContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const mesParam = searchParams.get('mes');

  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    if (mesParam && /^\d{4}-\d{2}$/.test(mesParam)) {
      const [y, m] = mesParam.split('-').map(Number);
      return new Date(y, m - 1, 1, 0, 0, 0, 0);
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });

  const [endDate, setEndDate] = useState<Date | undefined>(() => {
    if (mesParam && /^\d{4}-\d{2}$/.test(mesParam)) {
      const [y, m] = mesParam.split('-').map(Number);
      return new Date(y, m, 0, 23, 59, 59, 999);
    }
    return new Date();
  });

  const [reportData, setReportData] = useState<ProfitAndLossData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailContador, setEmailContador] = useState<string | null>(null);
  const [isSendingContador, setIsSendingContador] = useState(false);
  // El período del reporte que se ve: el resumen al contador se recalcula en el servidor con él.
  const [rangoDelReporte, setRangoDelReporte] = useState<{ from: Date; to: Date } | null>(null);

  useEffect(() => {
    getEmailContador()
      .then((email) => {
        setEmailContador(email || null);
      })
      .catch(() => {});
  }, []);

  const handleGenerateReport = useCallback(async (customStart?: Date, customEnd?: Date) => {
    const from = customStart || startDate;
    const to = customEnd || endDate;
    if (!from || !to) {
      toast({ title: 'Fechas requeridas', description: 'Por favor selecciona un rango de fechas.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    setError(null);
    setReportData(null);
    try {
      const result = await getProfitAndLossData({ from, to });
      if (result.success && result.data) {
        setReportData(result.data);
        setRangoDelReporte({ from, to });
      } else {
        throw new Error(result.error || 'No se pudo generar el reporte.');
      }
    } catch (err: any) {
      setError(err.message);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, toast]);

  useEffect(() => {
    if (mesParam && /^\d{4}-\d{2}$/.test(mesParam)) {
      const [y, m] = mesParam.split('-').map(Number);
      const desde = new Date(y, m - 1, 1, 0, 0, 0, 0);
      const hasta = new Date(y, m, 0, 23, 59, 59, 999);
      setStartDate(desde);
      setEndDate(hasta);
      handleGenerateReport(desde, hasta);
    }
  }, [mesParam, handleGenerateReport]);

  const handlePrint = () => window.print();

  const getNombreMes = (): string => {
    if (startDate) {
      return `${MESES_NOMBRES[startDate.getMonth()]} de ${startDate.getFullYear()}`;
    }
    return 'el período';
  };

  const handleMandarAlContador = async () => {
    if (!reportData || !rangoDelReporte) return;
    if (!emailContador) {
      toast({
        title: 'Falta mail del contador',
        description: 'Cargá el mail del contador en Ajustes de Empresa para mandarle el resumen con un toque.',
        variant: 'destructive',
      });
      return;
    }
    setIsSendingContador(true);
    try {
      const res = await mandarAlContador(rangoDelReporte, getNombreMes());
      if (res.success) {
        toast({
          title: '¡Resumen enviado!',
          description: `Se envió el resumen y la planilla a ${res.enviadoA || emailContador}.`,
        });
      } else {
        toast({
          title: 'No se pudo enviar',
          description: res.error || 'Ocurrió un error al enviar el correo.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error de envío',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSendingContador(false);
    }
  };

  const handleBajarPlanilla = () => {
    if (!reportData) return;
    const { csv } = armarResumenParaElContador(reportData, getNombreMes());
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `resumen-${getNombreMes().toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Planilla descargada', description: 'El archivo .csv se descargó en tu equipo.' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <TrendingUp className="w-8 h-8 shrink-0 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight font-headline sm:text-3xl">
            Reporte de Ganancias y Pérdidas
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-1.5" />
            Vista Previa
          </Button>
          <Button onClick={handlePrint} size="sm">
            <Printer className="w-4 h-4 mr-1.5" />
            Imprimir / PDF
          </Button>
          <Button asChild variant="outline">
            <Link href="/empresa/contabilidad">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Contabilidad
            </Link>
          </Button>
        </div>
      </div>

      <Card className="shadow-lg print:hidden">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2">
            <Filter className="text-primary" />
            Filtros del Reporte
          </CardTitle>
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
          <Button onClick={() => handleGenerateReport()} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}
            {isLoading ? 'Generando...' : 'Generar Reporte'}
          </Button>
        </CardFooter>
      </Card>

      {isLoading && (
        <div className="text-center py-10">
          <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Calculando resultados...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <AlertTriangle className="mx-auto w-8 h-8 mb-2 text-destructive" />
          <p className="font-semibold text-destructive">No se pudo armar el reporte</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
      )}

      {reportData && (
        <>
          <Card className="shadow-lg">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Resumen del Periodo</CardTitle>
                <CardDescription>
                  Desde {startDate?.toLocaleDateString('es-ES')} hasta {endDate?.toLocaleDateString('es-ES')}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <Button
                  onClick={handleBajarPlanilla}
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Bajar planilla
                </Button>

                {emailContador ? (
                  <Button
                    onClick={handleMandarAlContador}
                    disabled={isSendingContador}
                    size="sm"
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isSendingContador ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                    Mandar al contador
                  </Button>
                ) : (
                  <Button
                    onClick={handleMandarAlContador}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-muted-foreground border-dashed"
                  >
                    <Mail className="w-4 h-4" />
                    Falta mail del contador en Ajustes
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg bg-green-50 text-green-800">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5" />
                  <h3 className="font-semibold">Ingresos Totales</h3>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(reportData.ingresos.total)}</p>
              </div>
              <div className="p-4 border rounded-lg bg-red-50 text-red-800">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-5 h-5" />
                  <h3 className="font-semibold">Costos Totales</h3>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(reportData.costos.total)}</p>
              </div>
              <div className="p-4 border rounded-lg bg-blue-50 text-blue-800">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-5 h-5" />
                  <h3 className="font-semibold">Ganancia Neta</h3>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(reportData.gananciaNeta)}</p>
              </div>
              <div className="p-4 border rounded-lg bg-purple-50 text-purple-800">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-5 h-5" />
                  <h3 className="font-semibold">Margen de Ganancia</h3>
                </div>
                <p className="text-2xl font-bold">{reportData.margen.toFixed(2)}%</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-lg">
                  Detalle de Ingresos ({reportData.ingresos.detalle.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-72">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.ingresos.detalle.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{formatDate(item.fecha)}</TableCell>
                          <TableCell>{item.concepto}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.monto)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-lg">
                  Detalle de Costos ({reportData.costos.detalle.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-72">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.costos.detalle.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{formatDate(item.fecha)}</TableCell>
                          <TableCell>{item.concepto}</TableCell>
                          <TableCell>{item.categoria}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.monto)}</TableCell>
                        </TableRow>
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

export default function GananciasYPerdidasPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ReportesContabilidadContent />
    </Suspense>
  );
}


'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer as PrinterIcon, Share2, TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getProfitAndLossData, type ProfitAndLossData } from '@/app/actions/reportes';
import { WatermarkedImage } from '@/components/watermarked-image';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const formatCurrency = (amount: number) => new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-ES');

function ReporteEventoContent({ fiestaId }: { fiestaId: string | null }) {
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ProfitAndLossData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const fetchReportData = useCallback(async () => {
    if (!fiestaId) {
        setError("Falta el ID del evento.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // NOTE: This report page is not fully implemented to filter by a specific event.
      // It currently shows the Profit & Loss for a default or broader range.
      // This would need to be updated in `reportes.ts` to accept and use a `fiestaId`.
      const [reportResult, settings] = await Promise.all([
          getProfitAndLossData({from: new Date(2000, 1, 1), to: new Date(2100, 1, 1)}), // Placeholder date range
          getInvoiceTemplateSettings()
      ]);
      
      if (reportResult.success && reportResult.data) {
        // Placeholder for event-specific name, as the backend doesn't filter yet.
        setReportData({...(reportResult.data), nombreEvento: 'Evento Actual'}); 
      } else {
        throw new Error(reportResult.error || "No se pudo generar el reporte.");
      }
      setLogoUrl(settings.logoUrl);

    } catch (err: any) {
      setError(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);
  
  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareData = {
      title: `Reporte Financiero - ${reportData?.nombreEvento}`,
      text: `Resumen financiero para el evento ${reportData?.nombreEvento}.`,
      url: window.location.href,
    };
    if (typeof navigator.share !== 'undefined' && navigator.canShare(shareData)) {
        navigator.share(shareData).catch(err => console.error("Error al compartir:", err));
    } else {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text + '\n' + shareData.url)}`;
        window.open(whatsappUrl, '_blank');
    }
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>;
  }
  
  if (error || !reportData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
          <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Error al Generar Reporte</h1>
          <p className="text-muted-foreground mt-2">{error || "No se encontró información del evento."}</p>
          <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
            <Button variant="outline" className="mt-4">Volver</Button>
          </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
      <div className="max-w-3xl mx-auto bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2 relative">
        <div className="w-full h-24 print:h-20 mb-4 relative">
            <WatermarkedImage src={logoUrl} alt="Marca de agua" containerClassName='w-full h-full'/>
        </div>
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href={`/fiestas/nueva/gestion-costos-rentabilidad?fiestaId=${fiestaId}`}>
            <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver</Button>
          </Link>
          <div className="flex gap-2">
            <Button onClick={handleShare} variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1.5"/>Compartir por WhatsApp</Button>
            <Button onClick={handlePrint} size="sm"><PrinterIcon className="w-4 h-4 mr-1.5" />Imprimir / PDF</Button>
          </div>
        </div>

        <header className="mb-6 print:mb-3 text-center border-b pb-3 print:pb-2">
          <h1 className="text-xl font-bold text-primary print:text-lg">Reporte Financiero de Evento</h1>
          <p className="text-md text-gray-700 print:text-sm mt-1">{reportData.nombreEvento}</p>
          <p className="text-xs text-gray-500 print:text-[8pt]">Generado el: {new Date().toLocaleDateString('es-ES')}</p>
        </header>
        
        <Card className="shadow-none border-none mb-4">
            <CardHeader className="p-0 pb-2"><CardTitle className="text-lg">Resumen General</CardTitle></CardHeader>
            <CardContent className="p-0 grid grid-cols-2 lg:grid-cols-4 gap-2 text-center">
                 <div className="p-2 border rounded-md bg-green-50 text-green-800"><h3 className="text-xs font-semibold">Ingresos</h3><p className="text-lg font-bold">{formatCurrency(reportData.ingresos.total)}</p></div>
                 <div className="p-2 border rounded-md bg-red-50 text-red-800"><h3 className="text-xs font-semibold">Costos</h3><p className="text-lg font-bold">{formatCurrency(reportData.costos.total)}</p></div>
                 <div className="p-2 border rounded-md bg-blue-50 text-blue-800"><h3 className="text-xs font-semibold">Ganancia</h3><p className="text-lg font-bold">{formatCurrency(reportData.gananciaNeta)}</p></div>
                 <div className="p-2 border rounded-md bg-purple-50 text-purple-800"><h3 className="text-xs font-semibold">Margen</h3><p className="text-lg font-bold">{reportData.margen.toFixed(2)}%</p></div>
            </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
                <h3 className="text-md font-semibold mb-2 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-600"/>Detalle de Ingresos</h3>
                <div className="border rounded-md text-sm">
                    {reportData.ingresos.detalle.map(item => (
                        <div key={item.id} className="flex justify-between p-2 border-b last:border-b-0"><span>{item.concepto}</span><span className="font-medium">{formatCurrency(item.monto)}</span></div>
                    ))}
                    {reportData.ingresos.detalle.length === 0 && <p className="text-center p-4 text-muted-foreground text-xs">No hay ingresos definidos.</p>}
                </div>
            </div>
            <div>
                <h3 className="text-md font-semibold mb-2 flex items-center gap-2"><TrendingDown className="w-5 h-5 text-red-600"/>Detalle de Costos</h3>
                <div className="border rounded-md text-sm">
                     {reportData.costos.detalle.map(item => (
                        <div key={item.id} className="flex justify-between p-2 border-b last:border-b-0">
                           <div>
                             <p>{item.concepto}</p>
                             <p className="text-xs text-muted-foreground">{item.categoria}</p>
                           </div>
                           <span className="font-medium">{formatCurrency(item.monto)}</span>
                        </div>
                    ))}
                    {reportData.costos.detalle.length === 0 && <p className="text-center p-4 text-muted-foreground text-xs">No hay costos definidos.</p>}
                </div>
            </div>
        </div>

        <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-400 print:mt-5 print:pt-2 print:border-gray-300">
            <p>Reporte interno de AK Producciones.</p>
        </footer>
      </div>
    </div>
  );
}

export default function ReporteEventoPageWrapper() {
    const searchParams = useSearchParams();
    const fiestaId = searchParams.get('fiestaId');

    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>}>
            <ReporteEventoContent fiestaId={fiestaId} />
        </Suspense>
    )
}


'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, MessageSquare, Share2, ClipboardCopy, Gift, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import type { InvoiceTemplateSettings } from '@/types/settings';


const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

// Componente aislado para la vista imprimible del presupuesto
const BudgetPrintView = React.forwardRef<HTMLDivElement, { summaryData: any, settings: InvoiceTemplateSettings | null }>(({ summaryData, settings }, ref) => {
  if (!summaryData) return null;
  const costoRegalos = summaryData.regalos.reduce((sum: number, r: any) => sum + (r.total || 0), 0);
  const costoServicios = summaryData.total;
  const subtotal = costoServicios + costoRegalos;
  const descuentoGeneralMonto = (costoServicios * (summaryData.descuento || 0)) / 100;
  const ahorroTotal = costoRegalos + descuentoGeneralMonto;
  const totalFinal = costoServicios - descuentoGeneralMonto;

  return (
    <div ref={ref} className="bg-white">
        <Card className="w-full max-w-3xl shadow-lg print:shadow-none print:border-none">
            <CardHeader className="text-center p-6 bg-muted/30">
            {settings?.logoUrl ? (
                <NextImage src={settings.logoUrl} alt="Logo" width={120} height={64} className="mx-auto object-contain" data-ai-hint="company logo elegant"/>
            ) : (
                <div className="h-16 w-32 bg-gray-200 mx-auto flex items-center justify-center text-xs text-muted-foreground">Tu Logo Aquí</div>
            )}
            <CardTitle className="font-headline text-2xl mt-4">Presupuesto para Evento</CardTitle>
            <CardDescription>Generado desde el Simulador de Presupuesto al Instante</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div><p className="font-semibold">Cliente:</p><p>{summaryData.cliente}</p></div>
                <div><p className="font-semibold">Invitados:</p><p>{summaryData.invitados}</p></div>
            </div>
            <table className="w-full text-sm">
                <thead>
                <tr className="border-b">
                    <th className="text-left font-semibold py-2">Descripción</th>
                </tr>
                </thead>
                <tbody>
                {summaryData.items.map((item: any, index: number) => (
                    <tr key={index} className="border-b">
                    <td className="py-2">{item.desc}</td>
                    </tr>
                ))}
                 {summaryData.regalos.map((item: any, index: number) => (
                    <tr key={`regalo-${index}`} className="border-b">
                    <td className="py-2 flex items-center gap-2"><Gift className="w-4 h-4 text-primary"/>{item.desc}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            
             <div className="mt-6 flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between"><p>Costo de servicios:</p><p>{formatCurrency(costoServicios)}</p></div>
                    {costoRegalos > 0 && <div className="flex justify-between text-green-600"><p>Valor de regalos:</p><p>+{formatCurrency(costoRegalos)}</p></div>}
                    {descuentoGeneralMonto > 0 && <div className="flex justify-between text-green-600"><p>Descuento ({summaryData.descuento}%):</p><p>-{formatCurrency(descuentoGeneralMonto)}</p></div>}
                    <div className="flex justify-between font-bold text-lg border-t pt-2"><p>AHORRO TOTAL:</p><p className="text-green-600">{formatCurrency(ahorroTotal)}</p></div>
                    <div className="flex justify-between font-bold text-xl border-t-2 border-primary pt-2 mt-4 text-primary"><p>TOTAL FINAL:</p><p>{formatCurrency(totalFinal)}</p></div>
                </div>
            </div>
            </CardContent>
            <CardFooter className="flex-col items-center text-center p-6 bg-muted/30">
                <p className="font-semibold text-lg">Hemos recibido tu solicitud. Un asesor de AK Producciones se pondrá en contacto contigo a la brevedad.</p>
                <p className="mt-2 text-primary font-bold">¡No pierdas esta oportunidad! PODÉS SEÑAR todos los servicios por SOLO $5,000 y acceder a la promoción especial y regalos exclusivos.</p>
                <p className="text-xs text-muted-foreground mt-2">Este presupuesto es válido por 30 días.</p>
            </CardFooter>
        </Card>
    </div>
  );
});
BudgetPrintView.displayName = 'BudgetPrintView';

function ResumenContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [summaryData, setSummaryData] = useState<any | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<InvoiceTemplateSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
        setIsLoading(true);
        try {
            const data = searchParams.get('data');
            if (data) {
                setSummaryData(JSON.parse(data));
            } else {
                router.push('/armado-rapido');
                return;
            }
            const fetchedSettings = await getInvoiceTemplateSettings();
            setSettings(fetchedSettings);
        } catch (e) {
            toast({ title: "Error", description: "No se pudo leer el resumen o la configuración.", variant: "destructive" });
            router.push('/armado-rapido');
        } finally {
            setIsLoading(false);
        }
    }
    loadData();
  }, [searchParams, router, toast]);

  const handlePrint = () => {
    window.print();
  };

  const handleContactWhatsApp = () => {
    if (!summaryData) return;
    const message = `¡Hola! He generado un presupuesto para mi evento con AK Producciones a través de su sitio web y me gustaría conversar sobre los detalles. Mi nombre es ${summaryData.cliente}.`;
    const whatsappUrl = `https://wa.me/59898355530?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  const handleShare = async () => {
    if (!summaryData) return;
    const shareData = {
      title: `Presupuesto para ${summaryData.cliente}`,
      text: `¡Hola! Mira el presupuesto que armé para mi evento con AK Producciones: ${window.location.href}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error("La API para compartir no está disponible en este navegador.");
      }
    } catch (err) {
       navigator.clipboard.writeText(shareData.url);
      toast({
        title: "Enlace Copiado",
        description: "El enlace a esta página ha sido copiado a tu portapapeles.",
      });
    }
  };


  if (isLoading || !summaryData) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white flex flex-col items-center py-8">
      <div className="w-full max-w-3xl mx-auto print:hidden mb-6 flex justify-between items-center gap-4 flex-wrap">
         <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2"/> Volver a Editar</Button>
         <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleShare}><Share2 className="mr-2"/>Compartir Presupuesto</Button>
            <Button onClick={handleContactWhatsApp} className="bg-green-500 hover:bg-green-600"><MessageSquare className="mr-2"/>Contactar por WhatsApp</Button>
            <Button onClick={handlePrint}><Printer className="mr-2"/>Descargar PDF</Button>
         </div>
      </div>
      
      <div className="print-only-container">
        <BudgetPrintView summaryData={summaryData} settings={settings} ref={printRef} />
      </div>
      
      <style jsx global>{`
        @media print {
          body > *:not(.print-only-container) {
            display: none !important;
          }
          .print-only-container {
            display: block !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }
        }
        .print-only-container {
          display: block;
        }
        @media screen {
            .print-only-container > div {
                display: block;
            }
        }
      `}</style>
    </div>
  );
}

export default function ResumenPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>}>
            <ResumenContent />
        </Suspense>
    )
}

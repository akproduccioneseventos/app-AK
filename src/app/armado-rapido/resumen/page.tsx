
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, MessageSquare, ClipboardCopy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0 }).format(amount);
};

// Componente aislado para la vista imprimible del presupuesto
const BudgetPrintView = React.forwardRef<HTMLDivElement, { summaryData: any }>(({ summaryData }, ref) => {
  if (!summaryData) return null;
  const totalDescuento = summaryData.total * (summaryData.descuento / 100);
  const totalFinal = summaryData.total - totalDescuento;

  return (
    <div ref={ref} className="bg-white">
        <Card className="w-full max-w-3xl shadow-lg print:shadow-none print:border-none">
            <CardHeader className="text-center p-6 bg-muted/30">
            <Image src="https://placehold.co/150x80.png?text=AK+Logo" alt="Logo" width={120} height={64} className="mx-auto" data-ai-hint="company logo elegant"/>
            <CardTitle className="font-headline text-2xl mt-4">Presupuesto para Evento</CardTitle>
            <CardDescription>Generado por Armado Rápido</CardDescription>
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
                    <th className="text-right font-semibold py-2">Total</th>
                </tr>
                </thead>
                <tbody>
                {summaryData.items.map((item: any, index: number) => (
                    <tr key={index} className="border-b">
                    <td className="py-2">{item.desc}</td>
                    <td className="text-right py-2">{item.total}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            <div className="mt-6 flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between"><p>Subtotal:</p><p>{formatCurrency(summaryData.total)}</p></div>
                {summaryData.descuento > 0 && <div className="flex justify-between text-red-600"><p>Descuento ({summaryData.descuento}%):</p><p>-{formatCurrency(totalDescuento)}</p></div>}
                <div className="flex justify-between font-bold text-lg border-t pt-2"><p>TOTAL:</p><p>{formatCurrency(totalFinal)}</p></div>
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
  
  // Ref para el contenido que se imprimirá
  const printRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = searchParams.get('data');
    if (data) {
      try {
        setSummaryData(JSON.parse(data));
      } catch (e) {
        toast({ title: "Error", description: "No se pudo leer el resumen del presupuesto.", variant: "destructive" });
        router.push('/armado-rapido');
      }
    } else {
      router.push('/armado-rapido');
    }
  }, [searchParams, router, toast]);

  const handlePrint = () => {
    window.print();
  };
  
  const handleCopyToClipboard = () => {
    if (typeof window !== 'undefined') {
        navigator.clipboard.writeText(window.location.href);
        toast({
            title: "Enlace Copiado",
            description: "El enlace al presupuesto ha sido copiado a tu portapapeles.",
        });
    }
  };

  const whatsappLink = "https://wa.me/59898355530"; 

  if (!summaryData) {
    return <div>Cargando resumen...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white flex flex-col items-center py-8">
      <div className="w-full max-w-3xl mx-auto print:hidden mb-6 flex justify-between">
         <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2"/> Volver a Editar</Button>
         <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopyToClipboard}><ClipboardCopy className="mr-2"/>Copiar Enlace</Button>
            <Button onClick={handlePrint}><Printer className="mr-2"/>Descargar PDF</Button>
         </div>
      </div>
      
      <div className="print-only-container">
        <BudgetPrintView summaryData={summaryData} ref={printRef} />
      </div>

       <div className="w-full max-w-3xl mx-auto mt-6 flex justify-center print:hidden">
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <Button className="bg-green-500 hover:bg-green-600">
                  <MessageSquare className="mr-2"/>Contactar por WhatsApp
              </Button>
          </a>
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
        <Suspense fallback={<div>Cargando...</div>}>
            <ResumenContent />
        </Suspense>
    )
}

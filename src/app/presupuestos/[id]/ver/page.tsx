
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; 
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Edit, Loader2, AlertTriangle, FileText as FileTextIcon, CalendarDays, Users, Coins, StickyNote, FileSignature, MessageSquare, Mail, Percent, Tag, Phone, Globe as GlobeIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PresupuestoStatusBadge } from '@/components/presupuestos/presupuesto-status-badge';
import type { Presupuesto } from '@/types/presupuesto';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import type { BudgetDisplaySettings } from '@/types/settings';
import { getBudgetDisplaySettings } from '@/app/actions/settings';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const formatCurrency = (amount?: number, includeSymbol = true) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  const options = { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 };
  const formatted = new Intl.NumberFormat('es-UY', options).format(amount);
  return includeSymbol ? `$ ${formatted}` : formatted;
};

const formatDate = (dateString?: string, shortMonth = false) => {
  if (!dateString) return "Fecha no especificada";
  try {
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth(); 
    const day = date.getUTCDate();

    if (shortMonth) {
        return `${String(day).padStart(2,'0')}/${String(month + 1).padStart(2,'0')}/${year}`;
    }
    return new Date(year, month, day).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  } catch (e) {
    return 'Fecha inválida';
  }
};

const COMPANY_MAIN_TITLE = "Presupuesto para fiestas o eventos";
const COMPANY_NAME_BRAND = "AK PRODUCCIONES";
const COMPANY_CONTACT_PERSON = "SR. Alexander Knuth";
const COMPANY_ADDRESS_LINE1 = "Salto";
const COMPANY_ADDRESS_LINE2 = "50000 Salto";
const COMPANY_CONTACT_EMAIL = "akproduccionessalto@gmail.com";
const COMPANY_WEBSITE = "www.akproduccioneseventos.com";
const COMPANY_LOGO_URL = "https://placehold.co/120x120/EF4444/FFFFFF.png?text=AK&font=montserrat"; 
const COMPANY_LOGO_AI_HINT = "company logo AK circle red";
const BUDGET_VALIDITY_DAYS = 30;
const BUDGET_DEPOSIT_NOTE = "El presupuesto es válido por 30 días. Para asegurar el presupuesto debe abonar el 20% del total como seña.";

export default function VerPresupuestoPage() {
  const params = useParams();
  const router = useRouter();
  const presupuestoId = params.id as string;
  const { toast } = useToast();

  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [displaySettings, setDisplaySettings] = useState<BudgetDisplaySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPresupuestoAndSettings = useCallback(async () => {
    if (!presupuestoId) { setError("ID de presupuesto no válido."); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      const [fetchedPresupuesto, fetchedSettings] = await Promise.all([
        getPresupuestoById(presupuestoId),
        getBudgetDisplaySettings()
      ]);
      setDisplaySettings(fetchedSettings);
      if (fetchedPresupuesto) {
        setPresupuesto(fetchedPresupuesto);
      } else {
        setError(`Presupuesto con ID ${presupuestoId} no encontrado.`);
        toast({ title: "Error", description: `Presupuesto no encontrado.`, variant: "destructive"});
      }
    } catch (err: any) {
      setError(err.message || "No se pudo cargar el presupuesto.");
      toast({ title: "Error al Cargar", variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [presupuestoId, toast]); 

  useEffect(() => {
    fetchPresupuestoAndSettings();
  }, [fetchPresupuestoAndSettings]);

  const handleCreateInvoice = () => {
    if (presupuesto) router.push(`/invoices/new?fromPresupuesto=${presupuesto.id}`);
  };
  
  const handlePrint = () => {
    console.log('Print button on VerPresupuestoPage clicked, attempting window.print()');
    window.print();
  };

  if (isLoading || !displaySettings) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-16 h-16 animate-spin text-primary" /><p className="ml-4 text-xl">Cargando...</p></div>;
  }
  if (error || !presupuesto) {
    return <div className="max-w-2xl mx-auto text-center py-10"><AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-4" /><h1 className="text-2xl font-bold">Error</h1><p className="text-muted-foreground">{error || "Presupuesto no encontrado."}</p><Link href="/presupuestos" passHref><Button variant="outline" className="mt-6"><ArrowLeft className="mr-2 h-4 w-4"/>Volver</Button></Link></div>;
  }

  const costoTotalSinDescuento = presupuesto.itemsPresupuestados.reduce((sum, item) => sum + item.costoTotalItem, 0);
  const totalFinalMostrado = presupuesto.totalConDescuento ?? costoTotalSinDescuento;
  
  const fechaValidoHasta = new Date(presupuesto.timestamp);
  fechaValidoHasta.setDate(fechaValidoHasta.getDate() + BUDGET_VALIDITY_DAYS);

  const eventYear = new Date(presupuesto.eventoFecha).getFullYear();
  const currentYear = new Date().getFullYear();
  const showAnnualAdjustmentLegend = 
    displaySettings?.annualAdjustmentPercentage && 
    displaySettings.annualAdjustmentPercentage > 0 && 
    eventYear > currentYear && 
    presupuesto?.estado !== 'Facturado';

  return (
    <div className="max-w-4xl mx-auto bg-white print:bg-white font-sans text-gray-800 print:text-black">
      <div className="p-4 md:p-8 print:p-2">
        <div className="mb-6 print:hidden flex flex-row justify-between items-start">
          <Link href="/presupuestos" passHref><Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4"/>Volver</Button></Link>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Imprimir/PDF</Button>
            {presupuesto.estado !== 'Facturado' ? 
              (<Button onClick={handleCreateInvoice} variant='default' size="sm"><FileTextIcon className="mr-2 h-4 w-4"/>Crear Factura</Button>) : 
              presupuesto.invoiceId ? 
              (<Link href={`/invoices/${presupuesto.invoiceId}`} passHref><Button variant="secondary" size="sm" className="bg-green-100 text-green-700 hover:bg-green-200"><FileSignature className="mr-2 h-4 w-4"/>Ver Factura</Button></Link>) : 
              (<Button variant="secondary" size="sm" disabled>Facturado</Button>)}
            <Link href={`/presupuestos/${presupuesto.id}/editar`} passHref><Button variant="secondary" size="sm"><Edit className="mr-2 h-4 w-4"/>Editar</Button></Link>
          </div>
        </div>
        
        <header className="mb-6 print:mb-4">
          <h1 className="text-xl font-bold text-center mb-4 print:text-base leading-tight">{COMPANY_MAIN_TITLE} - {COMPANY_NAME_BRAND}</h1>
          <div className="flex justify-between items-start text-xs print:text-[8pt]">
            <div className="space-y-px">
              <p className="font-semibold">{COMPANY_CONTACT_PERSON}</p>
              <p>{COMPANY_ADDRESS_LINE1}</p>
              <p>{COMPANY_ADDRESS_LINE2}</p>
              <p>{COMPANY_CONTACT_EMAIL}</p>
              <p>{COMPANY_WEBSITE}</p>
            </div>
            {displaySettings.showCompanyLogo && (
                <div className="w-20 h-20 print:w-16 print:h-16 flex-shrink-0">
                    <Image src={COMPANY_LOGO_URL} alt={`${COMPANY_NAME_BRAND} Logo`} width={80} height={80} className="object-contain" data-ai-hint={COMPANY_LOGO_AI_HINT}/>
                </div>
            )}
          </div>
        </header>

        {displaySettings.showClientData && displaySettings.showEventTypeAndDate && (
            <section className="my-4 print:my-2 text-sm print:text-[9pt] text-center">
                <p>
                <span className="font-semibold">{presupuesto.clienteNombre}</span> {presupuesto.eventoTipo} - {formatDate(presupuesto.eventoFecha, true)}
                </p>
            </section>
        )}
        
        <section className="mb-6 print:mb-3">
          <table className="w-full text-xs print:text-[8pt] border-collapse">
            <thead className="print:bg-gray-100">
              <tr>
                <th className="border border-gray-300 print:border-gray-400 px-2 py-1 text-left font-medium bg-gray-50">Número de cliente</th>
                <th className="border border-gray-300 print:border-gray-400 px-2 py-1 text-left font-medium bg-gray-50">Número de Documento</th>
                <th className="border border-gray-300 print:border-gray-400 px-2 py-1 text-left font-medium bg-gray-50">Página</th>
                <th className="border border-gray-300 print:border-gray-400 px-2 py-1 text-left font-medium bg-gray-50">Fecha</th>
                <th className="border border-gray-300 print:border-gray-400 px-2 py-1 text-left font-medium bg-gray-50">Válido hasta</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 print:border-gray-400 px-2 py-1">{presupuesto.id.split('_')[1]?.substring(0,4) || 'N/A'}</td>
                <td className="border border-gray-300 print:border-gray-400 px-2 py-1">{presupuesto.id.split('_').pop()?.substring(0,6)}</td>
                <td className="border border-gray-300 print:border-gray-400 px-2 py-1">1/1</td>
                <td className="border border-gray-300 print:border-gray-400 px-2 py-1">{formatDate(presupuesto.timestamp, true)}</td>
                <td className="border border-gray-300 print:border-gray-400 px-2 py-1">{formatDate(fechaValidoHasta.toISOString(), true)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {displaySettings.showPriceBreakdown && presupuesto.itemsPresupuestados.length > 0 && (
            <section className="mb-6 print:mb-3">
            <table className="w-full text-xs print:text-[8pt] border-collapse">
                <thead className="print:bg-gray-100">
                <tr>
                    <th className="border border-gray-300 print:border-gray-400 px-2 py-1 text-left font-medium bg-gray-50 w-2/5">Artículo</th>
                    <th className="border border-gray-300 print:border-gray-400 px-2 py-1 text-center font-medium bg-gray-50 w-[10%]">Cantidad</th>
                    <th className="border border-gray-300 print:border-gray-400 px-2 py-1 text-center font-medium bg-gray-50 w-[10%]">Unidad</th>
                    <th className="border border-gray-300 print:border-gray-400 px-2 py-1 text-right font-medium bg-gray-50 w-[15%]">Precio</th>
                    <th className="border border-gray-300 print:border-gray-400 px-2 py-1 text-center font-medium bg-gray-50 w-[10%]">Desc.%</th>
                    <th className="border border-gray-300 print:border-gray-400 px-2 py-1 text-right font-medium bg-gray-50 w-[15%]">Importe total</th>
                </tr>
                </thead>
                <tbody>
                {presupuesto.itemsPresupuestados.map((item) => (
                    <tr key={item.idServicioCatalogo}>
                    <td className="border border-gray-300 print:border-gray-400 px-2 py-1 align-top">
                        {item.nombreServicio}
                        {presupuesto.descuentoTipo === 'porcentaje' && presupuesto.descuentoValor && presupuesto.descuentoValor > 0 && (
                        <div className="text-gray-500 print:text-gray-600 text-[7pt]">{presupuesto.descuentoValor}% de descuento</div>
                        )}
                    </td>
                    <td className="border border-gray-300 print:border-gray-400 px-2 py-1 text-center align-top">{item.cantidad}</td>
                    <td className="border border-gray-300 print:border-gray-400 px-2 py-1 text-center align-top">$</td>
                    <td className="border border-gray-300 print:border-gray-400 px-2 py-1 text-right align-top">{formatCurrency(item.precioUnitario, false)}</td>
                    <td className="border border-gray-300 print:border-gray-400 px-2 py-1 text-center align-top">
                        {presupuesto.descuentoTipo === 'porcentaje' && presupuesto.descuentoValor && presupuesto.descuentoValor > 0 ? `${presupuesto.descuentoValor}%` : ''}
                    </td>
                    <td className="border border-gray-300 print:border-gray-400 px-2 py-1 text-right align-top">{formatCurrency(item.costoTotalItem, false)}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            </section>
        )}
        
        {showAnnualAdjustmentLegend && (
          <div className="my-4 p-3 border-l-4 border-orange-400 bg-orange-50 text-orange-700 text-xs print:hidden">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
              <div className="ml-3">
                <p className="font-bold">Notificación de Ajuste Anual</p>
                <p className="mt-1">
                  Este presupuesto podría estar sujeto a un ajuste del <strong>{displaySettings.annualAdjustmentPercentage}%</strong> por realizarse en un año futuro. Este ajuste se aplicará al momento de la facturación final.
                </p>
              </div>
            </div>
          </div>
        )}

        <section className="flex justify-end mb-6 print:mb-3 text-sm print:text-xs">
          <div className="w-full max-w-[220px] print:max-w-[180px] space-y-0.5">
            {presupuesto.descuentoValor && presupuesto.descuentoValor > 0 && (
              <>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(costoTotalSinDescuento)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">Descuento{presupuesto.nombrePromocion ? ` (${presupuesto.nombrePromocion})` : ''}:</span>
                  <span className="text-red-600">-{formatCurrency(costoTotalSinDescuento - totalFinalMostrado)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-bold pt-1 border-t border-gray-400 print:border-gray-500">
              <span>Importe total</span>
              <span>{formatCurrency(totalFinalMostrado)}</span>
            </div>
          </div>
        </section>
        
        <footer className="mt-8 pt-4 text-xs print:text-[8pt] text-gray-600 print:text-black">
          <p>{BUDGET_DEPOSIT_NOTE}</p>
          {presupuesto.notas && displaySettings.showPaymentMethodNotes && <p className="mt-2 whitespace-pre-line">{presupuesto.notas}</p>}
          {showAnnualAdjustmentLegend && (
            <p className="mt-1 print:mt-0.5 text-orange-600">
                Nota: Este presupuesto podría estar sujeto a un ajuste anual del {displaySettings.annualAdjustmentPercentage}% si el evento se realiza en un año posterior al actual.
            </p>
           )}
        </footer>
      </div>
    </div>
  );
}

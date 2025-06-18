
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // CardFooter removed as it's not directly used for print logic
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Edit, Loader2, AlertTriangle, FileText, CalendarDays, Users, Coins, StickyNote, FileSignature, MessageSquare, Mail, Download, Tag, Percent } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PresupuestoStatusBadge } from '@/components/presupuestos/presupuesto-status-badge';
import type { Presupuesto } from '@/types/presupuesto';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import type { BudgetDisplaySettings } from '@/types/settings';
import { getBudgetDisplaySettings } from '@/app/actions/settings';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no especificada";
  try {
    return new Date(dateString).toLocaleDateString('es-UY', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  } catch (e) {
    return 'Fecha inválida';
  }
};

const COMPANY_NAME = "AK Producciones";
const COMPANY_ADDRESS = "Montevideo, Uruguay";
const COMPANY_CONTACT = "contacto@akproducciones.com.uy";
const COMPANY_LOGO_URL = "https://placehold.co/200x80.png?text=AK+Logo"; 

export default function VerPresupuestoPage() {
  const params = useParams();
  const router = useRouter();
  const presupuestoId = params.id as string;
  const { toast } = useToast();

  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [displaySettings, setDisplaySettings] = useState<BudgetDisplaySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [whatsappLink, setWhatsappLink] = useState('');
  const [mailtoLink, setMailtoLink] = useState('');

  const generateShareableText = useCallback((currentPresupuesto: Presupuesto | null, settings: BudgetDisplaySettings | null): string => {
    if (!currentPresupuesto || !settings) return "Detalles del presupuesto no disponibles.";
    
    let texto = `📄 *PRESUPUESTO - ${COMPANY_NAME}*\n\n`;
    texto += `*Nº Presupuesto:* ${currentPresupuesto.id.split('_').pop()}\n`;
    texto += `*Fecha Emisión:* ${formatDate(currentPresupuesto.timestamp)}\n\n`;

    if (settings.showClientData) texto += `*Cliente:* ${currentPresupuesto.clienteNombre}\n`;
    if (settings.showEventTypeAndDate) {
      texto += `*Evento:* ${currentPresupuesto.eventoTipo} para ${currentPresupuesto.invitadosCantidad} invitados en ${currentPresupuesto.salonFiestas}\n`;
      texto += `*Fecha Evento:* ${formatDate(currentPresupuesto.eventoFecha)}\n`;
      if (currentPresupuesto.protagonista1Nombre) {
        texto += `*Agasajado/s:* ${currentPresupuesto.protagonista1Nombre}`;
        if (currentPresupuesto.protagonista2Nombre) texto += ` y ${currentPresupuesto.protagonista2Nombre}`;
        texto += `\n`;
      }
      if (currentPresupuesto.nombreEmpresa) texto += `*Empresa:* ${currentPresupuesto.nombreEmpresa}\n`;
    }
    texto += `\n`;

    if (settings.showPriceBreakdown && currentPresupuesto.itemsPresupuestados.length > 0) {
      texto += `*Detalle de Servicios:*\n`;
      currentPresupuesto.itemsPresupuestados.forEach(item => {
        texto += `  • ${item.nombreServicio} (${item.cantidad} ${item.unidad || 'unid.'} x ${formatCurrency(item.precioUnitario)} c/u): *${formatCurrency(item.costoTotalItem)}*\n`;
      });
      texto += `\n`;
    }
    
    const costoTotalSinDescuento = currentPresupuesto.itemsPresupuestados.reduce((sum, item) => sum + item.costoTotalItem, 0);
    let totalFinalMostrado = costoTotalSinDescuento;
    let descuentoAplicado = 0;

    if (currentPresupuesto.descuentoTipo && currentPresupuesto.descuentoValor && currentPresupuesto.descuentoValor > 0) {
      if (currentPresupuesto.descuentoTipo === 'porcentaje') {
        descuentoAplicado = (costoTotalSinDescuento * currentPresupuesto.descuentoValor) / 100;
      } else {
        descuentoAplicado = currentPresupuesto.descuentoValor;
      }
      totalFinalMostrado = costoTotalSinDescuento - descuentoAplicado;

      texto += `SUBTOTAL: ${formatCurrency(costoTotalSinDescuento)}\n`;
      if (currentPresupuesto.nombrePromocion) texto += `Promo: ${currentPresupuesto.nombrePromocion}\n`;
      texto += `Descuento: -${formatCurrency(descuentoAplicado)} (${currentPresupuesto.descuentoTipo === 'porcentaje' ? `${currentPresupuesto.descuentoValor}%` : 'fijo'})\n`;
      if (currentPresupuesto.vigenciaPromocion) texto += `Válido hasta: ${currentPresupuesto.vigenciaPromocion}\n`;
      texto += `\n`;
    }
    
    texto += `*TOTAL ESTIMADO:* *${formatCurrency(totalFinalMostrado)}*\n\n`;
    
    let adjustmentText = "";
    const eventYear = new Date(currentPresupuesto.eventoFecha).getFullYear();
    const currentYear = new Date().getFullYear();
    if (settings.annualAdjustmentPercentage && settings.annualAdjustmentPercentage > 0 && eventYear > currentYear) {
      const adjustmentAmount = (totalFinalMostrado * settings.annualAdjustmentPercentage) / 100;
      adjustmentText = `\n\n⚠️ *Nota:* Este presupuesto NO incluye el ajuste anual del ${settings.annualAdjustmentPercentage}% (aprox. ${formatCurrency(adjustmentAmount)}) que podría aplicarse al momento de facturar.`;
      texto += adjustmentText;
    }
    
    if (settings.showPaymentMethodNotes && currentPresupuesto.notas) {
      texto += `\n*Notas y Condiciones:*\n${currentPresupuesto.notas}\n\n`;
    }
    texto += `Gracias por su consulta,\n${COMPANY_NAME}`;
    return texto;
  }, []);

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
        if (fetchedSettings) {
          const shareText = generateShareableText(fetchedPresupuesto, fetchedSettings);
          setWhatsappLink(`https://wa.me/?text=${encodeURIComponent(shareText)}`);
          setMailtoLink(`mailto:?subject=Presupuesto de ${COMPANY_NAME} para ${fetchedPresupuesto.clienteNombre}&body=${encodeURIComponent(shareText + "\n\nVer online: " + (typeof window !== "undefined" ? window.location.href : ''))}`);
        }
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
  }, [presupuestoId, toast, generateShareableText]);

  useEffect(() => {
    fetchPresupuestoAndSettings();
  }, [fetchPresupuestoAndSettings]);

  const handleCreateInvoice = () => {
    if (presupuesto) router.push(`/invoices/new?fromPresupuesto=${presupuesto.id}`);
  };

  const eventYear = presupuesto ? new Date(presupuesto.eventoFecha).getFullYear() : 0;
  const currentYear = new Date().getFullYear();
  let calculatedAnnualAdjustmentAmount = 0;
  const costoBaseParaAjuste = presupuesto?.totalConDescuento ?? presupuesto?.costoTotalEstimado ?? 0;

  if (presupuesto && displaySettings?.annualAdjustmentPercentage && displaySettings.annualAdjustmentPercentage > 0 && eventYear > currentYear) {
    calculatedAnnualAdjustmentAmount = (costoBaseParaAjuste * displaySettings.annualAdjustmentPercentage) / 100;
  }
  const showAnnualAdjustmentLegend = calculatedAnnualAdjustmentAmount > 0 && presupuesto?.estado !== 'Facturado';

  if (isLoading || !displaySettings) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-16 h-16 animate-spin text-primary" /><p className="ml-4 text-xl">Cargando...</p></div>;
  }
  if (error || !presupuesto) {
    return <div className="max-w-2xl mx-auto text-center py-10"><AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-4" /><h1 className="text-2xl font-bold">Error</h1><p className="text-muted-foreground">{error || "Presupuesto no encontrado."}</p><Link href="/presupuestos" passHref><Button variant="outline" className="mt-6">Volver</Button></Link></div>;
  }

  const costoTotalSinDescuento = presupuesto.itemsPresupuestados.reduce((sum, item) => sum + item.costoTotalItem, 0);
  const totalFinalMostrado = presupuesto.totalConDescuento ?? costoTotalSinDescuento;

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:space-y-2">
      <Card className="shadow-lg print:shadow-none print:border-none">
        <CardHeader className="p-6 print:p-2 flex flex-row justify-between items-start print:hidden">
          <Link href="/presupuestos" passHref><Button variant="outline">Volver</Button></Link>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2"/>Previsualizar / Imprimir</Button>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer"><Button variant="outline" className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"><MessageSquare className="mr-2"/>WhatsApp</Button></a>
            <a href={mailtoLink}><Button variant="outline" className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"><Mail className="mr-2"/>Email</Button></a>
            {presupuesto.estado !== 'Facturado' ? 
              (<Button onClick={handleCreateInvoice} variant='default'><FileText className="mr-2"/>Crear Factura</Button>) : 
              presupuesto.invoiceId ? 
              (<Link href={`/invoices/${presupuesto.invoiceId}`} passHref><Button variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200"><FileSignature className="mr-2"/>Ver Factura ({presupuesto.invoiceId.split('_').pop()?.substring(0,5)})</Button></Link>) : 
              (<Button variant="secondary" disabled>Facturado (Sin ID)</Button>)}
            <Link href={`/presupuestos/${presupuesto.id}/editar`} passHref><Button variant="secondary"><Edit className="mr-2"/>Editar</Button></Link>
          </div>
        </CardHeader>
        
        <div id="printable-budget" className="p-4 md:p-8 print:p-0 border-t md:border print:border-none rounded-md">
          <header className="mb-8 print:mb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>{displaySettings.showCompanyLogo && (<Image src={COMPANY_LOGO_URL} alt={`${COMPANY_NAME} Logo`} width={160} height={64} className="object-contain mb-2" data-ai-hint="company event logo"/>)}<p className="text-sm text-muted-foreground">{COMPANY_ADDRESS}</p><p className="text-sm text-muted-foreground">{COMPANY_CONTACT}</p></div>
              <div className="text-left sm:text-right"><h1 className="text-3xl font-bold text-primary print:text-2xl">PRESUPUESTO</h1><p className="text-muted-foreground">Nº: {presupuesto.id.split('_').pop()}</p><p className="text-muted-foreground">Fecha Emisión: {formatDate(presupuesto.timestamp)}</p></div>
            </div>
          </header>
          <Separator className="my-6 print:my-3"/>
          <section className="mb-8 print:mb-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-3">
            {displaySettings.showClientData && (<div><h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-1">Cliente:</h2><p className="text-lg font-medium text-foreground">{presupuesto.clienteNombre}</p></div>)}
            {displaySettings.showEventTypeAndDate && (<div className={displaySettings.showClientData ? "md:text-right" : ""}><h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-1">Evento:</h2><p className="text-md text-foreground">{presupuesto.eventoTipo}</p><p className="text-sm text-muted-foreground">Para {presupuesto.invitadosCantidad} invitados en {presupuesto.salonFiestas}</p><p className="text-sm text-muted-foreground">Fecha: {formatDate(presupuesto.eventoFecha)}</p>{presupuesto.protagonista1Nombre && <p className="text-sm text-muted-foreground">Agasajado/s: {presupuesto.protagonista1Nombre}{presupuesto.protagonista2Nombre ? ` y ${presupuesto.protagonista2Nombre}`:''}</p>}{presupuesto.nombreEmpresa && <p className="text-sm text-muted-foreground">Empresa: {presupuesto.nombreEmpresa}</p>}</div>)}
          </div></section>
          <PresupuestoStatusBadge status={presupuesto.estado} className="mb-6 print:text-xs"/>
          
          {displaySettings.showPriceBreakdown && presupuesto.itemsPresupuestados.length > 0 && (
            <section><h3 className="mb-3 text-lg font-semibold font-headline text-foreground print:text-base">Detalle de Servicios:</h3><div className="overflow-x-auto border rounded-md"><table className="w-full text-sm"><thead className="bg-muted/50 print:bg-gray-100"><tr className="border-b"><th className="px-3 py-2.5 font-semibold text-left text-muted-foreground print:px-2">Descripción</th><th className="px-3 py-2.5 font-semibold text-right text-muted-foreground print:px-2">Cant.</th><th className="px-3 py-2.5 font-semibold text-right text-muted-foreground print:px-2">P. Unit.</th><th className="px-3 py-2.5 font-semibold text-right text-muted-foreground print:px-2">Subtotal</th></tr></thead><tbody>
              {presupuesto.itemsPresupuestados.map((item) => (<tr key={item.idServicioCatalogo} className="border-b last:border-b-0 hover:bg-muted/20"><td className="px-3 py-2.5 text-foreground print:px-2">{item.nombreServicio}</td><td className="px-3 py-2.5 text-right text-muted-foreground print:px-2">{item.cantidad} {item.unidad || ''}</td><td className="px-3 py-2.5 text-right text-muted-foreground print:px-2">{formatCurrency(item.precioUnitario)}</td><td className="px-3 py-2.5 text-right text-foreground print:px-2">{formatCurrency(item.costoTotalItem)}</td></tr>))}
            </tbody></table></div></section>
          )}
          {presupuesto.itemsPresupuestados.length === 0 && <p className="my-6 text-sm text-muted-foreground italic">No hay servicios detallados en este presupuesto.</p>}

          <Separator className="my-8 print:my-4"/>
          <section className="flex justify-end mb-2 print:mb-1">
            <div className="w-full max-w-xs space-y-1">
              <div className="flex justify-between text-md"><span className="font-semibold text-muted-foreground">Subtotal:</span><span className="font-medium text-foreground">{formatCurrency(costoTotalSinDescuento)}</span></div>
              {presupuesto.descuentoValor && presupuesto.descuentoValor > 0 && (
                <>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Promoción: {presupuesto.nombrePromocion || 'Descuento Aplicado'} ({presupuesto.descuentoTipo === 'porcentaje' ? `${presupuesto.descuentoValor}%` : formatCurrency(presupuesto.descuentoValor)}):</span><span className="font-medium text-destructive">-{formatCurrency(costoTotalSinDescuento - (presupuesto.totalConDescuento || costoTotalSinDescuento))}</span></div>
                  {presupuesto.vigenciaPromocion && <p className="text-xs text-muted-foreground text-right">Válido hasta: {presupuesto.vigenciaPromocion}</p>}
                </>
              )}
              <Separator className="my-1"/>
              <div className="flex justify-between text-lg"><span className="font-semibold text-muted-foreground">TOTAL:</span><span className="font-bold text-primary">{formatCurrency(totalFinalMostrado)}</span></div>
              <p className="text-xs text-muted-foreground text-right">Precios en UYU. IVA incluido si aplica.</p>
            </div>
          </section>
          {showAnnualAdjustmentLegend && (<div className="my-4 p-3 border border-orange-300 bg-orange-50 text-orange-700 rounded-md text-xs print:text-[9pt]"><AlertTriangle className="inline w-3.5 h-3.5 mr-1"/>Este presupuesto NO incluye el ajuste anual del {displaySettings.annualAdjustmentPercentage}% (aprox. {formatCurrency(calculatedAnnualAdjustmentAmount)}) que podría aplicarse al facturar.</div>)}
          {displaySettings.showPaymentMethodNotes && presupuesto.notas && (<section className="pt-6 border-t print:pt-3"><h4 className="text-md font-semibold text-muted-foreground mb-2 print:text-sm">Notas y Condiciones:</h4><div className="p-3 border rounded-md bg-muted/20 print:border-gray-200"><p className="text-sm text-foreground whitespace-pre-wrap print:text-xs">{presupuesto.notas}</p></div></section>)}
          <footer className="mt-12 pt-6 border-t text-center text-xs text-muted-foreground print:mt-6 print:pt-3"><p>Gracias por confiar en {COMPANY_NAME}.</p><p>Este presupuesto es válido por 30 días.</p><p className="mt-2 print:hidden">{COMPANY_CONTACT}</p></footer>
        </div>
      </Card>
    </div>
  );
}


'use client';

import type { Presupuesto, PresupuestoFormData, ItemPresupuestado } from '@/types/presupuesto';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, ClipboardCopy, Send, Printer, Tag, Percent, FileText as FileTextIcon, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Dispatch, SetStateAction } from 'react';
import React, { useMemo } from 'react'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BudgetDisplaySettings } from '@/types/settings';
import { getBudgetDisplaySettings } from '@/app/actions/settings';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator'; 

// Company Info Constants from PDF
const COMPANY_MAIN_TITLE = "Presupuesto para fiestas o eventos - AK PRODUCCIONES";
const COMPANY_NAME_BRAND = "AK PRODUCCIONES";
const COMPANY_CONTACT_PERSON = "SR. Alexander Knuth";
const COMPANY_ADDRESS_LINE1_PDF = "Salto";
const COMPANY_ADDRESS_LINE2_PDF = "50000 Salto";
const COMPANY_CONTACT_EMAIL_PDF = "akproduccionessalto@gmail.com";
const COMPANY_WEBSITE_PDF = "www.akproduccioneseventos.com";
const COMPANY_LOGO_URL_PDF = "https://placehold.co/100x100/EF4444/FFFFFF.png?text=AK&font=montserrat";
const COMPANY_LOGO_AI_HINT_PDF = "AK Producciones logo";
const BUDGET_VALIDITY_DAYS_PDF = 30;
const BUDGET_DEPOSIT_NOTE_PDF = "El presupuesto es válido por 30 días. Para asegurar el presupuesto debe abonar el 20% del total como seña.";


interface Paso4ResumenProps {
  presupuesto: Presupuesto;
  formData: PresupuestoFormData;
  setFormData: Dispatch<SetStateAction<PresupuestoFormData>>;
  displaySettings: BudgetDisplaySettings | null;
}

const formatCurrency = (amount?: number, includeSymbol = true, useNUS = false) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  const options = { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 };
  const formatted = new Intl.NumberFormat('es-UY', options).format(amount);
  if (!includeSymbol) return formatted;
  return useNUS ? `NU$ ${formatted}` : `$ ${formatted}`;
};

const formatDate = (dateString?: string, shortMonth = false) => {
  if (!dateString) return 'Fecha no especificada';
  try {
    const date = new Date(dateString);
    const year = dateString.includes('T') ? date.getUTCFullYear() : date.getFullYear();
    const month = dateString.includes('T') ? date.getUTCMonth() : date.getMonth();
    const day = dateString.includes('T') ? date.getUTCDate() : date.getDate();

    if (shortMonth) {
      return `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
    }
    return new Date(year, month, day).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return 'Fecha inválida';
  }
};

export default function Paso4Resumen({ presupuesto, formData, setFormData, displaySettings }: Paso4ResumenProps) {
  const { toast } = useToast();

  const handleDiscountChange = (field: keyof Pick<PresupuestoFormData, 'nombrePromocion' | 'descuentoTipo' | 'descuentoValor' | 'vigenciaPromocion'>, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const { itemsAgrupados, costoTotalRegalos, subtotalBruto, descuentoPromocional, totalFinal } = useMemo(() => {
    if (!presupuesto) {
      return { itemsAgrupados: {}, costoTotalRegalos: 0, subtotalBruto: 0, descuentoPromocional: 0, totalFinal: 0 };
    }
    
    const itemsRegulares = presupuesto.itemsPresupuestados.filter(item => !item.esRegalo);
    const itemsRegalo = presupuesto.itemsPresupuestados.filter(item => item.esRegalo);

    const agrupados: Record<string, ItemPresupuestado[]> = itemsRegulares.reduce((acc, item) => {
        const categoria = item.categoriaServicio || 'Otros Servicios';
        if (!acc[categoria]) acc[categoria] = [];
        acc[categoria].push(item);
        return acc;
    }, {} as Record<string, ItemPresupuestado[]>);
    
    const sortedKeys = Object.keys(agrupados).sort((a,b) => a.localeCompare(b));
    const sortedAgrupados: Record<string, ItemPresupuestado[]> = {};
    sortedKeys.forEach(key => sortedAgrupados[key] = agrupados[key]);

    if (itemsRegalo.length > 0) {
      sortedAgrupados['Regalos Incluidos'] = itemsRegalo;
    }
    
    const costoRegalos = itemsRegalo.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
    const costoTotalSinDescuento = itemsRegulares.reduce((sum, item) => sum + item.costoTotalItem, 0);

    let descuentoAplicado = 0;
    const descuentoValorNum = parseFloat(formData.descuentoValor || '0');
    if (formData.descuentoTipo && descuentoValorNum > 0) {
        if (formData.descuentoTipo === 'porcentaje') {
            descuentoAplicado = (costoTotalSinDescuento * descuentoValorNum) / 100;
        } else {
            descuentoAplicado = descuentoValorNum;
        }
    }
    
    const finalTotal = costoTotalSinDescuento - descuentoAplicado;
    
    return {
      itemsAgrupados: sortedAgrupados,
      costoTotalRegalos: costoRegalos,
      subtotalBruto: costoTotalSinDescuento,
      descuentoPromocional: descuentoAplicado,
      totalFinal: finalTotal
    };

  }, [presupuesto, formData.descuentoTipo, formData.descuentoValor]);


  if (!presupuesto || !displaySettings) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-xl font-semibold">Generando resumen...</p>
        <p className="text-muted-foreground">Asegúrate de haber completado los pasos anteriores o que la configuración de visualización esté disponible.</p>
      </div>
    );
  }
  
  const fechaValidoHasta = new Date(presupuesto.timestamp);
  fechaValidoHasta.setDate(fechaValidoHasta.getDate() + BUDGET_VALIDITY_DAYS_PDF);
  
  const eventYear = presupuesto.eventoFecha ? new Date(presupuesto.eventoFecha).getFullYear() : 0;
  const currentYear = new Date().getFullYear();
  const showAnnualAdjustmentLegend = 
    displaySettings?.annualAdjustmentPercentage && 
    displaySettings.annualAdjustmentPercentage > 0 && 
    eventYear > currentYear;


  const generarTextoWhatsApp = () => {
    let texto = `🎉 *¡Presupuesto para tu Evento!* 🎉\n\n`;
    texto += `Estimado/a *${presupuesto.clienteNombre}*,\n\n`;
    texto += `Gracias por considerar a *${COMPANY_NAME_BRAND}* para tu *${presupuesto.eventoTipo}*.\n`;
    if (displaySettings.showClientData) {
      texto += `*Salón:* ${presupuesto.salonFiestas}\n`;
    }
    if (displaySettings.showEventTypeAndDate) {
      texto += `*Fecha del Evento:* ${formatDate(presupuesto.eventoFecha)}\n`;
      texto += `*Cantidad de Invitados:* ${presupuesto.invitadosCantidad}\n`;
    }
    if (presupuesto.protagonista1Nombre) {
      texto += `*Agasajado/s:* ${presupuesto.protagonista1Nombre}`;
      if (presupuesto.protagonista2Nombre) texto += ` y ${presupuesto.protagonista2Nombre}`;
      texto += `\n`;
    }
    if (presupuesto.nombreEmpresa) texto += `*Empresa:* ${presupuesto.nombreEmpresa}\n`;
    texto += `\n`;
    if (displaySettings.showPriceBreakdown && presupuesto.itemsPresupuestados.length > 0) {
      texto += `------------------------------------\n✨ *DETALLE DE SERVICIOS* ✨\n------------------------------------\n\n`;
      Object.entries(itemsAgrupados).forEach(([categoria, items]) => {
        texto += `*${categoria}*\n`;
        items.forEach(item => {
           if (item.esRegalo) {
             const valorRegalo = item.precioUnitario * item.cantidad;
             texto += `  🎁 *REGALO:* ${item.nombreServicio} (Valor: ${formatCurrency(valorRegalo)})\n`;
           } else {
            texto += `  • ${item.nombreServicio} (${item.cantidad} ${item.unidad || 'unid.'} x ${formatCurrency(item.precioUnitario)} c/u): *${formatCurrency(item.costoTotalItem)}*\n`;
           }
        });
        texto += `\n`;
      });
      texto += `  SUBTOTAL: *${formatCurrency(subtotalBruto)}*\n\n`;
    }
    if (descuentoPromocional > 0 && formData.nombrePromocion) {
      texto += `🎁 *Promoción Aplicada: ${formData.nombrePromocion}*\n`;
      if (formData.descuentoTipo === 'porcentaje') texto += `  Descuento: ${formData.descuentoValor}% (${formatCurrency(descuentoPromocional)})\n`;
      else texto += `  Descuento: ${formatCurrency(descuentoPromocional)}\n`;
      if (formData.vigenciaPromocion) texto += `  Válido hasta: ${formData.vigenciaPromocion}\n`;
      texto += `\n`;
    }
    texto += `------------------------------------\n💰 *TOTAL FINAL: ${formatCurrency(totalFinal, true, true)}*\n\n`;
    if(presupuesto.notas && presupuesto.notas.trim() !== '' && displaySettings.showPaymentMethodNotes){ texto += `📝 *Notas Adicionales:*\n${presupuesto.notas}\n\n`; }
    texto += `------------------------------------\n\n${BUDGET_DEPOSIT_NOTE_PDF}\n\n¡Esperamos tu consulta!\n*El equipo de ${COMPANY_NAME_BRAND}*`;
    return texto;
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generarTextoWhatsApp())
      .then(() => toast({ title: "¡Texto Copiado!", description: "Resumen copiado." }))
      .catch(() => toast({ title: "Error al Copiar", variant: "destructive" }));
  };
  
  const handleWhatsAppSend = () => window.open(`https://wa.me/?text=${encodeURIComponent(generarTextoWhatsApp())}`, '_blank');
  
  const handlePrint = () => {
    console.log('Print button on Resumen step clicked, attempting window.print()');
    window.print();
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg print:shadow-none print:border-none" id="budget-summary-printable">
        <CardHeader className="bg-muted/10 p-4 md:p-6 print:p-2 print:bg-transparent">
          <h2 className="text-lg md:text-xl font-bold text-center mb-2 print:text-base leading-tight">{COMPANY_MAIN_TITLE}</h2>
          <div className="flex flex-col md:flex-row justify-between items-start text-xs print:text-[8pt]">
            <div className="space-y-px mb-2 md:mb-0">
              <p className="font-semibold">{COMPANY_CONTACT_PERSON}</p>
              <p>{COMPANY_ADDRESS_LINE1_PDF}</p>
              <p>{COMPANY_ADDRESS_LINE2_PDF}</p>
              <p>{COMPANY_CONTACT_EMAIL_PDF}</p>
              <p>{COMPANY_WEBSITE_PDF}</p>
            </div>
            {displaySettings.showCompanyLogo && (
                <div className="w-24 h-24 print:w-16 print:h-16 flex-shrink-0 self-center md:self-start">
                    <Image src={COMPANY_LOGO_URL_PDF} alt={`${COMPANY_NAME_BRAND} Logo`} width={100} height={100} className="object-contain" data-ai-hint={COMPANY_LOGO_AI_HINT_PDF}/>
                </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 print:p-2 space-y-4 print:space-y-2">
          {displaySettings.showClientData && displaySettings.showEventTypeAndDate && (
            <section className="my-2 print:my-1 text-sm print:text-[9pt] text-center">
                <p>
                <span className="font-semibold">{presupuesto.clienteNombre}</span>{presupuesto.eventoTipo ? ` ${presupuesto.eventoTipo}` : ''}{presupuesto.eventoFecha ? ` - ${formatDate(presupuesto.eventoFecha, true)}` : ''}
                </p>
            </section>
          )}
          
          <section className="mb-4 print:mb-2">
            <table className="w-full text-xs print:text-[7pt] border-collapse">
              <thead className="print:bg-gray-100">
                <tr>
                  <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50">Número de cliente</th>
                  <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50">Número de Documento</th>
                  <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50">Página</th>
                  <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50">Fecha</th>
                  <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50">Válido hasta</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1">{presupuesto.id === 'temp-summary' ? 'N/A' : presupuesto.id.split('_')[1]?.substring(0,4) || 'N/A'}</td>
                  <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1">{presupuesto.id === 'temp-summary' ? 'Borrador' : presupuesto.id.split('_').pop()?.substring(0,6)}</td>
                  <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1">1/1</td>
                  <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1">{formatDate(presupuesto.timestamp, true)}</td>
                  <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1">{formatDate(fechaValidoHasta.toISOString(), true)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {displaySettings.showPriceBreakdown && presupuesto.itemsPresupuestados.length > 0 ? (
            <section className="mb-4 print:mb-2">
              {Object.entries(itemsAgrupados).map(([categoria, items]) => (
                  <div key={categoria} className="mb-3 print:mb-1.5 print:break-inside-avoid">
                      <h3 className={`font-bold text-sm mb-1 p-1 print:text-[8pt] ${categoria === 'Regalos Incluidos' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}>
                        {categoria === 'Regalos Incluidos' ? <span className="flex items-center gap-1"><Gift className="w-4 h-4"/>{categoria}</span> : categoria}
                      </h3>
                      <table className="w-full text-xs print:text-[7pt] border-collapse">
                          <thead className="print:bg-gray-100">
                          <tr>
                              <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50 w-2/5">Artículo</th>
                              <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-center font-medium bg-gray-50 w-[10%]">Cantidad</th>
                              <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-right font-medium bg-gray-50 w-[15%]">Precio</th>
                              <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-right font-medium bg-gray-50 w-[15%]">Importe total</th>
                          </tr>
                          </thead>
                          <tbody>
                          {items.map((item) => {
                            const costoTotalItem = item.esRegalo ? 0 : item.costoTotalItem;
                            return (
                              <tr key={item.idServicioCatalogo}>
                                <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1 align-top">
                                  {item.esRegalo ? <span className="flex items-center gap-1 font-semibold text-primary"><Gift className="w-3 h-3"/> {item.nombreServicio}</span> : item.nombreServicio}
                                </td>
                                <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-center align-top">{item.cantidad}</td>
                                <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-right align-top">{item.esRegalo ? <s className="text-muted-foreground">{formatCurrency(item.precioUnitario, false)}</s> : formatCurrency(item.precioUnitario, false)}</td>
                                <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-right align-top">{item.esRegalo ? <span className="font-semibold text-primary">Incluido</span> : formatCurrency(costoTotalItem, false)}</td>
                              </tr>
                            )
                          })}
                          </tbody>
                      </table>
                  </div>
              ))}
            </section>
          ) : (
             <p className="text-sm text-muted-foreground italic my-4 text-center">El desglose de precios está oculto en esta vista.</p>
          )}
          
          <section className="flex justify-end mb-4 print:mb-2 text-sm print:text-xs">
            <div className="w-full max-w-[250px] print:max-w-[200px] space-y-0.5">
              <div className="flex justify-between"><span>Subtotal Bruto:</span><span>{formatCurrency(subtotalBruto)}</span></div>
              {costoTotalRegalos > 0 && <div className="flex justify-between text-green-600"><span>Ahorro por Regalos:</span><span>-{formatCurrency(costoTotalRegalos)}</span></div>}
              {descuentoPromocional > 0 && <div className="flex justify-between text-red-600"><span>Descuento Promocional:</span><span>-{formatCurrency(descuentoPromocional)}</span></div>}
              <div className="flex justify-between font-bold pt-1 border-t border-gray-400 print:border-gray-500"><span className="text-base">TOTAL A PAGAR:</span><span className="text-base">{formatCurrency(totalFinal)}</span></div>
            </div>
          </section>
          
          <Separator className="my-4 print:hidden"/>
          <Card className="bg-muted/20 p-4 print:hidden">
            <CardTitle className="text-md font-medium mb-3 flex items-center gap-2"><Tag className="text-primary"/>Aplicar Promoción / Descuento (Opcional)</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1"><Label htmlFor="promo-nombre">Nombre Promoción</Label><Input id="promo-nombre" value={formData.nombrePromocion || ''} onChange={e => handleDiscountChange('nombrePromocion', e.target.value)} placeholder="Ej: Promo Invierno"/></div>
              <div className="space-y-1"><Label htmlFor="promo-vigencia">Vigencia</Label><Input id="promo-vigencia" value={formData.vigenciaPromocion || ''} onChange={e => handleDiscountChange('vigenciaPromocion', e.target.value)} placeholder="Ej: Hasta 30/06/2024"/></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 items-end">
              <div className="space-y-1"><Label htmlFor="descuento-tipo">Tipo Descuento</Label>
                <Select value={formData.descuentoTipo || ''} onValueChange={val => handleDiscountChange('descuentoTipo', val as PresupuestoFormData['descuentoTipo'])}>
                  <SelectTrigger id="descuento-tipo"><SelectValue placeholder="Seleccionar..."/></SelectTrigger>
                  <SelectContent><SelectItem value="porcentaje">Porcentaje (%)</SelectItem><SelectItem value="fijo">Monto Fijo ($)</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="descuento-valor" className="flex items-center gap-1">
                  {formData.descuentoTipo === 'porcentaje' ? <Percent className="w-4 h-4 text-muted-foreground"/> : <span className="text-muted-foreground font-bold text-sm">$</span>}
                  Valor Descuento
                </Label>
                <Input id="descuento-valor" type="number" value={formData.descuentoValor || ''} onChange={e => handleDiscountChange('descuentoValor', e.target.value)} placeholder="Ej: 10 o 5000" min="0" step="any" disabled={!formData.descuentoTipo}/>
              </div>
            </div>
            {descuentoPromocional > 0 && <p className="text-sm text-destructive text-right mt-2">Descuento Aplicado: -{formatCurrency(descuentoPromocional)}</p>}
          </Card>

          <Separator className="my-4"/>
          
          {showAnnualAdjustmentLegend && (
            <div className="my-4 p-3 border-l-4 border-orange-400 bg-orange-50 text-orange-700 text-xs">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                </div>
                <div className="ml-3">
                  <p className="font-bold">Notificación de Ajuste Anual</p>
                  <p className="mt-1">
                    Este presupuesto podría estar sujeto a un ajuste del <strong>{displaySettings.annualAdjustmentPercentage}%</strong> por realizarse en un año futuro. Esto se reflejará en la facturación final.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2 print:hidden">
            <Label htmlFor="notas-presupuesto" className="text-base font-semibold text-primary/90">Notas Adicionales para el Resumen (Internas/Cliente)</Label>
            <Textarea id="notas-presupuesto" placeholder="Condiciones, validez, formas de pago..." value={formData.notas} onChange={(e) => setFormData(prev => ({...prev, notas: e.target.value}))} rows={4} className="text-base p-3"/>
          </div>
          
          <footer className="mt-6 pt-3 border-t border-gray-300 print:mt-2 print:pt-1.5 print:border-gray-400 text-xs print:text-[8pt] text-gray-600 print:text-black">
            <p>{BUDGET_DEPOSIT_NOTE_PDF}</p>
            {presupuesto.notas && displaySettings.showPaymentMethodNotes && <p className="mt-1 print:mt-0.5 whitespace-pre-line">{presupuesto.notas}</p>}
            {showAnnualAdjustmentLegend && (
              <p className="mt-1 print:mt-0.5 text-orange-600">
                  Nota: Este presupuesto podría estar sujeto a un ajuste anual del {displaySettings.annualAdjustmentPercentage}% si el evento se realiza en un año posterior al actual.
              </p>
            )}
          </footer>
        </CardContent>
      </Card>
      
      <Card className="shadow-md border-primary/20 print:hidden">
        <CardHeader className="bg-primary/5 p-4 md:p-6"><CardTitle className="font-headline text-lg md:text-xl text-primary">Acciones y Compartir</CardTitle><CardDescription>Copia, imprime o envía el resumen.</CardDescription></CardHeader>
        <CardContent className="p-4 md:p-6 space-y-3">
           <Textarea value={generarTextoWhatsApp()} readOnly rows={10} className="text-xs bg-muted/30 border-dashed"/>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button variant="outline" onClick={handleCopyToClipboard} className="w-full"><ClipboardCopy className="w-4 h-4 mr-2"/>Copiar Resumen</Button>
            <Button onClick={handleWhatsAppSend} className="w-full bg-green-500 hover:bg-green-600"><Send className="w-4 h-4 mr-2"/>Enviar por WhatsApp</Button>
            <Button variant="outline" onClick={handlePrint} className="w-full"><Printer className="w-4 h-4 mr-2"/>Imprimir/PDF</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


'use client';

import type { Presupuesto, PresupuestoFormData, ItemPresupuestado } from '@/types/presupuesto';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, ClipboardCopy, Send, Printer, Tag, Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Dispatch, SetStateAction } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Paso4ResumenProps {
  presupuesto: Presupuesto; // Ahora es el objeto Presupuesto completo (con ID temporal)
  formData: PresupuestoFormData; // Se sigue usando para manejar descuentos y notas
  setFormData: Dispatch<SetStateAction<PresupuestoFormData>>;
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Fecha no especificada';
  try {
    return new Date(dateString).toLocaleDateString('es-UY', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  } catch (e) {
    return 'Fecha inválida';
  }
};

export default function Paso4Resumen({ presupuesto, formData, setFormData }: Paso4ResumenProps) {
  const { toast } = useToast();

  const handleDiscountChange = (field: keyof Pick<PresupuestoFormData, 'nombrePromocion' | 'descuentoTipo' | 'descuentoValor' | 'vigenciaPromocion'>, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!presupuesto) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-xl font-semibold">Generando resumen...</p>
        <p className="text-muted-foreground">Asegúrate de haber completado los pasos anteriores.</p>
      </div>
    );
  }

  // Los cálculos de descuento ahora se hacen directamente con el objeto `presupuesto` (que es derivado de formData)
  const costoTotalAntesDescuento = presupuesto.costoTotalEstimado; // Este es el subtotal antes de descuento
  let descuentoAplicado = 0;
  const descuentoValorNum = parseFloat(formData.descuentoValor || '0'); // Usamos formData para los inputs de descuento

  if (formData.descuentoTipo && descuentoValorNum > 0) {
    if (formData.descuentoTipo === 'porcentaje') {
      descuentoAplicado = (costoTotalAntesDescuento * descuentoValorNum) / 100;
    } else { // fijo
      descuentoAplicado = descuentoValorNum;
    }
  }
  const totalFinalConDescuento = costoTotalAntesDescuento - descuentoAplicado;

  const generarTextoWhatsApp = () => {
    let texto = `🎉 *¡Presupuesto para tu Evento!* 🎉\n\n`;
    texto += `Estimado/a *${presupuesto.clienteNombre}*,\n\n`;
    texto += `Gracias por considerar a *AK Producciones* para tu *${presupuesto.eventoTipo}*.\n`;
    texto += `*Salón:* ${presupuesto.salonFiestas}\n`;
    texto += `*Fecha del Evento:* ${formatDate(presupuesto.eventoFecha)}\n`;
    texto += `*Cantidad de Invitados:* ${presupuesto.invitadosCantidad}\n`;
    if (presupuesto.protagonista1Nombre) {
      texto += `*Agasajado/s:* ${presupuesto.protagonista1Nombre}`;
      if (presupuesto.protagonista2Nombre) texto += ` y ${presupuesto.protagonista2Nombre}`;
      texto += `\n`;
    }
    if (presupuesto.nombreEmpresa) texto += `*Empresa:* ${presupuesto.nombreEmpresa}\n`;
    texto += `\n`;
    texto += `------------------------------------\n✨ *DETALLE DE SERVICIOS* ✨\n------------------------------------\n\n`;
    presupuesto.itemsPresupuestados.forEach(item => {
      texto += `  • ${item.nombreServicio} (${item.cantidad} ${item.unidad || 'unid.'} x ${formatCurrency(item.precioUnitario)} c/u): *${formatCurrency(item.costoTotalItem)}*\n`;
    });
    texto += `\n  SUBTOTAL: *${formatCurrency(costoTotalAntesDescuento)}*\n\n`;
    if (descuentoAplicado > 0 && formData.nombrePromocion) {
      texto += `🎁 *Promoción Aplicada: ${formData.nombrePromocion}*\n`;
      if (formData.descuentoTipo === 'porcentaje') texto += `  Descuento: ${formData.descuentoValor}% (${formatCurrency(descuentoAplicado)})\n`;
      else texto += `  Descuento: ${formatCurrency(descuentoAplicado)}\n`;
      if (formData.vigenciaPromocion) texto += `  Válido hasta: ${formData.vigenciaPromocion}\n`;
      texto += `\n`;
    }
    texto += `------------------------------------\n💰 *TOTAL FINAL: ${formatCurrency(totalFinalConDescuento)}*\n\n`;
    if(presupuesto.notas && presupuesto.notas.trim() !== ''){ texto += `📝 *Notas Adicionales:*\n${presupuesto.notas}\n\n`; }
    texto += `------------------------------------\n\n¡Esperamos tu consulta!\n*El equipo de AK Producciones*`;
    return texto;
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generarTextoWhatsApp())
      .then(() => toast({ title: "¡Texto Copiado!", description: "Resumen copiado." }))
      .catch(() => toast({ title: "Error al Copiar", variant: "destructive" }));
  };
  
  const handleWhatsAppSend = () => window.open(`https://wa.me/?text=${encodeURIComponent(generarTextoWhatsApp())}`, '_blank');
  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      <Card className="border-primary shadow-lg">
        <CardHeader className="bg-primary/5 p-6"><CardTitle className="font-headline text-2xl text-primary">Resumen del Presupuesto</CardTitle><CardDescription>Revisa los detalles, aplica descuentos y añade notas.</CardDescription></CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div><h3 className="font-semibold text-muted-foreground">Cliente:</h3><p className="text-lg font-medium">{presupuesto.clienteNombre}</p></div>
            <div><h3 className="font-semibold text-muted-foreground">Tipo Evento:</h3><p className="text-lg font-medium">{presupuesto.eventoTipo}</p></div>
            <div><h3 className="font-semibold text-muted-foreground">Salón:</h3><p className="text-lg font-medium">{presupuesto.salonFiestas}</p></div>
            <div><h3 className="font-semibold text-muted-foreground">Fecha:</h3><p className="text-lg font-medium">{formatDate(presupuesto.eventoFecha)}</p></div>
            <div><h3 className="font-semibold text-muted-foreground">Nº Invitados:</h3><p className="text-lg font-medium">{presupuesto.invitadosCantidad}</p></div>
            {presupuesto.protagonista1Nombre && <div><h3 className="font-semibold text-muted-foreground">Protagonista(s):</h3><p className="text-lg font-medium">{presupuesto.protagonista1Nombre}{presupuesto.protagonista2Nombre ? ` y ${presupuesto.protagonista2Nombre}` : ''}</p></div>}
            {presupuesto.nombreEmpresa && <div><h3 className="font-semibold text-muted-foreground">Empresa:</h3><p className="text-lg font-medium">{presupuesto.nombreEmpresa}</p></div>}
          </div>
          <Separator />
          <div className="py-2">
            <h4 className="font-semibold text-lg mb-2 text-primary/90">Servicios Incluidos:</h4>
            {presupuesto.itemsPresupuestados.length > 0 ? (
              <ul className="space-y-1 pl-1 text-sm">
                {presupuesto.itemsPresupuestados.map(item => (
                  <li key={item.idServicioCatalogo} className="flex justify-between items-center">
                    <span>{item.nombreServicio} ({item.cantidad} {item.unidad || 'unid.'} x {formatCurrency(item.precioUnitario)})</span>
                    <span className="font-medium">{formatCurrency(item.costoTotalItem)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground italic">No hay servicios seleccionados.</p>}
            <p className="text-right font-semibold mt-3 text-md">Subtotal Servicios: {formatCurrency(costoTotalAntesDescuento)}</p>
          </div>
          <Separator className="my-4"/>
          <Card className="bg-muted/20 p-4">
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
            {descuentoAplicado > 0 && <p className="text-sm text-destructive text-right mt-2">Descuento Aplicado: -{formatCurrency(descuentoAplicado)}</p>}
          </Card>
          <Separator className="my-4"/>
          <div className="space-y-2"><Label htmlFor="notas-presupuesto" className="text-base font-semibold text-primary/90">Notas Adicionales</Label><Textarea id="notas-presupuesto" placeholder="Condiciones, validez, formas de pago..." value={formData.notas} onChange={(e) => setFormData(prev => ({...prev, notas: e.target.value}))} rows={4} className="text-base p-3"/></div>
          <Separator className="my-4"/>
          <div className="text-right mt-6"><p className="text-sm text-muted-foreground">Total General Estimado</p><p className="text-3xl font-bold text-primary">{formatCurrency(totalFinalConDescuento)}</p></div>
        </CardContent>
      </Card>
      <Card className="shadow-md border-primary/20">
        <CardHeader className="bg-primary/5 p-6"><CardTitle className="font-headline text-xl text-primary">Acciones y Compartir</CardTitle><CardDescription>Copia, imprime o envía el resumen.</CardDescription></CardHeader>
        <CardContent className="p-6 space-y-3">
           <Textarea value={generarTextoWhatsApp()} readOnly rows={10} className="text-xs bg-muted/30 border-dashed"/>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button variant="outline" onClick={handleCopyToClipboard} className="w-full"><ClipboardCopy className="w-4 h-4 mr-2"/>Copiar</Button>
            <Button onClick={handleWhatsAppSend} className="w-full bg-green-500 hover:bg-green-600"><Send className="w-4 h-4 mr-2"/>WhatsApp</Button>
            <Button variant="outline" onClick={handlePrint} className="w-full"><Printer className="w-4 h-4 mr-2"/>Imprimir/PDF</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

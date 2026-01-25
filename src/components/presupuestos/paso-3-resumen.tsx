'use client';

import type { PresupuestoFormData, ItemPresupuestado } from '@/types/presupuesto';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tag, Percent, Trash2 } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { useMemo } from 'react';

interface Paso3ResumenProps {
  formData: PresupuestoFormData;
  setFormData: Dispatch<SetStateAction<PresupuestoFormData>>;
  totalCalculado: number;
  totalInvitados: number;
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

// Calculation function to ensure this component is self-contained
function calcularCostoItem(item: ItemPresupuestado, invitados: number): number {
  if (item.esRegalo) return 0;
  
  let itemTotal = 0;
  const precioUnitario = item.precioUnitarioPresupuesto ?? item.precioUnitario;

  switch (item.calculationMethod) {
    case 'fijo':
      itemTotal = item.precioBase ?? precioUnitario;
      break;
    case 'porPersona':
      itemTotal = (item.precioPorPersona ?? precioUnitario) * invitados;
      break;
    case 'ratio':
      const invitadosPorUnidadNum = Number(item.invitadosPorUnidad);
      if (invitadosPorUnidadNum > 0) {
        const basePrice = item.precioBase ?? precioUnitario;
        itemTotal = Math.ceil(invitados / invitadosPorUnidadNum) * basePrice;
      } else {
        itemTotal = item.precioBase ?? precioUnitario; // Fallback
      }
      break;
    case 'tramos':
      const tramo = item.tramosDePrecio?.find(t => invitados >= t.desde && invitados <= t.hasta);
      itemTotal = tramo?.precio || 0;
      break;
    default: // Fallback to simple calculation
      itemTotal = item.cantidad * precioUnitario;
  }
  return itemTotal;
}

export default function Paso3Resumen({ formData, setFormData, totalCalculado, totalInvitados }: Paso3ResumenProps) {

  const handleDiscountChange = (field: keyof Pick<PresupuestoFormData, 'nombrePromocion' | 'descuentoTipo' | 'descuentoValor' | 'vigenciaPromocion'>, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServicioDetailChange = (
    servicioId: string,
    field: 'cantidad' | 'precioUnitarioPresupuesto' | 'esRegalo',
    value: string | number | boolean
  ) => {
    setFormData(prev => {
      const newSelected = new Map(prev.serviciosSeleccionados);
      const currentServicio = newSelected.get(servicioId);
      if (currentServicio) {
        if (field === 'esRegalo') {
            const esRegalo = !!value;
            newSelected.set(servicioId, {
              ...currentServicio,
              esRegalo,
              precioUnitarioPresupuesto: esRegalo ? 0 : currentServicio.precioUnitarioOriginal,
            });
        } else {
            let numericValue = Number(value);
            if (field === 'cantidad') {
                numericValue = Math.max(1, Math.floor(numericValue));
            } else if (field === 'precioUnitarioPresupuesto') {
                numericValue = Math.max(0, numericValue);
            }
            newSelected.set(servicioId, {
              ...currentServicio,
              [field]: isNaN(numericValue) ? (field === 'cantidad' ? 1 : 0) : numericValue,
               esRegalo: false, // Uncheck gift if price/qty is manually changed
            });
        }
      }
      return { ...prev, serviciosSeleccionados: newSelected };
    });
  };

  const handleRemoveItem = (servicioId: string) => {
    setFormData(prev => {
      const newSelected = new Map(prev.serviciosSeleccionados);
      newSelected.delete(servicioId);
      return {...prev, serviciosSeleccionados: newSelected};
    });
  };

  const { descuentoAplicado, totalFinal } = useMemo(() => {
    let descuento = 0;
    const valor = parseFloat(formData.descuentoValor || '0');
    if (formData.descuentoTipo && valor > 0) {
      if (formData.descuentoTipo === 'porcentaje') {
        descuento = (totalCalculado * valor) / 100;
      } else {
        descuento = valor;
      }
    }
    return {
      descuentoAplicado: descuento,
      totalFinal: totalCalculado - descuento,
    };
  }, [formData.descuentoTipo, formData.descuentoValor, totalCalculado]);

  return (
    <div className="space-y-6">
        <div>
            <h3 className="text-lg font-medium font-headline text-primary mb-2">Servicios Seleccionados</h3>
            <div className="space-y-3">
            {Array.from(formData.serviciosSeleccionados.entries()).map(([id, servicio]) => {
                const item: ItemPresupuestado = {
                    idServicioCatalogo: id, ...servicio, 
                    precioUnitario: servicio.precioUnitarioOriginal, costoTotalItem: 0 // dummy for calc
                };
                const costoItem = calcularCostoItem(item, totalInvitados);

                return (
                    <div key={id} className="p-3 border rounded-md">
                        <div className="flex justify-between items-start">
                          <p className="font-semibold pr-2">{servicio.nombreServicio}</p>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive -mt-1 -mr-2" onClick={() => handleRemoveItem(id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2 items-end">
                            <div className="space-y-1">
                                <Label htmlFor={`qty-${id}`} className="text-xs">Cantidad</Label>
                                <Input id={`qty-${id}`} type="number" value={servicio.cantidad} onChange={e => handleServicioDetailChange(id, 'cantidad', e.target.value)} className="h-8 text-sm" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor={`price-${id}`} className="text-xs">Precio Unit. ($)</Label>
                                <Input id={`price-${id}`} type="number" value={servicio.precioUnitarioPresupuesto} onChange={e => handleServicioDetailChange(id, 'precioUnitarioPresupuesto', e.target.value)} className="h-8 text-sm" />
                            </div>
                            <div className="flex items-center space-x-2 pt-5">
                                <Checkbox id={`gift-${id}`} checked={servicio.esRegalo} onCheckedChange={(checked) => handleServicioDetailChange(id, 'esRegalo', !!checked)} />
                                <Label htmlFor={`gift-${id}`} className="text-xs">Regalo</Label>
                            </div>
                             <div className="text-right">
                                <p className="text-xs text-muted-foreground">Total Item</p>
                                <p className="font-semibold">{formatCurrency(costoItem)}</p>
                             </div>
                        </div>
                    </div>
                )
            })}
            </div>
        </div>

        <Separator />

        <div className="space-y-3">
            <h3 className="text-lg font-medium font-headline text-primary">Descuento / Promoción (Opcional)</h3>
            <div className="p-4 border rounded-md bg-muted/40 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><Label htmlFor="promo-nombre">Nombre Promoción</Label><Input id="promo-nombre" value={formData.nombrePromocion || ''} onChange={e => handleDiscountChange('nombrePromocion', e.target.value)} placeholder="Ej: Descuento Amigos"/></div>
                <div className="space-y-1"><Label htmlFor="promo-vigencia">Vigencia</Label><Input id="promo-vigencia" value={formData.vigenciaPromocion || ''} onChange={e => handleDiscountChange('vigenciaPromocion', e.target.value)} placeholder="Ej: Hasta 31/12"/></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="descuento-tipo">Tipo Descuento</Label>
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
                  <Input id="descuento-valor" type="number" value={formData.descuentoValor || ''} onChange={e => handleDiscountChange('descuentoValor', e.target.value)} min="0" step="any" disabled={!formData.descuentoTipo} placeholder="Ej: 10 o 5000"/>
                </div>
              </div>
            </div>

        <Separator/>
        
        <div className="space-y-2">
            <h3 className="text-lg font-medium font-headline text-primary">Resumen Final</h3>
            <div className="p-4 border rounded-lg bg-primary/5 space-y-2">
                 <div className="flex justify-between text-md"><span className="text-muted-foreground">Subtotal Servicios:</span><span className="font-medium">{formatCurrency(totalCalculado)}</span></div>
                 {descuentoAplicado > 0 && <div className="flex justify-between text-md text-destructive"><span className="text-destructive">Descuento:</span><span className="font-medium">-{formatCurrency(descuentoAplicado)}</span></div>}
                 <div className="flex justify-between text-xl font-bold pt-2 border-t"><span className="text-primary">TOTAL FINAL:</span><span className="text-primary">{formatCurrency(totalFinal)}</span></div>
            </div>
        </div>
        
        <Separator/>
        
        <div className="space-y-2">
            <Label htmlFor="notas" className="text-base">Notas Adicionales para el Cliente</Label>
            <Textarea 
              id="notas" 
              placeholder="Añade términos, condiciones de pago, o cualquier otra nota relevante aquí." 
              value={formData.notas} 
              onChange={(e) => setFormData(prev => ({...prev, notas: e.target.value}))} 
              rows={4} 
              className="text-base p-3" 
            />
        </div>
    </div>
  );
}

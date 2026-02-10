'use client';

import type { PresupuestoFormData, ItemPresupuestado, Presupuesto } from '@/types/presupuesto';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Gift, Tag, Percent } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface Paso3ResumenProps {
  formData: PresupuestoFormData;
  setFormData: Dispatch<SetStateAction<PresupuestoFormData>>;
  totalCalculado: number;
  totalInvitados: number;
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

// Helper function to decide which guest count to use for an item
function getGuestCountForItem(item: { nombreServicio: string, categoriaServicio?: string, subcategoria?: string }, adultos: number, adolescentes: number, ninos: number): number {
  const categoria = (item.categoriaServicio || '').toLowerCase();
  const subcategoria = (item.subcategoria || '').toLowerCase();
  const ninosYAdolescentes = ninos + adolescentes;
  
  if (categoria.includes('infantil') || categoria.includes('adolescente') || subcategoria.includes('infantil') || subcategoria.includes('adolescente')) {
    return ninosYAdolescentes;
  }
  
  if (categoria.includes('plato principal') || subcategoria.includes('plato principal')) {
    return adultos;
  }
  
  // For ALL OTHER services (Entradas, Postres, Bebidas, Vajilla, DJ, decor, etc.), count everyone.
  return adultos + adolescentes + ninos;
};

// Calculation function to ensure this component is self-contained
function calcularCostoItem(item: ItemPresupuestado, adultos: number, adolescentes: number, ninos: number): number {
  if (item.esRegalo) return 0;
  
  const totalInvitados = adultos + adolescentes + ninos;
  const cantidadInvitados = getGuestCountForItem(item, adultos, adolescentes, ninos);
  
  if (cantidadInvitados === 0 && (item.calculationMethod === 'porPersona' || item.calculationMethod === 'ratio')) {
    return 0;
  }

  let itemTotal = 0;
  const precioUnitario = item.precioUnitarioPresupuesto ?? item.precioUnitario;

  switch (item.calculationMethod) {
    case 'fijo': 
      itemTotal = (item.precioBase ?? precioUnitario) * (item.cantidad > 0 ? item.cantidad : 1);
      break;
    case 'porPersona': 
      itemTotal = (item.precioPorPersona ?? precioUnitario) * cantidadInvitados; 
      break;
    case 'ratio':
      const invitadosPorUnidadNum = Number(item.invitadosPorUnidad);
      if (invitadosPorUnidadNum > 0) {
        itemTotal = Math.ceil(cantidadInvitados / invitadosPorUnidadNum) * (item.precioBase ?? precioUnitario);
      } else {
        itemTotal = item.precioBase ?? precioUnitario; // Fallback
      }
      break;
    case 'tramos':
      const tramo = item.tramosDePrecio?.find(t => totalInvitados >= t.desde && totalInvitados <= t.hasta);
      itemTotal = tramo?.precio || 0;
      break;
    default: // Fallback to simple calculation
      itemTotal = item.cantidad * precioUnitario;
  }
  return itemTotal;
}

export default function Paso3Resumen({ formData, setFormData, totalCalculado, totalInvitados }: Paso3ResumenProps) {

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

  const { valorServicios, ahorroTotal, totalFinal, descuentoPromocional } = useMemo(() => {
    const adultos = formData.invitadosAdultos || 0;
    const adolescentes = formData.invitadosAdolescentes || 0;
    const ninos = formData.invitadosNinos || 0;

    const costoTotalRegalos = Array.from(formData.serviciosSeleccionados.values())
      .filter(item => item.esRegalo)
      .reduce((sum, item) => {
        const tempItem: ItemPresupuestado = {
          idServicioCatalogo: '', ...item, esRegalo: false, // temporarily unset to calculate real value
          precioUnitario: item.precioUnitarioOriginal, costoTotalItem: 0
        };
        return sum + calcularCostoItem(tempItem, adultos, adolescentes, ninos);
      }, 0);
      
    const subtotalBruto = totalCalculado;
    const valorServicios = subtotalBruto + costoTotalRegalos;

    let descPromo = 0;
    if (formData.descuentoTipo && formData.descuentoValor) {
        const valorNum = parseFloat(formData.descuentoValor) || 0;
        if (formData.descuentoTipo === 'porcentaje') {
            descPromo = (subtotalBruto * valorNum) / 100;
        } else {
            descPromo = valorNum;
        }
    }
    
    const ahorroTotal = descPromo + costoTotalRegalos;
    const totalFinal = subtotalBruto - descPromo;

    return {
      valorServicios,
      ahorroTotal,
      totalFinal,
      descuentoPromocional: descPromo,
    };
  }, [formData, totalCalculado]);

  return (
    <div className="space-y-6">
        <div>
            <h3 className="text-lg font-medium font-headline text-primary mb-2">Servicios Seleccionados</h3>
            <div className="space-y-3">
            {Array.from(formData.serviciosSeleccionados.entries()).map(([id, servicio]) => {
                const item: ItemPresupuestado = {
                    idServicioCatalogo: id, ...servicio, 
                    precioUnitario: servicio.precioUnitarioOriginal, costoTotalItem: 0,
                };
                const costoItem = calcularCostoItem(item, formData.invitadosAdultos || 0, formData.invitadosAdolescentes || 0, formData.invitadosNinos || 0);
                const costoItemSiNoFueraRegalo = calcularCostoItem({...item, esRegalo: false }, formData.invitadosAdultos || 0, formData.invitadosAdolescentes || 0, formData.invitadosNinos || 0);

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
                                {servicio.esRegalo ? (
                                  <>
                                    <p className="font-semibold text-green-600 flex items-center justify-end gap-1"><Gift className="w-4 h-4"/>REGALO</p>
                                    {costoItemSiNoFueraRegalo > 0 && <p className="text-xs text-muted-foreground line-through">{formatCurrency(costoItemSiNoFueraRegalo)}</p>}
                                  </>
                                ) : (
                                  <p className="font-semibold">{formatCurrency(costoItem)}</p>
                                )}
                             </div>
                        </div>
                    </div>
                )
            })}
            </div>
        </div>

        <Separator />
        
         <div className="pt-4 border-t mt-4 space-y-4">
            <h3 className="text-md font-medium flex items-center gap-2"><Tag className="w-5 h-5 text-primary"/>Promoción / Descuento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1"><Label htmlFor="promo-nombre">Nombre Promoción</Label><Input id="promo-nombre" value={formData.nombrePromocion || ''} onChange={e => setFormData(prev => ({...prev, nombrePromocion: e.target.value}))} placeholder="Ej: Descuento Amigos"/></div>
              <div className="space-y-1"><Label htmlFor="promo-vigencia">Vigencia</Label><Input id="promo-vigencia" value={formData.vigenciaPromocion || ''} onChange={e => setFormData(prev => ({...prev, vigenciaPromocion: e.target.value}))} placeholder="Ej: Hasta 31/12"/></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="descuento-tipo">Tipo Descuento</Label>
                <Select value={formData.descuentoTipo || ''} onValueChange={val => setFormData(prev => ({...prev, descuentoTipo: val as Presupuesto['descuentoTipo']}))}>
                  <SelectTrigger id="descuento-tipo"><SelectValue placeholder="Seleccionar..."/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="porcentaje">Porcentaje (%)</SelectItem>
                    <SelectItem value="fijo">Monto Fijo ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="descuento-valor" className="flex items-center gap-1">
                  {formData.descuentoTipo === 'porcentaje' ? <Percent className="w-4 h-4 text-muted-foreground"/> : <span className="text-muted-foreground font-bold text-sm">$</span>}
                  Valor Descuento
                </Label>
                <Input id="descuento-valor" type="number" value={formData.descuentoValor ?? ''} onChange={e => setFormData(prev => ({...prev, descuentoValor: e.target.value}))} min="0" step="any" disabled={!formData.descuentoTipo} placeholder="Ej: 15 o 5000"/>
              </div>
            </div>
        </div>
        
        <div className="space-y-2">
            <h3 className="text-lg font-medium font-headline text-primary">Resumen Final</h3>
            <div className="p-4 border rounded-lg bg-primary/5 space-y-2">
                 <div className="flex justify-between text-md">
                    <span className="text-muted-foreground">Valor de servicios:</span>
                    <span className="font-medium">{formatCurrency(valorServicios)}</span>
                </div>
                {ahorroTotal > 0 && (
                  <div className="flex justify-between text-md text-destructive">
                      <span>Descuento Promocional + Regalos:</span>
                      <span className="font-medium">-{formatCurrency(ahorroTotal)}</span>
                  </div>
                )}
                 <div className="flex justify-between text-xl font-bold pt-2 border-t">
                    <span className="text-primary">TOTAL A PAGAR:</span>
                    <span className="text-primary">{formatCurrency(totalFinal)}</span>
                 </div>
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
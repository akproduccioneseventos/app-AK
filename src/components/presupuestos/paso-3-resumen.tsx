
'use client';

import type { PresupuestoFormData, ItemPresupuestado } from '@/types/presupuesto';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tag, Percent } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { useMemo } from 'react';

interface Paso3ResumenProps {
  formData: PresupuestoFormData;
  setFormData: Dispatch<SetStateAction<PresupuestoFormData>>;
  totalCalculado: number;
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export default function Paso3Resumen({ formData, setFormData, totalCalculado }: Paso3ResumenProps) {

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
               esRegalo: false,
            });
        }
      }
      return { ...prev, serviciosSeleccionados: newSelected };
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
            {Array.from(formData.serviciosSeleccionados.entries()).map(([id, servicio]) => (
                <div key={id} className="p-3 border rounded-md">
                    <p className="font-semibold">{servicio.nombreServicio}</p>
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
                            <Label htmlFor={`gift-${id}`} className="text-xs">Marcar como Regalo</Label>
                        </div>
                    </div>
                </div>
            ))}
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
            <Textarea id="notas" placeholder="Añade términos, condiciones de pago, o cualquier otra nota relevante aquí." value={formData.notas} onChange={(e) => setFormData(prev => ({...prev, notas: e.target.value}))} rows={4} className="text-base p-3" />
        </div>
    </div>
  );
}


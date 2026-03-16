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
import { getGuestCountForItem, recalcularCostoItem } from '@/lib/calculations';

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

export default function Paso3Resumen({ formData, setFormData, totalCalculado, totalInvitados }: Paso3ResumenProps) {

  const handleServicioDetailChange = (
    servicioId: string,
    field: 'cantidad' | 'precioUnitarioPresupuesto' | 'esRegalo',
    value: string | number | boolean
  ) => {
    setFormData(prev => {
      const newSelected = new Map(prev.serviciosSeleccionados);
      const current = newSelected.get(servicioId);
      if (current) {
        if (field === 'esRegalo') {
            const esRegalo = !!value;
            newSelected.set(servicioId, {
              ...current,
              esRegalo,
              precioUnitarioPresupuesto: esRegalo ? 0 : current.precioUnitarioOriginal,
            });
        } else {
            let num = Number(value);
            newSelected.set(servicioId, {
              ...current,
              [field]: isNaN(num) ? 0 : num,
               esRegalo: false,
            });
        }
      }
      return { ...prev, serviciosSeleccionados: newSelected };
    });
  };

  const { subtotalBruto, ahorroTotal, totalFinal } = useMemo(() => {
    const adultos = formData.invitadosAdultos || 0;
    const adolescentes = formData.invitadosAdolescentes || 0;
    const ninos = formData.invitadosNinos || 0;

    const items = Array.from(formData.serviciosSeleccionados.entries()).map(([id, s]) => ({
        idServicioCatalogo: id, ...s, precioUnitario: s.precioUnitarioPresupuesto, costoTotalItem: 0
    }));

    const bruto = items.filter(i => !i.esRegalo).reduce((sum, i) => sum + recalcularCostoItem(i, adultos, adolescentes, ninos), 0);
    const regalos = items.filter(i => i.esRegalo).reduce((sum, i) => {
        const itemNormal = { ...i, esRegalo: false, precioUnitarioPresupuesto: i.precioUnitarioOriginal };
        return sum + recalcularCostoItem(itemNormal, adultos, adolescentes, ninos);
    }, 0);

    let descPromo = 0;
    const valorDesc = parseFloat(formData.descuentoValor || '0') || 0;
    if (formData.descuentoTipo === 'porcentaje') descPromo = (bruto * valorDesc) / 100;
    else if (formData.descuentoTipo === 'fijo') descPromo = valorDesc;
    
    return {
      subtotalBruto: bruto,
      ahorroTotal: Math.round(descPromo + regalos),
      totalFinal: Math.round(bruto - descPromo)
    };
  }, [formData]);

  return (
    <div className="space-y-6">
        <div>
            <h3 className="text-lg font-black font-headline text-primary uppercase mb-4">Servicios Seleccionados</h3>
            <div className="space-y-3">
            {Array.from(formData.serviciosSeleccionados.entries()).map(([id, servicio]) => {
                const itemParaCalculo: ItemPresupuestado = {
                    idServicioCatalogo: id, ...servicio, 
                    precioUnitario: servicio.precioUnitarioOriginal, costoTotalItem: 0,
                };
                const costoItem = recalcularCostoItem(itemParaCalculo, formData.invitadosAdultos || 0, formData.invitadosAdolescentes || 0, formData.invitadosNinos || 0);

                return (
                    <div key={id} className="p-4 border rounded-2xl bg-white shadow-sm group hover:border-primary/30 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold text-slate-800 uppercase text-sm tracking-tight">{servicio.nombreServicio}</p>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100" onClick={() => {
                              const newMap = new Map(formData.serviciosSeleccionados);
                              newMap.delete(id);
                              setFormData({...formData, serviciosSeleccionados: newMap});
                          }}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                            <div className="space-y-1"><Label className="text-[10px] uppercase font-black text-slate-400">Cant.</Label><Input type="number" value={servicio.cantidad} onChange={e => handleServicioDetailChange(id, 'cantidad', e.target.value)} className="h-10 rounded-xl" /></div>
                            <div className="space-y-1"><Label className="text-[10px] uppercase font-black text-slate-400">Precio ($)</Label><Input type="number" value={servicio.precioUnitarioPresupuesto} onChange={e => handleServicioDetailChange(id, 'precioUnitarioPresupuesto', e.target.value)} className="h-10 rounded-xl font-bold" /></div>
                            <div className="flex items-center space-x-2 pb-3"><Checkbox id={`gift-${id}`} checked={servicio.esRegalo} onCheckedChange={(v) => handleServicioDetailChange(id, 'esRegalo', !!v)} /><Label htmlFor={`gift-${id}`} className="text-xs font-bold text-rose-600">Es Regalo</Label></div>
                             <div className="text-right pb-1">
                                <p className="text-[10px] uppercase font-black text-slate-400">Subtotal</p>
                                {servicio.esRegalo ? (
                                  <p className="font-black text-green-600 text-lg">REGALO</p>
                                ) : (
                                  <p className="font-black text-slate-800 text-lg">{formatCurrency(costoItem)}</p>
                                )}
                             </div>
                        </div>
                    </div>
                )
            })}
            </div>
        </div>

        <Separator />
        
         <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-6">
            <h3 className="text-md font-black uppercase tracking-widest text-primary flex items-center gap-2"><Tag className="w-5 h-5"/>Promoción y Descuentos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5"><Label className="text-[10px] uppercase font-black text-slate-400">Nombre de la Promoción</Label><Input value={formData.nombrePromocion || ''} onChange={e => setFormData({...formData, nombrePromocion: e.target.value})} className="rounded-xl border-slate-200" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] uppercase font-black text-slate-400">Vigencia</Label><Input value={formData.vigenciaPromocion || ''} onChange={e => setFormData({...formData, vigenciaPromocion: e.target.value})} className="rounded-xl border-slate-200" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black text-slate-400">Tipo de Descuento</Label>
                <Select value={formData.descuentoTipo || 'porcentaje'} onValueChange={v => setFormData({...formData, descuentoTipo: v as any})}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-2xl"><SelectItem value="porcentaje">Porcentaje (%)</SelectItem><SelectItem value="fijo">Monto Fijo ($)</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black text-slate-400">Valor</Label>
                <Input type="number" value={formData.descuentoValor ?? ''} onChange={e => setFormData({...formData, descuentoValor: e.target.value})} className="rounded-xl border-slate-200 h-11 font-bold" />
              </div>
            </div>
        </div>
        
        <div className="p-8 border-none shadow-2xl rounded-[2.5rem] bg-slate-900 text-white space-y-4">
            <div className="flex justify-between items-center text-sm font-bold opacity-60 uppercase tracking-widest"><span>Servicios Contratados:</span><span>{formatCurrency(subtotalBruto)}</span></div>
            {ahorroTotal > 0 && <div className="flex justify-between items-center text-sm font-black text-rose-400 uppercase tracking-widest"><span>Total Ahorro (Regalos + Promo):</span><span>-{formatCurrency(ahorroTotal)}</span></div>}
            <Separator className="bg-white/10" />
            <div className="flex justify-between items-center">
                <span className="text-xl font-black uppercase tracking-tighter">Total Final a Cobrar:</span>
                <span className="text-4xl font-black text-primary">{formatCurrency(totalFinal)}</span>
            </div>
        </div>
        
        <div className="space-y-2"><Label className="text-[10px] uppercase font-black text-slate-400">Notas y Condiciones para el Cliente</Label><Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={4} className="rounded-2xl bg-slate-50 border-none shadow-inner" /></div>
    </div>
  );
}

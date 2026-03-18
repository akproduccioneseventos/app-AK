
'use client';

import type { PresupuestoFormData, ItemPresupuestado } from '@/types/presupuesto';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Gift, Tag, Percent, Info, TrendingUp } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getGuestCountForItem, recalcularCostoItem } from '@/lib/calculations';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

  const { itemsAgrupados, subtotalBruto, ahorroRegalos, bonificacionPromo, totalSinAjuste, ajusteAnual, totalFinal, aniosDiferencia } = useMemo(() => {
    const adultos = formData.invitadosAdultos || 0;
    const ninos = (formData.invitadosNinos || 0) + (formData.invitadosAdolescentes || 0);

    const items = Array.from(formData.serviciosSeleccionados.entries()).map(([id, s]) => ({
        idServicioCatalogo: id, ...s, precioUnitario: s.precioUnitarioPresupuesto, costoTotalItem: 0
    }));

    // Agrupamiento por categorías - Sincronizado
    const agrupados: Record<string, any[]> = items.reduce((acc, item) => {
      const categoria = item.esRegalo ? 'Regalos Incluidos' : (item.categoriaServicio || 'Otros Servicios');
      if (!acc[categoria]) acc[categoria] = [];
      acc[categoria].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    // Ordenar categorías: Alfabético pero "Regalos Incluidos" siempre al final
    const sortedCategories = Object.keys(agrupados).sort((a, b) => {
        if (a === 'Regalos Incluidos') return 1;
        if (b === 'Regalos Incluidos') return -1;
        return a.localeCompare(b);
    });

    const sortedAgrupados: Record<string, any[]> = {};
    sortedCategories.forEach(key => sortedAgrupados[key] = agrupados[key]);

    // Cálculos financieros auditados
    const brutoVenta = items.filter(i => !i.esRegalo).reduce((sum, i) => sum + recalcularCostoItem(i as any, adultos, 0, ninos), 0);
    const regalosVal = items.filter(i => i.esRegalo).reduce((sum, i) => {
        const itemNormal = { ...i, esRegalo: false, precioUnitarioPresupuesto: i.precioUnitarioOriginal };
        return sum + recalcularCostoItem(itemNormal as any, adultos, 0, ninos);
    }, 0);

    let descPromo = 0;
    const valorDesc = parseFloat(formData.descuentoValor || '0') || 0;
    if (formData.descuentoTipo === 'porcentaje') descPromo = (brutoVenta * valorDesc) / 100;
    else if (formData.descuentoTipo === 'fijo') descPromo = valorDesc;
    
    const totalSinAj = brutoVenta - descPromo;

    // Ajuste Anual 15%
    let ajAnual = 0;
    let aniosDif = 0;
    if (formData.eventoFecha) {
        const anioCreacion = new Date().getFullYear();
        const anioEvento = formData.eventoFecha.getFullYear();
        aniosDif = Math.max(0, anioEvento - anioCreacion);
        if (aniosDif > 0) {
            ajAnual = totalSinAj * (Math.pow(1.15, aniosDif) - 1);
        }
    }

    return {
      itemsAgrupados: sortedAgrupados,
      subtotalBruto: brutoVenta + regalosVal,
      ahorroRegalos: Math.round(regalosVal),
      bonificacionPromo: Math.round(descPromo),
      totalSinAjuste: Math.round(totalSinAj),
      ajusteAnual: Math.round(ajAnual),
      totalFinal: Math.round(totalSinAj + ajAnual),
      aniosDiferencia: aniosDif
    };
  }, [formData]);

  return (
    <div className="space-y-8">
        <div>
            <h3 className="text-xl font-black font-headline text-slate-800 uppercase tracking-tight mb-6">Revisión de Servicios</h3>
            <div className="space-y-6">
            {Object.entries(itemsAgrupados).map(([categoria, items]) => (
                <div key={categoria} className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
                        <div className="w-1.5 h-4 bg-primary rounded-full"></div> {categoria}
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                        {items.map(servicio => {
                            const id = servicio.idServicioCatalogo;
                            const itemParaCalculo = { ...servicio, precioUnitario: servicio.precioUnitarioOriginal, costoTotalItem: 0 };
                            const costoItem = recalcularCostoItem(itemParaCalculo as any, formData.invitadosAdultos || 0, 0, (formData.invitadosNinos || 0) + (formData.invitadosAdolescentes || 0));

                            return (
                                <div key={id} className={cn(
                                    "p-5 border-2 rounded-[1.5rem] bg-white transition-all group",
                                    servicio.esRegalo ? "border-green-100 bg-green-50/10" : "border-slate-100 hover:border-primary/20"
                                )}>
                                    <div className="flex justify-between items-start mb-4">
                                      <div>
                                        <p className="font-black text-slate-800 uppercase text-sm tracking-tight">{servicio.nombreServicio}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{servicio.categoriaServicio}</p>
                                      </div>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                                          const newMap = new Map(formData.serviciosSeleccionados);
                                          newMap.delete(id);
                                          setFormData({...formData, serviciosSeleccionados: newMap});
                                      }}><Trash2 className="w-4 h-4" /></Button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-end">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] uppercase font-black text-slate-400">Cant.</Label>
                                            <Input type="number" value={servicio.cantidad} onChange={e => handleServicioDetailChange(id, 'cantidad', e.target.value)} className="h-10 rounded-xl bg-slate-50 border-none shadow-inner text-center font-bold" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] uppercase font-black text-slate-400">Precio Unit. ($)</Label>
                                            <Input type="number" value={servicio.precioUnitarioPresupuesto} onChange={e => handleServicioDetailChange(id, 'precioUnitarioPresupuesto', e.target.value)} className="h-10 rounded-xl bg-slate-50 border-none shadow-inner font-black text-primary" />
                                        </div>
                                        <div className="flex items-center space-x-2 pb-2">
                                            <Checkbox id={`gift-${id}`} checked={servicio.esRegalo} onCheckedChange={(v) => handleServicioDetailChange(id, 'esRegalo', !!v)} className="rounded-lg h-5 w-5" />
                                            <Label htmlFor={`gift-${id}`} className="text-[10px] font-black uppercase text-green-600 tracking-widest cursor-pointer">Es Regalo</Label>
                                        </div>
                                         <div className="text-right pb-1">
                                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Subtotal</p>
                                            {servicio.esRegalo ? (
                                              <Badge className="bg-green-600 text-white border-none font-black text-[10px] px-3">REGALO</Badge>
                                            ) : (
                                              <p className="font-black text-slate-800 text-xl tracking-tighter">{formatCurrency(costoItem)}</p>
                                            )}
                                         </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
            </div>
        </div>

        <Separator className="opacity-50" />
        
         <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Tag className="w-5 h-5"/></div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800">Promoción y Descuentos</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nombre de la Promoción</Label><Input value={formData.nombrePromocion || ''} onChange={e => setFormData({...formData, nombrePromocion: e.target.value})} className="rounded-xl h-11 bg-white border-slate-200" placeholder="Ej: Descuento Amigos" /></div>
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Vigencia</Label><Input value={formData.vigenciaPromocion || ''} onChange={e => setFormData({...formData, vigenciaPromocion: e.target.value})} className="rounded-xl h-11 bg-white border-slate-200" placeholder="Ej: Válido por 30 días" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo de Descuento</Label>
                <Select value={formData.descuentoTipo || 'porcentaje'} onValueChange={v => setFormData({...formData, descuentoTipo: v as any})}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl"><SelectItem value="porcentaje">Porcentaje (%)</SelectItem><SelectItem value="fijo">Monto Fijo ($)</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Valor</Label>
                <Input type="number" value={formData.descuentoValor ?? ''} onChange={e => setFormData({...formData, descuentoValor: e.target.value})} className="rounded-xl border-slate-200 h-11 font-black text-primary bg-white shadow-sm" />
              </div>
            </div>
        </div>
        
        <div className="p-10 border-none shadow-3xl rounded-[3rem] bg-slate-900 text-white space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><TrendingUp className="w-32 h-32 text-primary"/></div>
            
            <div className="space-y-3 relative z-10">
                <div className="flex justify-between items-center text-[10px] font-black uppercase opacity-40 tracking-[0.3em]"><span>Servicios Seleccionados:</span><span>{formatCurrency(subtotalBruto - ahorroRegalos)}</span></div>
                {ahorroRegalos > 0 && <div className="flex justify-between items-center text-[10px] font-black text-green-400 uppercase tracking-[0.3em]"><span>Ahorro por Regalos:</span><span>-{formatCurrency(ahorroRegalos)}</span></div>}
                {bonificacionPromo > 0 && <div className="flex justify-between items-center text-[10px] font-black text-rose-400 uppercase tracking-[0.3em]"><span>{formData.nombrePromocion || 'Bonificación'}:</span><span>-{formatCurrency(bonificacionPromo)}</span></div>}
                {ajusteAnual > 0 && (
                    <div className="flex justify-between items-center text-[10px] font-black text-amber-400 uppercase tracking-[0.3em]">
                        <span>Ajuste Anual ({aniosDiferencia} añ. 15%):</span>
                        <span>+{formatCurrency(ajusteAnual)}</span>
                    </div>
                )}
            </div>
            
            <Separator className="bg-white/10" />
            
            <div className="flex justify-between items-center relative z-10 pt-2">
                <span className="text-xl font-black uppercase tracking-tighter">Total Final Pactado:</span>
                <span className="text-5xl font-black text-primary drop-shadow-[0_0_15px_rgba(225,29,72,0.3)]">{formatCurrency(totalFinal)}</span>
            </div>
        </div>
        
        <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 flex items-center gap-2"><Info className="w-3.5 h-3.5"/> Notas y Condiciones para el Cliente</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={4} className="rounded-[2rem] p-6 bg-slate-50 border-none shadow-inner font-medium text-slate-600 leading-relaxed" placeholder="Ej: Forma de pago, plazos de reserva, etc." />
        </div>
    </div>
  );
}

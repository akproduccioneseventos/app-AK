
'use client';

import type { PresupuestoFormData } from '@/types/presupuesto';
import type { ServicioEmpresa } from '@/types/empresa';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sparkles, PackageSearch, PlusCircle, Search, Trash2 } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import React, { useState, useMemo } from 'react';
import { Separator } from '@/components/ui/separator';
import type { PaqueteArmadoRapido } from '@/types/armado-rapido';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import EditServicioForm from '@/components/presupuestos/EditServicioForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface Paso2ServiciosProps {
  formData: PresupuestoFormData;
  setFormData: Dispatch<SetStateAction<PresupuestoFormData>>;
  serviciosCatalogo: ServicioEmpresa[];
  paquetesBase: PaqueteArmadoRapido[];
  onCatalogUpdate: () => Promise<void>;
  totalInvitados: number;
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

type ServicioSeleccionadoValue = PresupuestoFormData['serviciosSeleccionados'] extends Map<any, infer V> ? V : never;

export default function Paso2Servicios({ formData, setFormData, serviciosCatalogo, paquetesBase, onCatalogUpdate, totalInvitados }: Paso2ServiciosProps) {
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isCatalogManagerOpen, setIsCatalogManagerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleServicioToggle = (servicio: ServicioEmpresa) => {
    setFormData(prev => {
      const newSelected = new Map(prev.serviciosSeleccionados);
      if (newSelected.has(servicio.id)) {
        newSelected.delete(servicio.id);
      } else {
        newSelected.set(servicio.id, {
          cantidad: 1,
          precioUnitarioOriginal: servicio.precioVenta || servicio.precioPorPersona || servicio.precioBase || 0,
          precioUnitarioPresupuesto: servicio.precioVenta || servicio.precioPorPersona || servicio.precioBase || 0,
          nombreServicio: servicio.nombre,
          unidad: servicio.unidad,
          categoriaServicio: servicio.categoria,
          esRegalo: false,
          calculationMethod: servicio.calculationMethod,
          precioBase: servicio.precioBase,
          precioPorPersona: servicio.precioPorPersona,
          invitadosPorUnidad: servicio.invitadosPorUnidad,
          tramosDePrecio: servicio.tramosDePrecio,
        });
      }
      return { ...prev, serviciosSeleccionados: newSelected };
    });
    // Don't close modal, allow multiple selections
  };
  
  const handleRemoveServicio = (servicioId: string) => {
    setFormData(prev => {
      const newSelected = new Map(prev.serviciosSeleccionados);
      newSelected.delete(servicioId);
      return {...prev, serviciosSeleccionados: newSelected};
    });
  };

  const handlePaqueteSelect = (paquete: PaqueteArmadoRapido | 'none') => {
    const newSelected = new Map<string, ServicioSeleccionadoValue>();
    if (paquete !== 'none') {
        paquete.serviciosIncluidos.forEach(servicioEnPaquete => {
            const servicioCompleto = serviciosCatalogo.find(s => s.id === servicioEnPaquete.id);
            if (servicioCompleto) {
                const esRegalo = servicioEnPaquete.esRegalo || false;
                newSelected.set(servicioCompleto.id, {
                    cantidad: 1,
                    precioUnitarioOriginal: servicioCompleto.precioVenta || servicioCompleto.precioPorPersona || servicioCompleto.precioBase || 0,
                    precioUnitarioPresupuesto: esRegalo ? 0 : (servicioCompleto.precioVenta || servicioCompleto.precioPorPersona || servicioCompleto.precioBase || 0),
                    nombreServicio: servicioCompleto.nombre,
                    unidad: servicioCompleto.unidad,
                    categoriaServicio: servicioCompleto.categoria,
                    esRegalo: esRegalo,
                    calculationMethod: servicioCompleto.calculationMethod,
                    precioBase: servicioCompleto.precioBase,
                    precioPorPersona: servicioCompleto.precioPorPersona,
                    invitadosPorUnidad: servicioCompleto.invitadosPorUnidad,
                    tramosDePrecio: servicioCompleto.tramosDePrecio,
                });
            }
        });
    }
    setFormData(prev => ({ ...prev, serviciosSeleccionados: newSelected }));
  };
  
  const serviciosFiltrados = useMemo(() => {
    return serviciosCatalogo.filter(s => 
      s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [serviciosCatalogo, searchTerm]);

  const serviciosAgrupados = useMemo(() => {
    return serviciosFiltrados.reduce((acc, servicio) => {
        const categoria = servicio.categoria || 'Otros';
        if (!acc[categoria]) {
            acc[categoria] = [];
        }
        acc[categoria].push(servicio);
        return acc;
    }, {} as Record<string, ServicioEmpresa[]>);
  }, [serviciosFiltrados]);

  return (
    <div className="space-y-6">
       <Dialog open={isCatalogModalOpen} onOpenChange={setIsCatalogModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Añadir Servicio desde Catálogo</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <Input placeholder="Buscar servicio..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <ScrollArea className="h-72 border rounded-md">
              <Accordion type="multiple" className="w-full" defaultValue={Object.keys(serviciosAgrupados)}>
                {Object.keys(serviciosAgrupados).sort().map(categoria => (
                  <AccordionItem value={categoria} key={categoria}>
                    <AccordionTrigger className="px-3 py-2 text-sm">{categoria}</AccordionTrigger>
                    <AccordionContent className="px-3">
                      {serviciosAgrupados[categoria].map(servicio => {
                        const isSelected = formData.serviciosSeleccionados.has(servicio.id);
                        return (
                          <div key={servicio.id} className="flex items-center space-x-2 py-1.5 border-b last:border-b-0">
                            <Checkbox id={`modal-serv-${servicio.id}`} checked={isSelected} onCheckedChange={() => handleServicioToggle(servicio)}/>
                            <Label htmlFor={`modal-serv-${servicio.id}`} className="text-sm font-normal flex-grow cursor-pointer">{servicio.nombre}</Label>
                            <span className="text-xs text-muted-foreground">{formatCurrency(servicio.precioVenta || servicio.precioPorPersona || servicio.precioBase)}</span>
                          </div>
                        )
                      })}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="space-y-2">
        <Label htmlFor="paquete-base" className="text-base">Arrancar con un Paquete Base (Opcional)</Label>
        <Select onValueChange={(value) => handlePaqueteSelect(paquetesBase.find(p => p.id === value) || 'none')}>
            <SelectTrigger id="paquete-base"><SelectValue placeholder="Ninguno (empezar de cero)"/></SelectTrigger>
            <SelectContent>
                <SelectItem value="none">Ninguno</SelectItem>
                {paquetesBase.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
            </SelectContent>
        </Select>
      </div>
      <Separator />

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium font-headline text-primary">Servicios Seleccionados</h3>
          <Button type="button" onClick={() => setIsCatalogModalOpen(true)}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Servicio desde Catálogo</Button>
        </div>
        <Card>
          <CardContent className="p-4 space-y-2">
            {formData.serviciosSeleccionados.size > 0 ? (
                Array.from(formData.serviciosSeleccionados.values()).map(servicio => {
                    const servicioOriginal = serviciosCatalogo.find(s => s.nombre === servicio.nombreServicio);
                    const item: ItemPresupuestado = {
                        idServicioCatalogo: servicioOriginal?.id || '',
                        ...servicio,
                        precioUnitario: servicio.precioUnitarioOriginal,
                        costoTotalItem: 0 // Will be calculated in parent
                    };
                    const costoItem = calcularCostoItem(item, totalInvitados);
                    return (
                        <div key={servicio.nombreServicio} className="flex justify-between items-center p-2 border-b last:border-b-0">
                           <div className="flex-grow">
                                <p className="font-semibold text-sm">{servicio.nombreServicio}</p>
                                <p className="text-xs text-muted-foreground">{formatCurrency(costoItem)}</p>
                           </div>
                           <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveServicio(servicioOriginal?.id || '')}>
                                <Trash2 className="w-4 h-4" />
                           </Button>
                        </div>
                    );
                })
            ) : (
                <p className="text-center text-muted-foreground py-4">No hay servicios seleccionados.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="pt-4 mt-4 border-t text-right">
        <p className="text-sm text-muted-foreground">Subtotal de Servicios</p>
        <p className="text-2xl font-bold text-primary">{formatCurrency(Array.from(formData.serviciosSeleccionados.values()).reduce((sum, servicio) => {
            const servicioOriginal = serviciosCatalogo.find(s => s.nombre === servicio.nombreServicio);
            if (!servicioOriginal) return sum;
            const item: ItemPresupuestado = {
                idServicioCatalogo: servicioOriginal?.id || '',
                ...servicio,
                precioUnitario: servicio.precioUnitarioOriginal,
                costoTotalItem: 0
            };
            return sum + calcularCostoItem(item, totalInvitados);
        }, 0))}</p>
      </div>
    </div>
  );
}



'use client';

import type { PresupuestoFormData, ItemPresupuestado } from '@/types/presupuesto';
import type { ServicioEmpresa } from '@/types/empresa';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, PackageSearch, PlusCircle, Search, Trash2, ChefHat } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Separator } from '@/components/ui/separator';
import type { PaqueteArmadoRapido, MenuArmadoRapido } from '@/types/armado-rapido';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import EditServicioForm from '@/components/presupuestos/EditServicioForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { FullMenu, MenuItem } from '@/types/catering';
import { MultiSelect } from '@/components/ui/multi-select'; 
import { useToast } from '@/hooks/use-toast';

interface Paso2ServiciosProps {
  formData: PresupuestoFormData;
  setFormData: Dispatch<SetStateAction<PresupuestoFormData>>;
  serviciosCatalogo: ServicioEmpresa[];
  paquetesBase: PaqueteArmadoRapido[];
  allMenus: FullMenu[];
  onCatalogUpdate: () => Promise<void>;
  totalInvitados: number;
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

type ServicioSeleccionadoValue = PresupuestoFormData['serviciosSeleccionados'] extends Map<any, infer V> ? V : never;

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

const menuItemToServicioSeleccionado = (item: MenuItem, invitados: number): ServicioSeleccionadoValue => {
    // PVP es prioritario, si no, el costo con margen por defecto.
    const precioVenta = item.suggestedSellingPrice ?? (item.totalDishCost || 0);
    return {
        cantidad: invitados, // Para cálculo por persona
        precioUnitarioOriginal: precioVenta,
        precioUnitarioPresupuesto: precioVenta,
        nombreServicio: item.name,
        unidad: 'Por Persona',
        categoriaServicio: 'Servicio de catering',
        esRegalo: false,
        calculationMethod: 'porPersona',
        precioPorPersona: precioVenta,
    };
};


export default function Paso2Servicios({ formData, setFormData, serviciosCatalogo, paquetesBase, allMenus, onCatalogUpdate, totalInvitados }: Paso2ServiciosProps) {
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const { entradas, platosPrincipales, menusInfantiles } = useMemo(() => {
    if (!allMenus || allMenus.length === 0) {
      return { entradas: [], platosPrincipales: [], menusInfantiles: [] };
    }
    const allItems = allMenus.flatMap(m => m.items);
    const sortByPrice = (a: MenuItem, b: MenuItem) => {
        const priceA = a.suggestedSellingPrice ?? a.totalDishCost ?? 0;
        const priceB = b.suggestedSellingPrice ?? b.totalDishCost ?? 0;
        return priceA - priceB;
    };
    return {
      entradas: allItems.filter(item => item.type === 'Entrada').sort(sortByPrice),
      platosPrincipales: allItems.filter(item => item.type === 'Plato Principal').sort(sortByPrice),
      menusInfantiles: allItems.filter(item => item.type === 'Menú Infantil/Adolescente').sort(sortByPrice),
    }
  }, [allMenus]);

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
  };
  
  const handleRemoveServicio = (servicioId: string) => {
    setFormData(prev => {
      const newSelected = new Map(prev.serviciosSeleccionados);
      newSelected.delete(servicioId);
      return {...prev, serviciosSeleccionados: newSelected};
    });
  };

  const handlePaqueteSelect = (paqueteId: string) => {
    const paquete = paquetesBase.find(p => p.id === paqueteId);
    setFormData(prev => {
      const newSelected = new Map(prev.serviciosSeleccionados);
      // Remove all package-based services before adding new ones, but keep gastronomic selections
      paquetesBase.flatMap(p => p.serviciosIncluidos).forEach(s => newSelected.delete(s.id));
      
      if (paquete) {
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
      return { ...prev, serviciosSeleccionados: newSelected };
    });
  };
  
  const handleGastronomicSelectionChange = (type: 'entradas' | 'principal' | 'infantil', selectedIds: string | string[]) => {
      setFormData(prev => {
        const newSelected = new Map(prev.serviciosSeleccionados);
        
        const itemsToClear = type === 'entradas' ? entradas : type === 'principal' ? platosPrincipales : menusInfantiles;
        itemsToClear.forEach(item => {
            if (newSelected.has(item.id)) {
                newSelected.delete(item.id);
            }
        });

        const idsToAdd = Array.isArray(selectedIds) ? selectedIds : [selectedIds];
        idsToAdd.forEach(id => {
            const allDishes = [...entradas, ...platosPrincipales, ...menusInfantiles];
            const dishToAdd = allDishes.find(d => d.id === id);
            if (dishToAdd) {
                newSelected.set(dishToAdd.id, menuItemToServicioSeleccionado(dishToAdd, totalInvitados));
            }
        });
        
        return { ...prev, serviciosSeleccionados: newSelected };
      });
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
        if (!acc[categoria]) acc[categoria] = [];
        acc[categoria].push(servicio);
        return acc;
    }, {} as Record<string, ServicioEmpresa[]>);
  }, [serviciosFiltrados]);
  
   const totalCalculado = useMemo(() => {
      let total = 0;
      formData.serviciosSeleccionados.forEach((item, id) => {
        const itemDataForCalc: ItemPresupuestado = {
          idServicioCatalogo: id,
          ...item,
          precioUnitario: item.precioUnitarioOriginal,
          costoTotalItem: 0 // dummy for calc
        };
        total += calcularCostoItem(itemDataForCalc, totalInvitados);
      });
      return total;
    }, [formData.serviciosSeleccionados, totalInvitados]);

  return (
    <div className="space-y-6">
       <Dialog open={isCatalogModalOpen} onOpenChange={setIsCatalogModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Añadir Servicio desde Catálogo</DialogTitle>
            <DialogDescription>
                Selecciona los servicios que deseas añadir a este presupuesto.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                <Input placeholder="Buscar servicios..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9"/>
            </div>
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
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="secondary" className="mr-auto">Editar Catálogo</Button>
                </SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Gestionar Catálogo de Servicios</SheetTitle>
                        <SheetDescription>Añade o edita servicios. Los cambios se reflejarán en todos los presupuestos.</SheetDescription>
                    </SheetHeader>
                    <EditServicioForm onCatalogUpdate={onCatalogUpdate} />
                </SheetContent>
            </Sheet>
            <DialogClose asChild>
              <Button variant="outline">Cerrar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="space-y-2">
        <Label htmlFor="paquete-base" className="text-base">Arrancar con un Paquete Base (Opcional)</Label>
        <Select onValueChange={(value) => handlePaqueteSelect(value)}><SelectTrigger id="paquete-base"><SelectValue placeholder="Ninguno (empezar de cero)"/></SelectTrigger><SelectContent><SelectItem value="none">Ninguno</SelectItem>{paquetesBase.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent></Select>
      </div>

       <Accordion type="single" collapsible className="w-full" defaultValue="gastronomia">
        <AccordionItem value="gastronomia">
          <AccordionTrigger className="text-lg font-medium text-primary hover:no-underline">
              <div className="flex items-center gap-2"><ChefHat className="w-5 h-5"/>Menú Gastronómico</div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <div className="p-4 border rounded-md bg-muted/30 space-y-6">
                <div className='space-y-2'>
                  <Label>Entradas (Selección múltiple)</Label>
                  <MultiSelect
                    options={entradas.map(e => ({ value: e.id, label: `${e.name} (${formatCurrency(e.suggestedSellingPrice ?? e.totalDishCost)})` }))}
                    selected={Array.from(formData.serviciosSeleccionados.keys()).filter(id => entradas.some(e => e.id === id))}
                    onValueChange={(selected) => handleGastronomicSelectionChange('entradas', selected)}
                    placeholder="Selecciona las entradas..."
                    className="w-full"
                  />
                </div>
                 <div className='space-y-2'>
                  <Label>Plato Principal (Selección única)</Label>
                  <Select
                    onValueChange={(value) => handleGastronomicSelectionChange('principal', value)}
                    value={Array.from(formData.serviciosSeleccionados.keys()).find(id => platosPrincipales.some(p => p.id === id)) || ''}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecciona un plato principal..."/></SelectTrigger>
                    <SelectContent>
                      {platosPrincipales.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({formatCurrency(p.suggestedSellingPrice ?? p.totalDishCost)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                 <div className='space-y-2'>
                  <Label>Menú Infantil/Adolescente</Label>
                   <Select
                    onValueChange={(value) => handleGastronomicSelectionChange('infantil', value)}
                    value={Array.from(formData.serviciosSeleccionados.keys()).find(id => menusInfantiles.some(m => m.id === id)) || ''}
                    disabled={(formData.invitadosNinos || 0) === 0}
                  >
                    <SelectTrigger><SelectValue placeholder={(formData.invitadosNinos || 0) > 0 ? "Selecciona un menú..." : "Añade niños/adolescentes en Paso 1"}/></SelectTrigger>
                    <SelectContent>
                      {menusInfantiles.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                           {m.name} ({formatCurrency(m.suggestedSellingPrice ?? m.totalDishCost)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator />

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium font-headline text-primary">Servicios Adicionales</h3>
          <Button type="button" variant="outline" size="sm" onClick={() => setIsCatalogModalOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2"/>Añadir desde Catálogo
          </Button>
        </div>
        <Card>
          <CardContent className="p-4 space-y-2">
            {Array.from(formData.serviciosSeleccionados.entries()).filter(([id, serv]) => serv.categoriaServicio !== 'Servicio de catering').length > 0 ? (
                Array.from(formData.serviciosSeleccionados.entries())
                  .filter(([id, serv]) => serv.categoriaServicio !== 'Servicio de catering')
                  .map(([id, servicio]) => {
                    const item: ItemPresupuestado = {
                        idServicioCatalogo: id, ...servicio, 
                        precioUnitario: servicio.precioUnitarioOriginal, costoTotalItem: 0 // dummy for calc
                    };
                    const costoItem = calcularCostoItem(item, totalInvitados);

                    return (
                        <div key={id} className="flex justify-between items-center p-2 border-b last:border-b-0">
                           <div className="flex-grow">
                                <p className="font-semibold text-sm">{servicio.nombreServicio}</p>
                                <p className="text-xs text-muted-foreground">{formatCurrency(costoItem)}</p>
                           </div>
                           <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveServicio(id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                    );
                })
            ) : (
                <div className="text-center py-6">
                    <p className="text-muted-foreground">No hay servicios adicionales seleccionados.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="pt-4 mt-4 border-t text-right">
        <p className="text-sm text-muted-foreground">Subtotal de Servicios</p>
        <p className="text-2xl font-bold text-primary">{formatCurrency(totalCalculado)}</p>
      </div>
    </div>
  );
}


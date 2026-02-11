

'use client';

import type { PresupuestoFormData, ItemPresupuestado, Presupuesto } from '@/types/presupuesto';
import type { ServicioEmpresa } from '@/types/empresa';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, PackageSearch, PlusCircle, Search, Trash2, ChefHat, Check, ChevronDown } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Separator } from '@/components/ui/separator';
import type { PaqueteArmadoRapido, ArmadoRapidoConfig } from '@/types/armado-rapido';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import EditServicioForm from '@/components/presupuestos/EditServicioForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import type { FullMenu, MenuItem } from '@/types/catering';
import { MultiSelect } from '@/components/ui/multi-select'; 
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface Paso2ServiciosProps {
  formData: PresupuestoFormData;
  setFormData: Dispatch<SetStateAction<PresupuestoFormData>>;
  serviciosCatalogo: ServicioEmpresa[];
  paquetesBase: PaqueteArmadoRapido[];
  allMenus: FullMenu[];
  onCatalogUpdate: () => Promise<void>;
  totalInvitados: number;
  config: ArmadoRapidoConfig | null;
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

type ServicioSeleccionadoValue = PresupuestoFormData['serviciosSeleccionados'] extends Map<any, infer V> ? V : never;

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

const menuItemToServicioSeleccionado = (item: ServicioEmpresa, invitados: number): ServicioSeleccionadoValue => {
    return {
        cantidad: invitados,
        precioUnitarioOriginal: item.precioPorPersona || 0,
        precioUnitarioPresupuesto: item.precioPorPersona || 0,
        nombreServicio: item.nombre,
        unidad: 'personas',
        categoriaServicio: 'Servicio de catering', // Explicitly set category
        subcategoria: item.subcategoria,
        esRegalo: false,
        calculationMethod: 'porPersona',
        precioPorPersona: item.precioPorPersona || 0,
    };
};

const menuItemToServicioEmpresa = (item: MenuItem & { precioVenta: number }): ServicioEmpresa => {
    return {
        id: item.id,
        nombre: item.name,
        tipoItem: 'Servicio',
        categoria: 'Servicio de catering', // Explicitly set category
        subcategoria: item.type,
        calculationMethod: 'porPersona',
        precioPorPersona: item.precioVenta,
        precioVenta: item.precioVenta,
        precioBase: item.precioVenta,
        valorUnitarioEstimado: item.totalDishCost,
    };
};

// Helper function to decide which guest count to use for an item
function getGuestCountForItem(servicio: { categoriaServicio?: string; subcategoria?: string }, adultos: number, ninosYAdolescentes: number): number {
  const categoria = (servicio.categoriaServicio || '').toLowerCase();
  const subcategoria = (servicio.subcategoria || '').toLowerCase();
  
  if (categoria.includes('infantil') || categoria.includes('adolescente') || subcategoria.includes('infantil') || subcategoria.includes('adolescente')) {
    return ninosYAdolescentes;
  }
  
  if (categoria.includes('plato principal') || subcategoria.includes('plato principal')) {
    return adultos;
  }
  
  return adultos + ninosYAdolescentes;
};


export default function Paso2Servicios({ formData, setFormData, serviciosCatalogo, paquetesBase, allMenus, onCatalogUpdate, totalInvitados, config }: Paso2ServiciosProps) {
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [gastronomiaSearchTerm, setGastronomiaSearchTerm] = useState('');
  const { toast } = useToast();
  
  const [openPrincipal, setOpenPrincipal] = useState(false);
  const [openInfantil, setOpenInfantil] = useState(false);

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
          subcategoria: servicio.subcategoria,
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
                      subcategoria: servicioCompleto.subcategoria,
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

   const { entradasDisponibles, principalesDisponibles, menusNinoDisponibles } = useMemo(() => {
    if (!config || !allMenus.length) {
        return { entradasDisponibles: [], principalesDisponibles: [], menusNinoDisponibles: [] };
    }
    
    const isPlatoVisible = (platoId: string) => {
        const setting = config.platosVisibles?.find(p => p.id === platoId);
        return setting !== undefined ? setting.visible : true;
    };
    
    const sortByPrice = (a: { precioVenta: number }, b: { precioVenta: number }) => a.precioVenta - b.precioVenta;

    const allDishes = Array.from(
      allMenus.flatMap(m => m.items)
      .reduce((map, dish) => {
          if (!map.has(dish.id)) {
              map.set(dish.id, dish);
          }
          return map;
      }, new Map<string, MenuItem>())
      .values()
    );
    
    const visibleDishes = allDishes.filter(d => isPlatoVisible(d.id));
    
    const enhancedDishes = visibleDishes.map(item => ({
        ...item,
        precioVenta: item.suggestedSellingPrice ?? ((item.totalDishCost || 0) * (1 + (item.profitMargin ?? 120) / 100)),
    }));

    return { 
        entradasDisponibles: enhancedDishes.filter(item => item.type === 'Entrada').map(menuItemToServicioEmpresa).sort(sortByPrice), 
        principalesDisponibles: enhancedDishes.filter(item => item.type === 'Plato Principal').map(menuItemToServicioEmpresa).sort(sortByPrice), 
        menusNinoDisponibles: enhancedDishes.filter(item => item.type === 'Menú Infantil/Adolescente').map(menuItemToServicioEmpresa).sort(sortByPrice)
    };
  }, [config, allMenus]);
  
  const handleGastronomicSelectionChange = (type: 'entradas' | 'principal' | 'infantil', selectedIds: string | string[]) => {
      setFormData(prev => {
        const newSelected = new Map(prev.serviciosSeleccionados);
        
        const allDishes = [...entradasDisponibles, ...principalesDisponibles, ...menusNinoDisponibles];
        
        // Define which items to clear based on the type of change
        let itemsToClear: ServicioEmpresa[] = [];
        if (type === 'entradas') {
            // For multi-select, we only remove items that are no longer in `selectedIds`
            const currentEntradas = Array.from(newSelected.keys()).filter(id => entradasDisponibles.some(e => e.id === id));
            const removedEntradas = currentEntradas.filter(id => !selectedIds.includes(id));
            removedEntradas.forEach(id => newSelected.delete(id));
        } else if (type === 'principal') {
            itemsToClear = principalesDisponibles || [];
            itemsToClear.forEach(item => newSelected.delete(item.id));
        } else if (type === 'infantil') {
            itemsToClear = menusNinoDisponibles || [];
            itemsToClear.forEach(item => newSelected.delete(item.id));
        }
        
        const idsToAdd = Array.isArray(selectedIds) ? selectedIds : [selectedIds];
        
        idsToAdd.forEach(id => {
            const dishToAdd = allDishes.find(d => d.id === id);
            if (dishToAdd) {
                const invitados = getGuestCountForItem(dishToAdd, formData.invitadosAdultos || 0, (formData.invitadosNinos || 0) + (formData.invitadosAdolescentes || 0));
                newSelected.set(dishToAdd.id, menuItemToServicioSeleccionado(dishToAdd, invitados));
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
          precioUnitario: item.precioUnitarioPresupuesto,
          costoTotalItem: 0,
        };
        total += calcularCostoItem(itemDataForCalc, formData.invitadosAdultos || 0, formData.invitadosAdolescentes || 0, formData.invitadosNinos || 0);
      });
      return total;
    }, [formData]);

  const selectedPrincipalId = useMemo(() => Array.from(formData.serviciosSeleccionados.keys()).find(id => (principalesDisponibles || []).some(p => p.id === id)) || '', [formData.serviciosSeleccionados, principalesDisponibles]);
  const selectedInfantilId = useMemo(() => Array.from(formData.serviciosSeleccionados.keys()).find(id => (menusNinoDisponibles || []).some(m => m.id === id)) || '', [formData.serviciosSeleccionados, menusNinoDisponibles]);
  
  const gastronomiaFiltrada = useMemo(() => {
      const lowerCaseSearch = gastronomiaSearchTerm.toLowerCase();
      if (!lowerCaseSearch) return { entradas: entradasDisponibles, principales: principalesDisponibles, infantiles: menusNinoDisponibles };
      return {
          entradas: entradasDisponibles.filter(e => e.nombre.toLowerCase().includes(lowerCaseSearch)),
          principales: principalesDisponibles.filter(p => p.nombre.toLowerCase().includes(lowerCaseSearch)),
          infantiles: menusNinoDisponibles.filter(m => m.nombre.toLowerCase().includes(lowerCaseSearch))
      };
  }, [gastronomiaSearchTerm, entradasDisponibles, principalesDisponibles, menusNinoDisponibles]);

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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar plato..."
                    value={gastronomiaSearchTerm}
                    onChange={e => setGastronomiaSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Entradas (Selección múltiple)</Label>
                  <MultiSelect
                    options={(gastronomiaFiltrada.entradas || []).map(e => ({ value: e.id, label: `${e.nombre} (${formatCurrency(e.precioVenta)})` }))}
                    selected={Array.from(formData.serviciosSeleccionados.keys()).filter(id => (gastronomiaFiltrada.entradas || []).some(e => e.id === id))}
                    onValueChange={(selected) => handleGastronomicSelectionChange('entradas', selected)}
                    placeholder="Selecciona las entradas..."
                    className="w-full"
                  />
                </div>
                 <div className='space-y-2'>
                    <Label>Plato Principal (Selección única)</Label>
                    <Popover open={openPrincipal} onOpenChange={setOpenPrincipal}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={openPrincipal} className="w-full justify-between font-normal">
                          {selectedPrincipalId ? (principalesDisponibles.find(p => p.id === selectedPrincipalId)?.nombre) + ` (${formatCurrency(principalesDisponibles.find(p => p.id === selectedPrincipalId)?.precioVenta)})` : "Selecciona un plato principal..."}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar plato principal..." />
                          <CommandList>
                            <CommandEmpty>No se encontraron platos.</CommandEmpty>
                            <CommandGroup>
                              {(gastronomiaFiltrada.principales || []).map(p => (
                                <CommandItem key={p.id} value={p.nombre} onSelect={() => { handleGastronomicSelectionChange('principal', p.id); setOpenPrincipal(false); }}>
                                  <Check className={cn("mr-2 h-4 w-4", selectedPrincipalId === p.id ? "opacity-100" : "opacity-0")} />
                                  {p.nombre} ({formatCurrency(p.precioVenta)})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                 <div className='space-y-2'>
                    <Label>Menú Infantil/Adolescente</Label>
                    <Popover open={openInfantil} onOpenChange={setOpenInfantil}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          role="combobox" 
                          aria-expanded={openInfantil} 
                          className="w-full justify-between font-normal"
                          disabled={(formData.invitadosNinos || 0) + (formData.invitadosAdolescentes || 0) === 0}
                        >
                          {selectedInfantilId ? (menusNinoDisponibles.find(m => m.id === selectedInfantilId)?.nombre) + ` (${formatCurrency(menusNinoDisponibles.find(m => m.id === selectedInfantilId)?.precioVenta)})` : ((formData.invitadosNinos || 0) + (formData.invitadosAdolescentes || 0) > 0 ? "Selecciona un menú..." : "Añade niños/adolescentes en Paso 1")}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar menú infantil..." />
                          <CommandList>
                            <CommandEmpty>No se encontraron menús.</CommandEmpty>
                            <CommandGroup>
                              {(gastronomiaFiltrada.infantiles || []).map(m => (
                                <CommandItem key={m.id} value={m.nombre} onSelect={() => { handleGastronomicSelectionChange('infantil', m.id); setOpenInfantil(false); }}>
                                  <Check className={cn("mr-2 h-4 w-4", selectedInfantilId === m.id ? "opacity-100" : "opacity-0")} />
                                   {m.nombre} ({formatCurrency(m.precioVenta)})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
            <PlusCircle className="w-4 h-4 mr-2"/>Añadir Servicio desde Catálogo
          </Button>
        </div>
        <Card>
          <CardContent className="p-4 space-y-2">
            {Array.from(formData.serviciosSeleccionados.entries()).filter(([id, serv]) => serv.categoriaServicio !== 'Servicio de catering').length > 0 ? (
                Array.from(formData.serviciosSeleccionados.entries())
                  .filter(([id, serv]) => serv.categoriaServicio !== 'Servicio de catering')
                  .map(([id, servicio]) => (
                        <div key={id} className="flex justify-between items-center p-2 border-b last:border-b-0">
                           <p className="font-semibold text-sm">{servicio.nombreServicio}</p>
                           <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveServicio(id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                    ))
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

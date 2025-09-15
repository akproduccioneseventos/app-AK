
'use client';

import type { PresupuestoFormData } from '@/types/presupuesto';
import type { ServicioEmpresa, CategoriaServicio } from '@/types/empresa';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Tag, Search, PackageSearch, Gift, Edit } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import React, { useState, useMemo } from 'react';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from 'next/link';
import type { PaqueteArmadoRapido } from '@/types/armado-rapido';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import EditServicioForm from './EditServicioForm';

interface Paso2ServiciosProps {
  formData: PresupuestoFormData;
  setFormData: Dispatch<SetStateAction<PresupuestoFormData>>;
  serviciosCatalogo: ServicioEmpresa[];
  paquetesBase: PaqueteArmadoRapido[];
  onCatalogUpdate: () => Promise<void>;
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export default function Paso2Servicios({ formData, setFormData, serviciosCatalogo, paquetesBase, onCatalogUpdate }: Paso2ServiciosProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<CategoriaServicio>>(new Set());
  const [isCatalogManagerOpen, setIsCatalogManagerOpen] = useState(false);

  const handleServicioToggle = (servicio: ServicioEmpresa) => {
    setFormData(prev => {
      const newSelected = new Map(prev.serviciosSeleccionados);
      if (newSelected.has(servicio.id)) {
        newSelected.delete(servicio.id);
      } else {
        newSelected.set(servicio.id, {
          cantidad: 1, 
          precioUnitarioOriginal: servicio.precioVenta || 0,
          precioUnitarioPresupuesto: servicio.precioVenta || 0,
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
  
  const handleCategoryFilterToggle = (category: CategoriaServicio) => {
    setSelectedCategories(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(category)) newSelected.delete(category);
      else newSelected.add(category);
      return newSelected;
    });
  };

  const filteredServicios = useMemo(() => {
    return serviciosCatalogo.filter(s => {
      const matchesSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (s.subcategoria && s.subcategoria.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(s.categoria);
      return matchesSearch && matchesCategory;
    });
  }, [serviciosCatalogo, searchTerm, selectedCategories]);
  
  const serviciosAgrupados = useMemo(() => {
    return filteredServicios.reduce((acc, servicio) => {
        const categoria = servicio.categoria || 'Otros';
        const subcategoria = servicio.subcategoria || 'General';
        
        if (!acc[categoria]) {
            acc[categoria] = {};
        }
        if (!acc[categoria][subcategoria]) {
            acc[categoria][subcategoria] = [];
        }
        acc[categoria][subcategoria].push(servicio);
        return acc;
    }, {} as Record<string, Record<string, ServicioEmpresa[]>>);
  }, [filteredServicios]);

  const categoriasOrdenadas = useMemo(() => {
    return Object.keys(serviciosAgrupados).sort();
  }, [serviciosAgrupados]);

  const handlePaqueteSelect = (paquete: PaqueteArmadoRapido | 'none') => {
    const newSelected = new Map<string, typeof formData.serviciosSeleccionados.values().next().value>();
    if (paquete !== 'none') {
        paquete.serviciosIncluidos.forEach(servicioEnPaquete => {
            const servicioCompleto = serviciosCatalogo.find(s => s.id === servicioEnPaquete.id);
            if (servicioCompleto) {
                const esRegalo = servicioEnPaquete.esRegalo || false;
                newSelected.set(servicioCompleto.id, {
                    cantidad: 1,
                    precioUnitarioOriginal: servicioCompleto.precioVenta || 0,
                    precioUnitarioPresupuesto: esRegalo ? 0 : (servicioCompleto.precioVenta || 0),
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

  if (serviciosCatalogo.length === 0) {
    return (
      <div className="text-center py-10">
        <PackageSearch className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground text-lg">Tu catálogo de servicios está vacío.</p>
        <p className="text-sm text-muted-foreground">
          <SheetTrigger asChild>
            <Button variant="link" className="text-primary p-0 h-auto">Haz clic aquí para añadir tu primer servicio</Button>
          </SheetTrigger>
           y poder armar presupuestos.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <div className="space-y-2 self-end">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="secondary" className="w-full">
                        <Sparkles className="w-4 h-4 mr-2"/>Gestionar Catálogo de Servicios
                    </Button>
                </SheetTrigger>
                <SheetContent className="w-full max-w-none sm:max-w-2xl">
                    <SheetHeader>
                        <SheetTitle>Catálogo Maestro de Servicios</SheetTitle>
                        <SheetDescription>Añade, edita o elimina los servicios que ofreces. Los cambios aquí se reflejarán en todos los presupuestos nuevos.</SheetDescription>
                    </SheetHeader>
                    <EditServicioForm onCatalogUpdate={onCatalogUpdate}/>
                </SheetContent>
            </Sheet>
        </div>
      </div>
      <Separator/>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-grow space-y-2">
            <Label htmlFor="search-servicios">Buscar en Catálogo</Label>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="search-servicios" type="text" placeholder="Nombre, categoría o subcategoría..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10"/>
            </div>
        </div>
      </div>
      
      <ScrollArea className="h-[450px] pr-1">
        {categoriasOrdenadas.length > 0 ? (
          <Accordion type="multiple" className="w-full space-y-2" defaultValue={categoriasOrdenadas}>
            {categoriasOrdenadas.map(categoria => (
              <AccordionItem key={categoria} value={categoria} className="border rounded-md shadow-sm bg-card overflow-hidden">
                <AccordionTrigger className="px-4 py-3 text-md font-medium text-primary hover:bg-muted/30 hover:no-underline">
                  <div className="flex items-center gap-2"><Tag className="w-5 h-5 text-primary/80" />{categoria}</div>
                </AccordionTrigger>
                <AccordionContent className="px-2 pt-0 pb-3">
                  <div className="space-y-2 pt-2">
                    {Object.keys(serviciosAgrupados[categoria]).sort().map(subcategoria => (
                      <div key={subcategoria} className="ml-2 pl-3 border-l-2">
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">{subcategoria}</h4>
                        <ul className="space-y-3">
                          {serviciosAgrupados[categoria][subcategoria].map(servicio => {
                            const isSelected = formData.serviciosSeleccionados.has(servicio.id);
                            return (
                              <li key={servicio.id} className="p-3 border rounded-md transition-all bg-background">
                                <div className="flex items-start gap-3">
                                  <Checkbox id={`s-${servicio.id}`} checked={isSelected} onCheckedChange={() => handleServicioToggle(servicio)} className="mt-1 w-5 h-5 shrink-0"/>
                                  <div className="flex-grow">
                                    <Label htmlFor={`s-${servicio.id}`} className="font-medium text-sm cursor-pointer">{servicio.nombre}</Label>
                                    <p className="text-xs text-muted-foreground">
                                      {formatCurrency(servicio.precioVenta || servicio.precioPorPersona || servicio.precioBase)} {servicio.calculationMethod === 'porPersona' ? 'p/p' : (servicio.unidad ? `/ ${servicio.unidad.toLowerCase()}` : '')}
                                    </p>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-10 text-muted-foreground"><Search className="w-12 h-12 mx-auto mb-3 opacity-50"/>No hay servicios que coincidan.</div>
        )}
      </ScrollArea>
    </div>
  );
}
